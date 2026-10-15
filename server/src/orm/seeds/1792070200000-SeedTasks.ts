import { MigrationInterface, QueryRunner, getRepository } from 'typeorm';

import { Task } from '../entities/tasks/Task';
import { User } from '../entities/users/User';

type SeedTask = Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'dueDate'> & {
  ownerEmail: string;
  completedAt?: string;
};

const SEED_TASKS: SeedTask[] = [
  {
    ownerEmail: 'standard@standard.com',
    title: 'Підготувати звіт з практики',
    description: 'Описати хід роботи, додати скріншоти та висновки.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: '2026-10-20',
  },
  {
    ownerEmail: 'standard@standard.com',
    title: 'Написати e2e-тест для CRUD',
    description: 'Створення, редагування та видалення задачі через UI.',
    status: 'TODO',
    priority: 'HIGH',
    dueDate: '2026-10-25',
  },
  {
    ownerEmail: 'standard@standard.com',
    title: 'Налаштувати CI для репозиторію',
    description: 'GitHub Actions: лінтер і тести на кожен push.',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: null,
  },
  {
    ownerEmail: 'standard@standard.com',
    title: 'Розібратися з міграціями TypeORM',
    description: null,
    status: 'DONE',
    priority: 'LOW',
    dueDate: '2026-10-10',
    completedAt: '2026-10-10T15:00:00Z',
  },
  {
    ownerEmail: 'admin@admin.com',
    title: 'Перевірити роботи студентів',
    description: 'Практика з конструювання ПЗ.',
    status: 'TODO',
    priority: 'HIGH',
    dueDate: '2026-10-30',
  },
];

export class SeedTasks1792070200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const userRepository = getRepository(User);
    const taskRepository = getRepository(Task);

    for (const { ownerEmail, completedAt, ...data } of SEED_TASKS) {
      const owner = await userRepository.findOne({ where: { email: ownerEmail } });
      if (!owner) continue;
      const task = taskRepository.create({
        ...data,
        ownerId: owner.id,
        // fixed dates keep the demo data identical on every machine
        completedAt: completedAt ? new Date(completedAt) : null,
      });
      await taskRepository.save(task);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "tasks" WHERE "title" = ANY($1)`, [SEED_TASKS.map((t) => t.title)]);
  }
}
