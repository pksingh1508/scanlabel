/**
 * SERVER-ONLY analysis service: prompt → OpenRouter structured call →
 * validate → deterministic fixes → normalized result.
 *
 * Same import warning as openrouter.ts: only `src/app/api/analyze+api.ts`
 * may import this module. Pure helpers stay in schema/normalize/prompt.
 */

import type { ProductAnalysis } from '@/types/analysis';

import { withStandardDisclaimer } from './normalize';
import { requestStructuredAnalysis, type OpenRouterCallOptions } from './openrouter';
import { buildAnalysisMessages } from './prompt';
import { buildResponseFormat } from './responseSchema';
import type { ValidatedAnalyzeRequest } from './request';
import { parseProductAnalysis } from './schema';

export type AnalysisServiceConfig = {
  apiKey: string;
  model: string;
  siteUrl?: string;
  appName?: string;
  timeoutMs?: number;
  /** Tests only. Production always uses the gateway constant. */
  endpoint?: string;
};

export type AnalysisServiceError =
  | { code: 'provider_unauthorized' }
  | { code: 'rate_limited' }
  | { code: 'provider_unavailable' }
  | { code: 'invalid_result' };

export type AnalyzeScanResult =
  | { ok: true; analysis: ProductAnalysis; attempts: number }
  | { ok: false; error: AnalysisServiceError; attempts: number };

function toOpenRouterOptions(config: AnalysisServiceConfig): OpenRouterCallOptions {
  return {
    apiKey: config.apiKey,
    model: config.model,
    ...(config.siteUrl ? { siteUrl: config.siteUrl } : {}),
    ...(config.appName ? { appName: config.appName } : {}),
    ...(typeof config.timeoutMs === 'number' ? { timeoutMs: config.timeoutMs } : {}),
    ...(config.endpoint ? { endpoint: config.endpoint } : {}),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function cleanStringList(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed.toLowerCase())) continue;
    seen.add(trimmed.toLowerCase());
    out.push(trimmed);
  }
  return out;
}

/**
 * Deterministic post-processing in code, never in the model:
 * round nutrition numbers, tidy string lists, enforce the disclaimer.
 * Verdicts, identities, and missing-vs-present facts are never touched.
 */
export function applyDeterministicFixes(analysis: ProductAnalysis): ProductAnalysis {
  const roundValue = (entry: { value: number | null; unit: string | null }) => ({
    ...entry,
    value: typeof entry.value === 'number' && Number.isFinite(entry.value) ? round2(entry.value) : entry.value,
  });
  return withStandardDisclaimer({
    ...analysis,
    calories: {
      perServingKcal:
        typeof analysis.calories.perServingKcal === 'number' ? round2(analysis.calories.perServingKcal) : null,
      per100gKcal: typeof analysis.calories.per100gKcal === 'number' ? round2(analysis.calories.per100gKcal) : null,
    },
    nutrition: {
      protein: roundValue(analysis.nutrition.protein),
      carbohydrates: roundValue(analysis.nutrition.carbohydrates),
      sugars: roundValue(analysis.nutrition.sugars),
      fat: roundValue(analysis.nutrition.fat),
      saturatedFat: roundValue(analysis.nutrition.saturatedFat),
      fiber: roundValue(analysis.nutrition.fiber),
      sodium: roundValue(analysis.nutrition.sodium),
      salt: roundValue(analysis.nutrition.salt),
    },
    allergens: {
      ...analysis.allergens,
      declared: cleanStringList(analysis.allergens.declared),
      traces: cleanStringList(analysis.allergens.traces),
    },
    labelSignals: {
      ...analysis.labelSignals,
      additives: cleanStringList(analysis.labelSignals.additives),
    },
    positives: cleanStringList(analysis.positives),
    concerns: cleanStringList(analysis.concerns),
  });
}

/**
 * Run structured analysis with at most ONE retry, only for schema failures
 * and transient provider errors. Rate limits and auth failures never retry.
 * Returns the attempt count so callers and tests can audit the policy.
 */
export async function analyzeScan(
  input: ValidatedAnalyzeRequest,
  config: AnalysisServiceConfig,
): Promise<AnalyzeScanResult> {
  const messages = buildAnalysisMessages(input);
  const responseFormat = buildResponseFormat();
  const callOptions = toOpenRouterOptions(config);

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const call = await requestStructuredAnalysis(messages, responseFormat, callOptions);
    if (!call.ok) {
      if (call.error.kind === 'unauthorized') {
        return { ok: false, error: { code: 'provider_unauthorized' }, attempts: attempt };
      }
      if (call.error.kind === 'rate_limited') {
        return { ok: false, error: { code: 'rate_limited' }, attempts: attempt };
      }
      if (call.error.kind === 'bad_request') {
        return { ok: false, error: { code: 'invalid_result' }, attempts: attempt };
      }
      // Transient or unparseable content: one retry, then give up.
      if (attempt === 2) {
        return { ok: false, error: { code: 'provider_unavailable' }, attempts: attempt };
      }
      continue;
    }

    const parsed = parseProductAnalysis(call.content);
    if (!parsed.ok) {
      if (attempt === 2) {
        return { ok: false, error: { code: 'invalid_result' }, attempts: attempt };
      }
      continue;
    }
    return { ok: true, analysis: applyDeterministicFixes(parsed.data), attempts: attempt };
  }
  return { ok: false, error: { code: 'provider_unavailable' }, attempts: 2 };
}
