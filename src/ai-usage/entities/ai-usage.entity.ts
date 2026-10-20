import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export const AI_USAGE_ENDPOINTS = [
  'chat',
  'transcribe',
  'parse-transaction',
  'parse-transactions',
  'documents',
] as const;
export type AiUsageEndpoint = (typeof AI_USAGE_ENDPOINTS)[number];

/** Una petición a un endpoint de IA y lo que costó (estimado con precios públicos). */
@Entity('ai_usage')
@Index('IDX_finance_ai_usage_user_created', ['userId', 'createdAt'])
export class AiUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 40 })
  endpoint: AiUsageEndpoint;

  @Column({ type: 'varchar', length: 80, nullable: true })
  model: string | null;

  @Column({ type: 'int', default: 1 })
  calls: number;

  @Column({ name: 'input_tokens', type: 'int', default: 0 })
  inputTokens: number;

  @Column({ name: 'cached_tokens', type: 'int', default: 0 })
  cachedTokens: number;

  @Column({ name: 'output_tokens', type: 'int', default: 0 })
  outputTokens: number;

  @Column({
    name: 'cost_usd',
    type: 'numeric',
    precision: 12,
    scale: 6,
    default: 0,
  })
  costUsd: number;

  /** Llamadas de un modelo sin precio conocido (su costo no está en costUsd). */
  @Column({ name: 'unpriced_calls', type: 'int', default: 0 })
  unpricedCalls: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
