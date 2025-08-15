// daily-planner/lib/ai/llm/inferenceService.ts
import { ModelManager, InstalledModelInfo } from './modelManager';
import { PromptBuilder, SummaryType, JournalEntry } from './promptBuilder';
import { OutputParser, StructuredSummary } from './outputParser';

// Preferred runtime (if present). We keep optional dynamic import for flexibility.
let Transformers: any = null;
try { Transformers = require('react-native-transformers'); } catch {}

let ORT: any = null; // onnxruntime-react-native
try { ORT = require('onnxruntime-react-native'); } catch {}

export type GenerateOptions = {
  maxNewTokens?: number;
  temperature?: number;
  topK?: number;
  topP?: number;
  onToken?: (partialText: string) => void; // streaming callback (if backend supports)
};

export class InferenceService {
  private static _instance: InferenceService | null = null;
  static get instance() { return (this._instance ??= new InferenceService()); }

  private modelInfo: InstalledModelInfo | null = null;
  private pipeline: any | null = null; // transformers pipeline
  private ortSession: any | null = null; // ORT InferenceSession
  private ready = false;

  /** Load model + create runtime session; backend preference: transformers -> ORT */
  async initialize(installedModel: InstalledModelInfo): Promise<void> {
    // Why: keep reference to know local path and cleanup properly later
    this.modelInfo = installedModel;

    if (Transformers?.pipeline) {
      // react-native-transformers summarization pipeline
      try {
        this.pipeline = await Transformers.pipeline('summarization', {
          // Many RN transformers accept a local path to model files
          model: installedModel.uri,
          quantized: true,
        });
        this.ready = true;
        return;
      } catch (e) {
        // Fall back to ORT
        console.warn('Transformers pipeline init failed, falling back to ORT:', e);
      }
    }

    if (ORT?.InferenceSession?.create) {
      try {
        this.ortSession = await ORT.InferenceSession.create(installedModel.uri);
        // NOTE: Real-world: need tokenizer + generation loop; omitted here since ORT alone doesn’t provide it.
        this.ready = true;
        return;
      } catch (e) {
        console.error('ORT session init failed:', e);
        throw e;
      }
    }

    throw new Error('No inference backend available. Install react-native-transformers or onnxruntime-react-native.');
  }

  /** Preload small run to warm kernels and caches */
  async warmup(): Promise<void> {
    if (!this.ready) return;
    if (this.pipeline) {
      try { await this.pipeline('Hello'); } catch {}
    }
    // With ORT, you’d run a tiny forward pass if generation helpers are wired.
  }

  /** Release memory/resources */
  async cleanup(): Promise<void> {
    if (this.pipeline?.dispose) {
      try { this.pipeline.dispose(); } catch {}
    }
    this.pipeline = null;

    if (this.ortSession?.release) {
      try { this.ortSession.release(); } catch {}
    }
    this.ortSession = null;
    this.ready = false;
  }

  /** Main generation flow: build prompt -> run -> parse -> validate -> sanitize */
  async generateSummary(
    type: SummaryType,
    payload: { entries?: JournalEntry[]; weekly?: string[]; monthly?: string[] },
    options?: GenerateOptions
  ): Promise<StructuredSummary> {
    if (!this.ready || !this.modelInfo) throw new Error('InferenceService not initialized');

    // Build prompt by type
    let prompt: string;
    if (type === 'weekly') {
      if (!payload.entries?.length) throw new Error('No entries provided');
      prompt = PromptBuilder.buildWeeklyPrompt(payload.entries);
    } else if (type === 'monthly') {
      if (!payload.weekly?.length) throw new Error('No weekly summaries provided');
      prompt = PromptBuilder.buildMonthlyPrompt(payload.weekly);
    } else {
      if (!payload.monthly?.length) throw new Error('No monthly summaries provided');
      prompt = PromptBuilder.buildYearlyPrompt(payload.monthly);
    }

    // Run inference
    let raw = '';
    if (this.pipeline) {
      // The summarization pipeline typically returns { summary_text }
      const res = await this.pipeline(prompt, {
        max_new_tokens: options?.maxNewTokens ?? 160,
        temperature: options?.temperature ?? 0.7,
        top_k: options?.topK ?? 50,
        top_p: options?.topP ?? 0.95,
        // NOTE: Streaming callbacks depend on backend support
      });
      raw = Array.isArray(res) ? res[0]?.summary_text ?? '' : res?.summary_text ?? '';
    } else if (this.ortSession) {
      // Placeholder path: If using ORT directly, you must tokenize -> run -> detokenize.
      // We return an error that the raw ORT path is not wired for generation.
      throw new Error('ORT backend requires tokenizer/generation glue. Use transformers backend or implement custom generation.');
    } else {
      throw new Error('No runtime backend active');
    }

    // Parse & validate
    try {
      const obj = OutputParser.parseJSON(raw);
      if (!OutputParser.validateSchema(obj)) throw new Error('Schema mismatch');
      return OutputParser.sanitizeContent(obj);
    } catch (_) {
      // Heuristic fallback
      return OutputParser.fallbackParse(raw);
    }
  }
}

// =============================================================
// Example usage (remove in production)
// =============================================================
/**
import { ModelManager } from './modelManager';
import { InferenceService } from './inferenceService';
import { PromptBuilder } from './promptBuilder';

async function bootstrap() {
  const variant = await ModelManager.checkDeviceCompatibility();
  const model = await ModelManager.downloadModel({
    id: `summarizer-t5-${variant}`,
    version: '1.0.0',
    url: 'https://cdn.example.com/models/summarizer-t5-base-int8.onnx',
    sha256: 'EXPECTED_SHA256_HEX',
    sizeBytes: 150_000_000,
    variant,
  }, { wifiOnly: true, onProgress: (p) => console.log('progress', p) });

  const svc = InferenceService.instance;
  await svc.initialize(model);
  await svc.warmup();

  const weekly = await svc.generateSummary('weekly', { entries: [
    { id: '1', dateISO: '2025-08-01', content: 'Ran 5k, felt great. Met Sarah for coffee.' },
    { id: '2', dateISO: '2025-08-03', content: 'Work sprint finished. Learned a lot about TypeScript generics.' },
  ]});

  console.log('Weekly summary', weekly);
  await svc.cleanup();
}
*/
