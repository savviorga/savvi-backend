import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'boolean', default: false })
  twoFactorEnabled: boolean;

  /** Contraseñas incorrectas seguidas; se reinicia al entrar o al bloquear. */
  @Column({ type: 'int', default: 0, select: false })
  failedLoginAttempts: number;

  /** Hasta cuándo el login está bloqueado por demasiados intentos fallidos. */
  @Column({ type: 'timestamptz', nullable: true, select: false })
  lockedUntil: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
