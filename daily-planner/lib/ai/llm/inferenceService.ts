// lib/ai/llm/inferenceService.ts

import { AppState, AppStateStatus, Platform } from 'react-native';
import {Asset} from 'expo-asset';
import * as Device from 'expo-device';

import {
  LLMError,
  type InferenceInitOptions,
  type GenerationParams,
  type ModelId,
} from './types';
import {
  MODEL_REGISTRY,
  GENERATION_DEFAULTS,
  ORT_WARMUP_PROMPT,
  selectOrtExecutionProviders,
} from './config';
import ModelManager from './modelManager';
import { getTokenizerForModel, assertTokenizerSafeForInference } from './tokenizer';

type ORT = typeof import('onnxruntime-react-native');

type DegradationLevel = 'none' | 'light' | 'heavy' | 'fallbackModel';

type InferenceStatus = {
  loaded: boolean;
  modelId?: ModelId;
  lastUsedAt?: number;
  keepAliveMs: number;
  backgroundReleaseDelayMs: number;
  memoryReleaseThresholdMB: number;
  estimatedAvailableMB?: number;
  degradation?: DegradationLevel;
};

export class InferenceService {
  private ort: ORT | null = null;
  private session: unknown | null = null; // why: ORT types vary across RN versions
  private modelId: ModelId | null = null;
  private deviceProfile: Awaited<ReturnType<typeof ModelManager.checkDeviceCompatibility>>['profile'] | null =
    null;

  private loaded = false;
  private lastUsedAt = 0;

  private keepAliveMs = 5 * 60 * 1000; // 5 minutes
  private backgroundReleaseDelayMs = 30 * 1000; // 30s after background
  private memoryReleaseThresholdMB = 500;

  private keepAliveTimer: ReturnType<typeof setTimeout> | null = null;
  private backgroundTimer: ReturnType<typeof setTimeout> | null = null;
  private appStateSubChange: { remove: () => void } | null = null;
  private appStateSubMem: { remove: () => void } | null = null;

  // ----------------------
  // Public API
  // ----------------------

  async initialize(opts: InferenceInitOptions = {}): Promise<void> {
    if (this.loaded) return;

    const { profile, recommendedModelId } = await ModelManager.checkDeviceCompatibility();
    this.deviceProfile = profile;

    // Phase 2.3 thresholds
    const ram = profile.ramGB ?? (await this.getRamGBSafe());
    const thresholdModel: ModelId =
      ram >= 6
        ? this.mapToModelId('distilbart')
        : ram >= 4
        ? this.mapToModelId('t5-small')
        : this.mapToModelId('smallest');

    const targetModel: ModelId = opts.modelId ?? thresholdModel ?? recommendedModelId;
    this.modelId = targetModel;

    await this.ensureOrtLoaded();

    // Resolve model URI (bundled asset via expo-asset OR remote download)
    const uri = await this.resolveModelUri(targetModel);

    const providers = this.deviceProfile
      ? selectOrtExecutionProviders(this.deviceProfile)
      : ['cpu'];

    this.session = await this.createOrtSession(uri, providers);
    this.loaded = true;
    this.bumpLastUsed();

    // AppState listeners
    this.attachAppStateListeners();

    if (opts.warmup) {
      await this.warmup();
    }
  }

  async warmup(): Promise<void> {
    if (!this.loaded || !this.session) return;
    if (this.modelId) {
      const tok = await getTokenizerForModel(this.modelId);
      if (!tok.lossy) {
        // why: keep warmup minimal to avoid graph coupling
        // Potential place to run a tiny dummy inference if your graph allows.
      }
    }
  }

  async generateSummary(prompt: string, params?: Partial<GenerationParams>): Promise<string> {
    this.requireLoaded();

    // Memory-aware degradation & potential fallback
    const estAvail = await this.estimateAvailableMemoryMB();
    const level = this.chooseDegradationLevel(estAvail);

    const gen: GenerationParams = this.applyDegradation(
      { ...GENERATION_DEFAULTS, ...(params ?? {}) },
      level
    );

    // Guard against lossy tokenizer usage
    if (this.modelId) {
      const tok = await getTokenizerForModel(this.modelId);
      assertTokenizerSafeForInference(tok);
    }

    // Placeholder: wire your ORT graph I/O + sampling loop here.
    this.bumpLastUsed();
    this.scheduleKeepAlive();

    throw new LLMError(
      'INFERENCE_FAILED',
      'ORT text generation not wired. Provide your ONNX graph I/O mapping and sampling loop to enable generation.'
    );
  }

  async cleanup(reason: string = 'manual'): Promise<void> {
    // why: release session under pressure/background to protect stability
    this.clearTimers();

    if (this.session) {
      const s: any = this.session as any;
      try {
        if (typeof s.release === 'function') {
          await s.release();
        } else if (typeof s.dispose === 'function') {
          await s.dispose();
        }
      } catch {
        // ignore
      }
    }

    this.session = null;
    this.loaded = false;

    this.detachAppStateListeners();
  }

