// lib/utils/assetUri.ts
import { Asset } from 'expo-asset';

/**
 * Resolves a bundled asset to a local file URI, downloading to cache if needed.
 * Pass the result of require('<relative path>') for moduleRef.
 */
export async function getAssetUri(moduleRef: number): Promise<string> {
  const asset = Asset.fromModule(moduleRef);
  await asset.downloadAsync(); // no-op if already bundled/on-disk
  return asset.localUri ?? asset.uri; // local file:// on device
}
