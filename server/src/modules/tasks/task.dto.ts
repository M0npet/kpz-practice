import { Request, Response, NextFunction } from 'express';
import validator from 'validator';

import { Task } from 'orm/entities/tasks/Task';
import { TASK_PRIORITIES, TASK_STATUSES, TaskPriority, TaskStatus } from 'orm/entities/tasks/types';
import { CustomError } from 'utils/response/custom-error/CustomError';
import { ErrorValidation } from 'utils/response/custom-error/types';

export const TASK_TITLE_MAX = 120;
export const TASK_DESCRIPTION_MAX = 2000;
export const TASK_SEARCH_MAX = 120;

// ---- Input DTOs: what the client is allowed to send -------------------------

export type CreateTaskDto = {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
};

export type UpdateTaskDto = Partial<CreateTaskDto>;

export type TaskListQuery = {
  status?: TaskStatus;
  search?: string;
};

// ---- Output DTO: what the API returns (no internal fields, camelCase) -------

export type TaskResponseDto = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  owner: { id: number; name: string | null; email: string } | null;
};

export const toTaskResponse = (task: Task): TaskResponseDto => ({
  id: task.id,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  dueDate: task.dueDate,
  completedAt: task.completedAt,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
  owner: task.owner ? { id: task.owner.id, name: task.owner.name, email: task.owner.email } : null,
});

// ---- Validation --------------------------------------------------------------

const isOneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (list as readonly string[]).includes(value);

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && validator.isISO8601(value, { strict: true });

/**
 * Whitelists and normalises the request body. Unknown fields (id, ownerId, completedAt, ...)
 * are dropped, so a client cannot set them directly.
 */
export const parseTaskBody = (body: unknown, mode: 'create' | 'update') => {
  const errors: ErrorValidation[] = [];
  const dto: UpdateTaskDto = {};
  const raw = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;

  if (mode === 'create' || raw.title !== undefined) {
    const title = typeof raw.title === 'string' ? raw.title.trim() : '';
    if (!title) {
      errors.push({ title: 'Title is required' });
    } else if (title.length > TASK_TITLE_MAX) {
      errors.push({ title: `Title must be at most ${TASK_TITLE_MAX} characters` });
    } else {
      dto.title = title;
    }
  }

  if (raw.description !== undefined) {
    if (raw.description === null || raw.description === '') {
      dto.description = null;
    } else if (typeof raw.description !== 'string') {
      errors.push({ description: 'Description must be a string' });
    } else if (raw.description.length > TASK_DESCRIPTION_MAX) {
      errors.push({ description: `Description must be at most ${TASK_DESCRIPTION_MAX} characters` });
    } else {
      dto.description = raw.description.trim() || null;
    }
  }

  if (raw.status !== undefined) {
    if (isOneOf(TASK_STATUSES, raw.status)) {
      dto.status = raw.status;
    } else {
      errors.push({ status: `Status must be one of: ${TASK_STATUSES.join(', ')}` });
    }
  }

  if (raw.priority !== undefined) {
    if (isOneOf(TASK_PRIORITIES, raw.priority)) {
      dto.priority = raw.priority;
    } else {
      errors.push({ priority: `Priority must be one of: ${TASK_PRIORITIES.join(', ')}` });
    }
  }

  if (raw.dueDate !== undefined) {
    if (raw.dueDate === null || raw.dueDate === '') {
      dto.dueDate = null;
    } else if (typeof raw.dueDate === 'string' && isIsoDate(raw.dueDate)) {
      dto.dueDate = raw.dueDate;
    } else {
      errors.push({ dueDate: 'Due date must be a valid date in YYYY-MM-DD format' });
    }
  }

  if (mode === 'update' && errors.length === 0 && Object.keys(dto).length === 0) {
    errors.push({ body: 'Nothing to update' });
  }

  return { dto, errors };
};

export const parseListQuery = (query: Request['query']) => {
  const errors: ErrorValidation[] = [];
  const result: TaskListQuery = {};

  if (query.status !== undefined && query.status !== '') {
    if (isOneOf(TASK_STATUSES, query.status)) {
      result.status = query.status;
    } else {
      errors.push({ status: `Status must be one of: ${TASK_STATUSES.join(', ')}` });
    }
  }

  if (typeof query.search === 'string' && query.search.trim()) {
    result.search = query.search.trim().slice(0, TASK_SEARCH_MAX);
  }

  if (errors.length) {
    throw new CustomError(400, 'Validation', 'Task list query validation error', null, null, errors);
  }
  return result;
};

/** Route-level middleware: validates the body and replaces it with the whitelisted DTO. */
export const validateTaskBody = (mode: 'create' | 'update') => (req: Request, res: Response, next: NextFunction) => {
  const { dto, errors } = parseTaskBody(req.body, mode);
  if (errors.length) {
    return next(new CustomError(400, 'Validation', 'Task validation error', null, null, errors));
  }
  req.body = dto;
  return next();
};
