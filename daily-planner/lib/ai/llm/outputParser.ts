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
    const fenced = output.match(/```(?:json)?\r?\n([\s\S]*?)\r?\n```/i);
    if (fenced?.[1]) {
      try { return JSON.parse(fenced[1]); } catch {}
    }
    // Fallback: first balanced {...} block via brace counting
    const start = output.indexOf('{');
    if (start >= 0) {
      let depth = 0;
      for (let i = start; i < output.length; i++) {
        const ch = output[i];
        if (ch === '{') depth++;
        else if (ch === '}') {
          depth--;
          if (depth === 0) {
            const candidate = output.slice(start, i + 1);
            try { return JSON.parse(candidate); } catch {}
            break; // stop after first balanced block
          }
        }
      }
    }
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
    const scrub = (s: string) => {
      // Remove zero-width chars first
      const noZW = s.replace(/[\u200B-\u200D\uFEFF]/g, '');
      // Drop control chars (0–31) except Tab(9), LF(10), CR(13)
      let out = '';
      for (let i = 0; i < noZW.length; i++) {
        const ch = noZW.charAt(i);
        const code = ch.charCodeAt(0);
        if (code >= 0 && code <= 31 && code !== 9 && code !== 10 && code !== 13) {
          continue;
        }
        out += ch;
      }
      return out.trim();
    };

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