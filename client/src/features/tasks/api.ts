import { apiRequest } from "../../api/http";
import type { Task, TaskFilters, TaskPayload } from "./types";

// One function per REST endpoint of /v1/tasks.

export const listTasks = async (filters: TaskFilters): Promise<Array<Task>> => {
	const response = await apiRequest<Array<Task>>("/tasks", {
		query: { status: filters.status, search: filters.q },
	});
	return response.data;
};

export const createTask = async (payload: TaskPayload): Promise<Task> => {
	const response = await apiRequest<Task>("/tasks", {
		method: "POST",
		body: payload,
	});
	return response.data;
};

export const updateTask = async (
	id: number,
	payload: Partial<TaskPayload>
): Promise<Task> => {
	const response = await apiRequest<Task>(`/tasks/${id}`, {
		method: "PATCH",
		body: payload,
	});
	return response.data;
};

export const deleteTask = async (id: number): Promise<{ id: number }> => {
	const response = await apiRequest<{ id: number }>(`/tasks/${id}`, {
		method: "DELETE",
	});
	return response.data;
};
