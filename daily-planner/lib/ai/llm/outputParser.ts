// daily-planner/lib/ai/llm/outputParser.ts

export type StructuredSummary = {
  summary: string;
  highlights: string[];
  themes: string[];
  action_items: string[];
  tone: string;
};

export class OutputParser {
  /** Extract JSON substring (handles fenced and unfenced) */
  static parseJSON(output: string): unknown {
    const fenced = output.match(/```(?:json)?\n([\s\S]*?)\n```/i);
    if (fenced?.[1]) {
      try { return JSON.parse(fenced[1]); } catch {}
    }
    // Fallback: first {...} block
    const firstBrace = output.indexOf('{');
    const lastBrace = output.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const candidate = output.slice(firstBrace, lastBrace + 1);
      try { return JSON.parse(candidate); } catch {}
    }
    throw new Error('No JSON found in model output');
  }

  /** Simple runtime schema validation */
  static validateSchema(obj: any): obj is StructuredSummary {
    const isStrArr = (x: any) => Array.isArray(x) && x.every((i) => typeof i === 'string');
    return (
      obj &&
      typeof obj.summary === 'string' &&
      isStrArr(obj.highlights) &&
      isStrArr(obj.themes) &&
      isStrArr(obj.action_items) &&
      typeof obj.tone === 'string'
    );
  }

  /** Remove problematic content; conservative sanitization */
  static sanitizeContent<T extends StructuredSummary>(obj: T): T {
    const scrub = (s: string) =>
      s
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, '') // ctrl
        .trim();

    return {
      ...obj,
      summary: scrub(obj.summary).slice(0, 4000), // guard overly long output
      highlights: obj.highlights.map(scrub).filter(Boolean),
      themes: obj.themes.map(scrub).filter(Boolean),
      action_items: obj.action_items.map(scrub).filter(Boolean),
      tone: scrub(obj.tone),
    } as T;
  }

  /** Heuristic extraction if JSON failed */
  static fallbackParse(output: string): StructuredSummary {
    const lines = output
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const bullets = lines.filter((l) => /^[-*•]/.test(l)).map((l) => l.replace(/^[-*•]\s?/, ''));
    const summary = lines.slice(0, 5).join(' ');

    return OutputParser.sanitizeContent({
      summary,
      highlights: bullets.slice(0, 5),
      themes: [],
      action_items: bullets.slice(5, 10),
      tone: 'neutral',
    });
  }
}