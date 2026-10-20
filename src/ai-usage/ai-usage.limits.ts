/** Topes por usuario configurables por entorno (USD estimados con precios públicos). */
export interface AiLimits {
  dailyUsd: number;
  monthlyUsd: number;
  requestsPerMinute: number;
}

const read = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

export function getAiLimits(): AiLimits {
  return {
    dailyUsd: read('AI_DAILY_LIMIT_USD', 1),
    monthlyUsd: read('AI_MONTHLY_LIMIT_USD', 10),
    requestsPerMinute: read('AI_REQUESTS_PER_MINUTE', 20),
  };
}
