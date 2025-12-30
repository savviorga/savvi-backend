import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
// import { User } from "../users/user.entity";

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Column({ type: "varchar", nullable: true })
  icon?: string;

  @Column({ type: "varchar", nullable: true })
  color?: string; // hex or tailwind color

  @Column({ type: "text", nullable: true })
  description?: string;

  // Parent / Children relation (hierarchical categories)
  @ManyToOne(() => Category, (category) => category.children, { nullable: true })
  parent?: Category;

  @OneToMany(() => Category, (category) => category.parent)
  children?: Category[];

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  budgetLimit?: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDefault: boolean;

//  @ManyToOne(() => User, (user) => user.categories, { nullable: true })
//  user?: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
