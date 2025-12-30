import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

 export type TransactionFile = {
  filename: string;
  url: string;
  size: number;
  mimeType: string;
};


@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'date' })
    date: Date;

    @Column({ type: 'varchar', length: 50 })
    type: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    amount: number;

    @Column({ type: 'varchar', length: 100 })
    category: string;

    @Column({ type: 'varchar', length: 100 })
    account: string;

    @Column({ type: 'text', nullable: true })
    description: string;
}
