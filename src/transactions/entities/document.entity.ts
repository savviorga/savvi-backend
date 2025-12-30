import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'bigint' })
  size: number; // bytes

  @Column({ type: 'varchar', length: 255 })
  bucket: string;

  @Column({ type: 'varchar', length: 512, name: 'key_s3' })
  keyS3: string;

  @Column({ type: 'varchar', length: 100 })
  module: string;

  @Column({ name: 'ref_id', type: 'varchar', length: 50 })
  refId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
