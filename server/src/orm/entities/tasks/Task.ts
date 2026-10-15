import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { User } from '../users/User';

import { TaskPriority, TaskStatus } from './types';

// Columns are camelCase in code; SnakeNamingStrategy from ormconfig maps them to
// snake_case in Postgres (dueDate -> due_date, owner -> owner_id).
@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ length: 20, default: 'TODO' as TaskStatus })
  status: TaskStatus;

  @Column({ length: 10, default: 'MEDIUM' as TaskPriority })
  priority: TaskPriority;

  // 'date' comes back from pg as a 'YYYY-MM-DD' string, which is exactly what the API exposes.
  @Column({ type: 'date', nullable: true })
  dueDate: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  owner: User;

  // Every list query filters by owner, so the FK column gets an index.
  @Index()
  @Column()
  ownerId: number;

  // timestamptz, not timestamp: with plain `timestamp` the DB default now() is written in the
  // DB's time zone but read back in Node's, so with Postgres in UTC and Node in Europe/Berlin
  // createdAt came back two hours off while JS-set completedAt was correct.
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
