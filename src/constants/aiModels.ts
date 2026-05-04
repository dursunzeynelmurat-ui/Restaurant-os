export const AI_MODELS = {
  CHEAP: 'claude-haiku-4-5',
  STRONG: 'claude-sonnet-4-6',
} as const;

export type AIModel = (typeof AI_MODELS)[keyof typeof AI_MODELS];