  getStatus(): InferenceStatus {
    return {
      loaded: this.loaded,
      modelId: this.modelId ?? undefined,
      lastUsedAt: this.lastUsedAt || undefined,
      keepAliveMs: this.keepAliveMs,
      backgroundReleaseDelayMs: this.backgroundReleaseDelayMs,
      memoryReleaseThresholdMB: this.memoryReleaseThresholdMB,
    };
  }

  setKeepAliveMs(ms: number) {
    this.keepAliveMs = Math.max(10_000, ms);
  }

  setBackgroundReleaseDelayMs(ms: number) {
    this.backgroundReleaseDelayMs = Math.max(5_000, ms);
  }

  setMemoryReleaseThresholdMB(mb: number) {
    this.memoryReleaseThresholdMB = Math.max(128, mb);
  }

  // ----------------------
  // Internal helpers
  // ----------------------

  private async ensureOrtLoaded() {
    if (!this.ort) {
      try {
        this.ort = (await import('onnxruntime-react-native')) as ORT;
      } catch (e) {
        throw new LLMError(
          'INFERENCE_FAILED',
          `onnxruntime-react-native not available: ${(e as Error).message}`
        );
      }
    }
  }

  private async createOrtSession(modelUri: string, providers: string[]) {
    if (!this.ort) throw new Error('ORT not loaded');
    const opts: any = {
      executionProviders: providers,
      graphOptimizationLevel: 'all',
    };
    let s: unknown;
    try {
      s = await (this.ort as any).InferenceSession.create(modelUri, opts);
    } catch (e) {
      throw new LLMError(
        'INFERENCE_FAILED',
        `Failed to create ORT session (uri=${modelUri}, providers=${providers.join(
          ','
        )}): ${(e as Error).message}`
      );
    }    return s as unknown;
  }

