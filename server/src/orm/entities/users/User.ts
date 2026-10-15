import bcrypt from 'bcryptjs';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

import { Role, Language } from './types';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  // Lengths mirror the CreateUsers migration. Without them the entity drifted from the
  // real schema and `migration:generate` produced DROP COLUMN email/username/name.
  @Column({
    unique: true,
    length: 100,
  })
  email: string;

  @Column()
  password: string;

  @Column({
    nullable: true,
    unique: true,
    length: 40,
  })
  username: string;

  @Column({
    nullable: true,
    length: 40,
  })
  name: string;

  @Column({
    default: 'STANDARD' as Role,
    length: 30,
  })
  role: string;

  @Column({
    default: 'en-US' as Language,
    length: 15,
  })
  language: string;

  @Column()
  @CreateDateColumn()
  created_at: Date;

  @Column()
  @UpdateDateColumn()
  updated_at: Date;

  setLanguage(language: Language) {
    this.language = language;
  }

  hashPassword() {
    this.password = bcrypt.hashSync(this.password, 8);
  }

  checkIfPasswordMatch(unencryptedPassword: string) {
    return bcrypt.compareSync(unencryptedPassword, this.password);
  }
}
