import { Task } from 'orm/entities/tasks/Task';
import { JwtPayload } from 'types/JwtPayload';
import { CustomError } from 'utils/response/custom-error/CustomError';

import { CreateTaskDto, TaskListQuery, UpdateTaskDto } from './task.dto';
import { TaskRepository } from './task.repository';

export type CurrentUser = Pick<JwtPayload, 'id' | 'role'>;

const isAdmin = (user: CurrentUser) => user.role === 'ADMINISTRATOR';

// Business rule: completedAt is owned by the server. It is stamped when a task becomes
// DONE and cleared when the task is reopened.
const syncCompletion = (task: Task) => {
  task.completedAt = task.status === 'DONE' ? task.completedAt ?? new Date() : null;
};

/**
 * Business logic for tasks. Knows nothing about Express: it receives plain data and the
 * current user, and throws CustomError when a rule is broken.
 */
export class TaskService {
  constructor(private readonly tasks: TaskRepository) {}

  /** Standard users see only their own tasks, administrators see everything. */
  list(user: CurrentUser, query: TaskListQuery): Promise<Task[]> {
    return this.tasks.findMany({ ...query, ownerId: isAdmin(user) ? undefined : user.id });
  }

  /**
   * Somebody else's task is reported as "not found" rather than "forbidden",
   * so the API does not reveal which ids exist.
   */
  async get(user: CurrentUser, id: number): Promise<Task> {
    const task = await this.tasks.findById(id);
    if (!task || (!isAdmin(user) && task.ownerId !== user.id)) {
      throw new CustomError(404, 'General', 'Not Found', [`Task with id:${id} doesn't exist.`]);
    }
    return task;
  }

  async create(user: CurrentUser, dto: CreateTaskDto): Promise<Task> {
    const task = this.tasks.create({
      title: dto.title,
      description: dto.description ?? null,
      status: dto.status ?? 'TODO',
      priority: dto.priority ?? 'MEDIUM',
      dueDate: dto.dueDate ?? null,
      ownerId: user.id,
    });
    syncCompletion(task);
    const saved = await this.tasks.save(task);
    return this.get(user, saved.id);
  }

  async update(user: CurrentUser, id: number, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.get(user, id);
    Object.assign(task, dto);
    syncCompletion(task);
    // The joined owner holds only id/name/email; ownerId already describes the relation.
    delete (task as Partial<Task>).owner;
    await this.tasks.save(task);
    return this.get(user, id);
  }

  async remove(user: CurrentUser, id: number): Promise<{ id: number }> {
    const task = await this.get(user, id);
    await this.tasks.delete(task.id);
    return { id: task.id };
  }
}
