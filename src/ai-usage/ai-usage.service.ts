import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiUsage } from './entities/ai-usage.entity';
import { RecordAiUsageDto } from './dto/record-ai-usage.dto';
import { getAiLimits } from './ai-usage.limits';
import { startOfBogotaDay, startOfBogotaMonth } from '../common/bogota-time';

export type AiQuotaReason = 'monthly' | 'daily' | 'rate';

export interface AiQuotaStatus {
  allowed: boolean;
  reason: AiQuotaReason | null;
  message: string | null;
  spentTodayUsd: number;
  spentMonthUsd: number;
  dailyLimitUsd: number;
  monthlyLimitUsd: number;
  requestsLastMinute: number;
  requestsPerMinute: number;
}

export interface UsageTotals {
  calls: number;
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  costUsd: number;
  unpricedCalls: number;
}

const num = (value: unknown) => Number(value ?? 0) || 0;
const round6 = (value: number) => Math.round(value * 1e6) / 1e6;

const QUOTA_MESSAGES: Record<AiQuotaReason, string> = {
  monthly:
    'Llegaste al límite mensual de uso de Savvi IA. Se renueva el primer día del próximo mes.',
  daily:
    'Llegaste al límite diario de uso de Savvi IA. Vuelve mañana para seguir conversando.',
  rate: 'Vas muy rápido: espera un minuto antes de enviar otro mensaje a Savvi IA.',
};

/**
 * Consumo de IA por usuario: el servidor de Next registra cada petición y
 * consulta la cuota antes de llamar al modelo. El navegador solo lo lee.
 */
@Injectable()
export class AiUsageService {
  constructor(
    @InjectRepository(AiUsage)
    private readonly usageRepository: Repository<AiUsage>,
  ) {}

  async record(userId: string, dto: RecordAiUsageDto): Promise<void> {
    await this.usageRepository.insert({
      userId,
      endpoint: dto.endpoint,
      model: dto.model ?? null,
      calls: dto.calls,
      inputTokens: dto.inputTokens,
      cachedTokens: Math.min(dto.cachedTokens, dto.inputTokens),
      outputTokens: dto.outputTokens,
      costUsd: round6(dto.costUsd),
      unpricedCalls: dto.unpricedCalls ?? 0,
    });
  }

  async getQuota(userId: string, now = new Date()): Promise<AiQuotaStatus> {
    const limits = getAiLimits();
    const row = await this.usageRepository
      .createQueryBuilder('u')
      .select(
        'COALESCE(SUM(u.costUsd) FILTER (WHERE u.createdAt >= :day), 0)',
        'day',
      )
      .addSelect('COALESCE(SUM(u.costUsd), 0)', 'month')
      .addSelect('COUNT(*) FILTER (WHERE u.createdAt >= :minute)', 'lastMinute')
      .where('u.userId = :userId', { userId })
      .andWhere('u.createdAt >= :month')
      .setParameters({
        day: startOfBogotaDay(now),
        month: startOfBogotaMonth(now),
        minute: new Date(now.getTime() - 60_000),
      })
      .getRawOne<{ day: string; month: string; lastMinute: string }>();

    const spentTodayUsd = round6(num(row?.day));
    const spentMonthUsd = round6(num(row?.month));
    const requestsLastMinute = num(row?.lastMinute);

    const reason: AiQuotaReason | null =
      spentMonthUsd >= limits.monthlyUsd
        ? 'monthly'
        : spentTodayUsd >= limits.dailyUsd
          ? 'daily'
          : requestsLastMinute >= limits.requestsPerMinute
            ? 'rate'
            : null;

    return {
      allowed: reason === null,
      reason,
      message: reason ? QUOTA_MESSAGES[reason] : null,
      spentTodayUsd,
      spentMonthUsd,
      dailyLimitUsd: limits.dailyUsd,
      monthlyLimitUsd: limits.monthlyUsd,
      requestsLastMinute,
      requestsPerMinute: limits.requestsPerMinute,
    };
  }

  /** Acumulado del mes y total histórico, para el panel de consumo del chat. */
  async getSummary(userId: string, now = new Date()) {
    const [month, lifetime, last] = await Promise.all([
      this.totals(userId, startOfBogotaMonth(now)),
      this.totals(userId),
      this.usageRepository.findOne({
        where: { userId },
        order: { createdAt: 'DESC' },
        select: { model: true },
      }),
    ]);
    const quota = await this.getQuota(userId, now);
    return { model: last?.model ?? null, month, lifetime, quota };
  }

  private async totals(userId: string, since?: Date): Promise<UsageTotals> {
    const query = this.usageRepository
      .createQueryBuilder('u')
      .select('COALESCE(SUM(u.calls), 0)', 'calls')
      .addSelect('COALESCE(SUM(u.inputTokens), 0)', 'inputTokens')
      .addSelect('COALESCE(SUM(u.cachedTokens), 0)', 'cachedTokens')
      .addSelect('COALESCE(SUM(u.outputTokens), 0)', 'outputTokens')
      .addSelect('COALESCE(SUM(u.costUsd), 0)', 'costUsd')
      .addSelect('COALESCE(SUM(u.unpricedCalls), 0)', 'unpricedCalls')
      .where('u.userId = :userId', { userId });
    if (since) query.andWhere('u.createdAt >= :since', { since });
    const row = await query.getRawOne<Record<keyof UsageTotals, string>>();
    return {
      calls: num(row?.calls),
      inputTokens: num(row?.inputTokens),
      cachedTokens: num(row?.cachedTokens),
      outputTokens: num(row?.outputTokens),
      costUsd: round6(num(row?.costUsd)),
      unpricedCalls: num(row?.unpricedCalls),
    };
  }
}
