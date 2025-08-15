// daily-planner/lib/ai/llm/modelManager.ts

import * as FileSystem from 'expo-file-system';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

import {
  LLMError,
  type DownloadProgress,
  type DeviceProfile,
  type ModelId,
} from './types';
import {
  MODEL_DIR,
  CACHE_DIR,
  MODEL_REGISTRY,
  selectModelForDevice,
} from './config';

/**
 * WHY: Avoid union pitfalls from FileSystem.getInfoAsync()'s return type.
 */
async function getFileSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists && !info.isDirectory && typeof info.size === 'number') {
    return info.size;
  }
  return 0;
}

/**
 * WHY: expo-device provides getMaxMemoryAsync(); normalize to rounded GB.
 */
async function getDeviceRamGB(): Promise<number> {
  try {
    const bytes = await Device.getMaxMemoryAsync();
    const gb = bytes > 0 ? bytes / (1024 ** 3) : 1;
    return Math.max(1, Math.round(gb));
  } catch {
    return 1;
  }
}

function joinUri(...parts: string[]): string {
  return parts.join('');
}

function appDirectory(): string {
  // documentDirectory is sandboxed per app; safe place for models.
  const base = FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? 'file:///';
  return base;
}

async function ensureDir(uri: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(uri, { intermediates: true });
  }
}

function getModelFileName(modelId: ModelId): string {
  return `${modelId}.onnx`;
}

function getDirs() {
  const base = appDirectory();
  const modelDir = joinUri(base, MODEL_DIR, '/');
  const cacheDir = joinUri(base, CACHE_DIR, '/');
  return { base, modelDir, cacheDir };
}

export type InstalledModelInfo = {
  modelId: ModelId;
  uri: string;
  exists: boolean;
  size: number;
  verified?: boolean;
};

export type DownloadOptions = {
  onProgress?: (p: DownloadProgress) => void;
  skipVerify?: boolean;
};

export class ModelManager {
  static async initializeStorage(): Promise<void> {
    const { modelDir, cacheDir } = getDirs();
    await ensureDir(modelDir);
    await ensureDir(cacheDir);
  }

  static modelPath(modelId: ModelId): string {
    const { modelDir } = getDirs();
    return joinUri(modelDir, getModelFileName(modelId));
  }

  static tempPath(modelId: ModelId): string {
    const { cacheDir } = getDirs();
    return joinUri(cacheDir, `${modelId}.onnx.part`);
  }

  static async getInstalledModel(modelId: ModelId): Promise<InstalledModelInfo> {
    const uri = this.modelPath(modelId);
    const size = await getFileSize(uri);
    return {
      modelId,
      uri,
      exists: size > 0,
      size,
    };
  }

  /**
   * WHY: Some CDNs need headers to support resuming; we rely on Expo's DownloadResumable.
   */
  static async downloadModel(modelId: ModelId, opts: DownloadOptions = {}): Promise<InstalledModelInfo> {
    const spec = MODEL_REGISTRY[modelId];
    if (!spec) throw new LLMError('DOWNLOAD_FAILED', `Unknown model: ${modelId}`);

    await this.initializeStorage();

    const destUri = this.modelPath(modelId);
    const tmpUri = this.tempPath(modelId);

    // Early exit if already installed.
    const installed = await this.getInstalledModel(modelId);
    if (installed.exists) {
      if (!opts.skipVerify) {
        const verified = await this.verifyModel(modelId);
        if (!verified && spec.sha256) {
          // Corrupt; remove and re-download.
          await FileSystem.deleteAsync(destUri, { idempotent: true });
        } else {
          return { ...installed, verified };
        }
      } else {
        return installed;
      }
    }

    opts.onProgress?.({
      totalBytes: spec.sizeMB * 1024 * 1024,
      receivedBytes: 0,
      pct: 0,
      state: 'starting',
    });

    // Ensure temp dir exists.
    const { cacheDir } = getDirs();
    await ensureDir(cacheDir);

    const resumable = FileSystem.createDownloadResumable(
      spec.sourceURL,
      tmpUri,
      {},
      (progress) => {
        const received = progress.totalBytesWritten;
        const total = progress.totalBytesExpectedToWrite || spec.sizeMB * 1024 * 1024;
        const pct = total > 0 ? received / total : 0;
        opts.onProgress?.({
          totalBytes: total,
          receivedBytes: received,
          pct,
          state: 'downloading',
        });
      }
    );

    try {
      await resumable.downloadAsync();
    } catch (e) {
      // Attempt resume once if network hiccup.
      try {
        await resumable.resumeAsync();
      } catch {
        throw new LLMError('DOWNLOAD_FAILED', `Failed to download ${modelId}: ${(e as Error).message}`);
      }
    }

    // Move temp → final atomically.
    await FileSystem.moveAsync({ from: tmpUri, to: destUri });

    opts.onProgress?.({
      totalBytes: spec.sizeMB * 1024 * 1024,
      receivedBytes: spec.sizeMB * 1024 * 1024,
      pct: 1,
      state: 'verifying',
    });

    const verified = opts.skipVerify ? true : await this.verifyModel(modelId);

    if (!verified) {
      // Verification failed: remove corrupt file and emit error
      try {
        await FileSystem.deleteAsync(destUri, { idempotent: true });
      } catch {}

      // Best-effort: if a non-shared parent directory is now empty, remove it
      try {
        const lastSlash = destUri.lastIndexOf('/') + 1;
        const parentDir = destUri.slice(0, lastSlash);
        const { modelDir } = getDirs();
        if (parentDir !== modelDir) {
          const contents = await FileSystem.readDirectoryAsync(parentDir);
          if (contents.length === 0) {
            await FileSystem.deleteAsync(parentDir, { idempotent: true });
          }
        }
      } catch {
        // ignore cleanup failures
      }

      // Progress: error state
      (opts.onProgress as any)?.({
        totalBytes: spec.sizeMB * 1024 * 1024,
        receivedBytes: spec.sizeMB * 1024 * 1024,
        pct: 0,
        state: 'error',
        error: `Verification failed for ${modelId}`,
      } as any);

      throw new LLMError('VERIFY_FAILED', `Hash verification failed for ${modelId}`);
    }

    // Only mark done after a successful verify
    opts.onProgress?.({
      totalBytes: spec.sizeMB * 1024 * 1024,
      receivedBytes: spec.sizeMB * 1024 * 1024,
      pct: 1,
      state: 'done',
    });

    const size = await getFileSize(destUri);
    return { modelId, uri: destUri, exists: size > 0, size, verified };
  }

