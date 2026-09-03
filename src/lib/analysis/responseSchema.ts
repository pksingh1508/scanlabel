import { z } from 'zod';

import { ProductAnalysisSchema } from './schema';

/**
 * Derive the OpenRouter `response_format` JSON schema from the single Zod
 * contract so the wire schema can never drift from local validation.
 * Pure module: no network, no secrets.
 */

export const ANALYSIS_SCHEMA_NAME = 'product_analysis';

export function getProductAnalysisJsonSchema(): Record<string, unknown> {
  const derived = z.toJSONSchema(ProductAnalysisSchema) as Record<string, unknown>;
  // `$schema` is a local annotation, not part of the documented wire shape.
  const { $schema: _omitted, ...rest } = derived;
  return rest;
}

export function buildResponseFormat(): {
  type: 'json_schema';
  json_schema: { name: string; strict: true; schema: Record<string, unknown> };
} {
  return {
    type: 'json_schema',
    json_schema: { name: ANALYSIS_SCHEMA_NAME, strict: true, schema: getProductAnalysisJsonSchema() },
  };
}
