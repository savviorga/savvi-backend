import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Solicitud de recuperación de contraseña. Nunca guarda el código ni el
 * token en claro, solo su hash SHA-256.
 */
@Entity({ name: 'password_resets' })
export class PasswordReset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_finance_password_resets_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'code_hash', type: 'varchar', length: 64 })
  codeHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  /** Intentos fallidos de verificación del código. */
  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  @Index('IDX_finance_password_resets_reset_token_hash')
  @Column({
    name: 'reset_token_hash',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  resetTokenHash: string | null;

  @Column({
    name: 'reset_token_expires_at',
    type: 'timestamptz',
    nullable: true,
  })
  resetTokenExpiresAt: Date | null;

  /** Se marca al usar o invalidar la solicitud; después ya no sirve. */
  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
