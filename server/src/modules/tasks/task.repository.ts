import { getRepository, Repository } from 'typeorm';

import { Task } from 'orm/entities/tasks/Task';
import { TaskStatus } from 'orm/entities/tasks/types';

export type TaskFilter = {
  ownerId?: number;
  status?: TaskStatus;
  search?: string;
};

// `%` and `_` are wildcards in LIKE; user input must not turn into a pattern.
const escapeLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

/**
 * Data access layer for tasks. Everything TypeORM-specific lives here, the service only
 * calls intention-revealing methods.
 */
export class TaskRepository {
  // Resolved lazily: the module is imported before the DB connection is open.
  private get repository(): Repository<Task> {
    return getRepository(Task);
  }

  private baseQuery() {
    // Join only the public owner fields: the password hash never leaves the database layer.
    return this.repository
      .createQueryBuilder('task')
      .leftJoin('task.owner', 'owner')
      .addSelect(['owner.id', 'owner.name', 'owner.email']);
  }

  findMany(filter: TaskFilter): Promise<Task[]> {
    const query = this.baseQuery().orderBy('task.createdAt', 'DESC').addOrderBy('task.id', 'DESC');

    if (filter.ownerId !== undefined) {
      query.andWhere('task.ownerId = :ownerId', { ownerId: filter.ownerId });
    }
    if (filter.status) {
      query.andWhere('task.status = :status', { status: filter.status });
    }
    if (filter.search) {
      query.andWhere('task.title ILIKE :search', { search: `%${escapeLike(filter.search)}%` });
    }
    return query.getMany();
  }

  findById(id: number): Promise<Task | undefined> {
    return this.baseQuery().where('task.id = :id', { id }).getOne();
  }

  create(data: Partial<Task>): Task {
    return this.repository.create(data);
  }

  save(task: Task): Promise<Task> {
    return this.repository.save(task);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
