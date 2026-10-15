export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/** Mirrors TaskResponseDto on the server. */
export type Task = {
	id: number;
	title: string;
	description: string | null;
	status: TaskStatus;
	priority: TaskPriority;
	dueDate: string | null;
	completedAt: string | null;
	createdAt: string;
	updatedAt: string;
	owner: { id: number; name: string | null; email: string } | null;
};

export type TaskPayload = {
	title: string;
	description: string | null;
	status: TaskStatus;
	priority: TaskPriority;
	dueDate: string | null;
};

export type TaskFilters = {
	status?: TaskStatus;
	q?: string;
};

export const isTaskStatus = (value: unknown): value is TaskStatus =>
	typeof value === "string" &&
	(TASK_STATUSES as ReadonlyArray<string>).includes(value);
