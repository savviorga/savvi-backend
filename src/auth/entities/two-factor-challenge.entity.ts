import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * - `login`: segundo paso del inicio de sesión.
 * - `enable`: confirma el email antes de activar el 2FA.
 */
export type TwoFactorPurpose = 'login' | 'enable';

/**
 * Código enviado por email para el doble factor. Solo guarda hashes SHA-256
 * del código y del token del reto.
 */
@Entity({ name: 'two_factor_challenges' })
export class TwoFactorChallenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_finance_two_factor_challenges_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 20 })
  purpose: TwoFactorPurpose;

  @Column({ name: 'code_hash', type: 'varchar', length: 64 })
  codeHash: string;

  /** Solo en `login`: identifica el reto sin exponer el userId al cliente. */
  @Index('IDX_finance_two_factor_challenges_token_hash')
  @Column({ name: 'token_hash', type: 'varchar', length: 64, nullable: true })
  tokenHash: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  /** Intentos de verificación del código vigente. */
  @Column({ type: 'int', default: 0 })
  attempts: number;

  /** Veces que se envió un código para este reto (incluye reenvíos). */
  @Column({ name: 'send_count', type: 'int', default: 1 })
  sendCount: number;

  @Column({ name: 'last_sent_at', type: 'timestamptz' })
  lastSentAt: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