  /**
   * WHY: Simple whole-file hash; replace with native/streaming when available.
   */
  static async verifyModel(modelId: ModelId): Promise<boolean> {
    const spec = MODEL_REGISTRY[modelId];
    if (!spec) throw new LLMError('VERIFY_FAILED', `Unknown model: ${modelId}`);
    if (!spec.sha256 || spec.sha256.trim().length === 0) return true;

    const uri = this.modelPath(modelId);
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists || info.isDirectory) return false;

    // Read as Base64, decode to raw bytes, hash bytes → hex
    const b64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const bytes = base64ToBytes(b64); // Uint8Array
    const hex = bytesToHex(sha256(bytes)).toLowerCase();
    const expected = spec.sha256.toLowerCase().trim();
    return hex === expected;
  }

  static async deleteModel(modelId: ModelId): Promise<void> {
    const destUri = this.modelPath(modelId);
    const tmpUri = this.tempPath(modelId);
    await FileSystem.deleteAsync(destUri, { idempotent: true });
    await FileSystem.deleteAsync(tmpUri, { idempotent: true });
  }

  /**
   * WHY: Normalize platform features for selection.
   */
  static async checkDeviceCompatibility(): Promise<{
    profile: DeviceProfile;
    recommendedModelId: ModelId;
  }> {
    const ramGB = await getDeviceRamGB();

    const profile: DeviceProfile = {
      os:
        Platform.OS === 'ios'
          ? 'ios'
          : Platform.OS === 'android'
          ? 'android'
          : Platform.OS === 'web'
          ? 'web'
          : Platform.OS === 'windows'
          ? 'windows'
          : 'macos',
      arch: Device.modelName ?? undefined,
      ramGB,
      cores: Device.deviceYearClass ?? undefined,
      hasNEON: true, // most ARM devices
      hasNNAPI: Platform.OS === 'android',
      hasCoreML: Platform.OS === 'ios',
      hasDirectML: Platform.OS === 'windows',
    };

    const recommendedModelId = selectModelForDevice(profile);
    return { profile, recommendedModelId };
  }
}

export default ModelManager;

/**
 * Minimal Base64 → Uint8Array decoder (no atob/Buffer dependency).
 * Accepts standard Base64 with '=' padding.
 */
function base64ToBytes(b64: string): Uint8Array {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const table = new Uint8Array(256);
  table.fill(255);
  for (let i = 0; i < alphabet.length; i++) table[alphabet.charCodeAt(i)] = i;
  // strip whitespace/newlines
  b64 = b64.replace(/\s+/g, '');
  // handle padding
  const pad = (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);
  const len = b64.length;
  const outLen = ((len / 4) * 3) - pad;
  const out = new Uint8Array(outLen);
  let o = 0;
  for (let i = 0; i < len; i += 4) {
    const c0 = table[b64.charCodeAt(i)];
    const c1 = table[b64.charCodeAt(i + 1)];
    const c2 = table[b64.charCodeAt(i + 2)];
    const c3 = table[b64.charCodeAt(i + 3)];
    const n = (c0 << 18) | (c1 << 12) | ((c2 & 63) << 6) | (c3 & 63);
    if (o < outLen) out[o++] = (n >> 16) & 255;
    if (o < outLen) out[o++] = (n >> 8) & 255;
    if (o < outLen) out[o++] = n & 255;
  }
  return out;
}
