import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type AiRegisterJobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';

@Entity('ai_register_jobs')
export class AiRegisterJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'file_key', type: 'varchar', length: 512 })
  fileKey: string;

  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Column({ name: 'mime_type', type: 'varchar', length: 120 })
  mimeType: string;

  @Column({ name: 'user_text', type: 'text', nullable: true })
  userText?: string;

  @Column({ type: 'varchar', length: 20, default: 'queued' })
  status: AiRegisterJobStatus;

  @Column({ type: 'text', nullable: true })
  error?: string | null;

  @Column({ name: 'extracted_payload', type: 'jsonb', nullable: true })
  extractedPayload?: Record<string, unknown>;

  @Column({ name: 'created_transaction_id', type: 'uuid', nullable: true })
  createdTransactionId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