  private attachAppStateListeners() {
    this.detachAppStateListeners();

    this.appStateSubChange = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'background') {
        this.scheduleBackgroundRelease();
      } else if (state === 'active') {
        if (this.backgroundTimer) {
          clearTimeout(this.backgroundTimer);
          this.backgroundTimer = null;
        }
      }
    });

    // iOS memory warnings (cast for RN typing variance)
    const AppStateAny = AppState as unknown as {
      addEventListener: (type: string, handler: () => void) => { remove: () => void };
    };
    this.appStateSubMem = AppStateAny.addEventListener('memoryWarning', () => {
      void this.handleMemoryPressure('memoryWarning');
    });
  }

  private detachAppStateListeners() {
    this.appStateSubChange?.remove?.();
    this.appStateSubMem?.remove?.();
    this.appStateSubChange = null;
    this.appStateSubMem = null;
  }

  private scheduleKeepAlive() {
    if (this.keepAliveTimer) clearTimeout(this.keepAliveTimer);
    this.keepAliveTimer = setTimeout(() => {
      void this.cleanup('idle-timeout');
    }, this.keepAliveMs);
  }

  private scheduleBackgroundRelease() {
    if (this.backgroundTimer) clearTimeout(this.backgroundTimer);
    this.backgroundTimer = setTimeout(() => {
      void this.cleanup('app-background');
    }, this.backgroundReleaseDelayMs);
  }

  private bumpLastUsed() {
    this.lastUsedAt = Date.now();
  }

  private requireLoaded() {
    if (!this.loaded || !this.session || !this.modelId) {
      throw new LLMError('INFERENCE_FAILED', 'Inference session is not initialized.');
    }
  }

  private clearTimers() {
    if (this.keepAliveTimer) clearTimeout(this.keepAliveTimer);
    if (this.backgroundTimer) clearTimeout(this.backgroundTimer);
    this.keepAliveTimer = null;
    this.backgroundTimer = null;
  }

  private async getRamGBSafe(): Promise<number> {
    try {
      const bytes = await Device.getMaxMemoryAsync();
      const gb = bytes > 0 ? bytes / (1024 ** 3) : 1;
      return Math.max(1, Math.round(gb));
    } catch {
      return 1;
    }
  }

  private currentModelFootprintMB(): number {
    if (!this.modelId) return 0;
    const spec = MODEL_REGISTRY[this.modelId];
    if (!spec) return 0;
    const overheadMultiplier = 1.8; // why: runtime buffers + KV cache
    return Math.ceil(spec.sizeMB * overheadMultiplier);
  }

  private async estimateAvailableMemoryMB(): Promise<number> {
    const ramGB = this.deviceProfile?.ramGB ?? (await this.getRamGBSafe());
    const totalMB = ramGB * 1024;
    const osReserveMB = Platform.OS === 'android' ? 1536 : 1024;
    const modelMB = this.currentModelFootprintMB();
    const safetyMB = 256;
    const est = totalMB - osReserveMB - modelMB - safetyMB;
    return Math.max(0, est);
  }

  private chooseDegradationLevel(availableMB: number): DegradationLevel {
    if (availableMB >= this.memoryReleaseThresholdMB + 300) return 'none';
    if (availableMB >= this.memoryReleaseThresholdMB) return 'light';
    if (availableMB >= this.memoryReleaseThresholdMB - 100) return 'heavy';
    return 'fallbackModel';
  }

  private applyDegradation(
    base: GenerationParams,
    level: DegradationLevel
  ): GenerationParams {
    if (level === 'none') return base;

    if (level === 'light') {
      return {
        ...base,
        maxNewTokens: Math.max(128, Math.floor(base.maxNewTokens * 0.75)),
        top_k: Math.min(base.top_k, 40),
      };
    }

    if (level === 'heavy') {
      return {
        ...base,
        maxNewTokens: Math.min(128, base.maxNewTokens),
        temperature: Math.min(base.temperature, 0.7),
        top_p: Math.min(base.top_p, 0.9),
        top_k: Math.min(base.top_k, 32),
      };
    }

    void this.fallbackToSmallerModel();
    return {
      ...base,
      maxNewTokens: Math.min(96, base.maxNewTokens),
      temperature: Math.min(base.temperature, 0.6),
      top_p: Math.min(base.top_p, 0.85),
      top_k: Math.min(base.top_k, 24),
    };
  }

  private async fallbackToSmallerModel(): Promise<void> {
    if (!this.modelId) return;
    const smaller = this.nextSmallerModel(this.modelId);
    if (!smaller || smaller === this.modelId) return;

    try {
      await this.swapModel(smaller);
    } catch {
      // ignore swap failure; degraded params still applied
    }
  }

  private nextSmallerModel(current: ModelId): ModelId | null {
    const entries = Object.values(MODEL_REGISTRY).sort((a, b) => a.sizeMB - b.sizeMB);
    const idx = entries.findIndex((e) => e.id === current);
    if (idx <= 0) return null;
    return entries[idx - 1].id as ModelId;
  }

  private async swapModel(newModelId: ModelId): Promise<void> {
    await this.cleanup('swap-model');

    this.modelId = newModelId;
    await this.ensureOrtLoaded();
    const uri = await this.resolveModelUri(newModelId);

    const providers = this.deviceProfile
      ? selectOrtExecutionProviders(this.deviceProfile)
      : ['cpu'];

    this.session = await this.createOrtSession(uri, providers);
    this.loaded = true;
    this.bumpLastUsed();
    this.scheduleKeepAlive();
  }

  private async handleMemoryPressure(_source: 'memoryWarning' | 'estimateBelowThreshold') {
    await this.cleanup(_source);
  }

  private mapToModelId(kind: 't5-small' | 'distilbart' | 'smallest'): ModelId {
    const sorted = Object.values(MODEL_REGISTRY).sort((a, b) => a.sizeMB - b.sizeMB);
    if (kind === 'smallest') return sorted[0].id as ModelId;

    const pickBySize = (min: number, max: number) =>
      sorted.find((m) => m.sizeMB >= min && m.sizeMB <= max)?.id ??
      sorted.find((m) => m.sizeMB >= min)?.id ??
      sorted[0].id;

    if (kind === 't5-small') return pickBySize(110, 140) as ModelId;
    return (pickBySize(140, 200) as ModelId) ?? (sorted[sorted.length - 1].id as ModelId);
  }
  /**
   * Resolve a usable model URI for ORT.
   * - If the registry entry exposes a bundled asset (numeric module id), resolve with expo-asset.
   * - Otherwise, download (or fetch from cache) via ModelManager and return its file:// URI.
   *
   * Expected registry shape (partial):
   * {
   *   id: ModelId,
   *   sizeMB: number,
   *   assetModule?: number,     // e.g., require('@/assets/models/tiny.onnx')
   *   sourceURL?: string,       // for remote downloads
   *   sha256?: string           // optional integrity for remote
   * }
   */
  private async resolveModelUri(mid: ModelId): Promise<string> {
    const spec: any = MODEL_REGISTRY[mid];
    if (!spec) {
      throw new LLMError('INFERENCE_FAILED', `Model spec not found for id "${mid}".`);
    }

    // Bundled (preferred): resolve with expo-asset to a local file:// path
    if (typeof spec.assetModule === 'number') {
      const asset = Asset.fromModule(spec.assetModule);
      // no-op if already local; downloads to cache in dev or if remote fallback
      await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;
      if (!uri) throw new LLMError('INFERENCE_FAILED', `Failed to resolve asset URI for "${mid}".`);
      return uri;
    }

    // Remote: delegate to ModelManager
    const { uri } = await ModelManager.downloadModel(mid, { skipVerify: !spec.sha256 });
    return uri;
  }
}

export const inferenceService = new InferenceService();
export default inferenceService;
