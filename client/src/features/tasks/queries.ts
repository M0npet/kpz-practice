import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
	type UseMutationResult,
	type UseQueryResult,
} from "@tanstack/react-query";
import { createTask, deleteTask, listTasks, updateTask } from "./api";
import type { Task, TaskFilters, TaskPayload } from "./types";

// Server state lives in TanStack Query (cache, refetch, loading/error states);
// client-only state (auth, toasts) lives in Zustand.
export const taskKeys = {
	all: ["tasks"] as const,
	list: (filters: TaskFilters) => ["tasks", "list", filters] as const,
};

export const useTasks = (filters: TaskFilters): UseQueryResult<Array<Task>> =>
	useQuery({
		queryKey: taskKeys.list(filters),
		queryFn: () => listTasks(filters),
		// keep the old list on screen while a new filter is loading
		placeholderData: keepPreviousData,
	});

const useInvalidateTasks = (): (() => Promise<void>) => {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: taskKeys.all });
};

export const useCreateTask = (): UseMutationResult<
	Task,
	Error,
	TaskPayload
> => {
	const invalidate = useInvalidateTasks();
	return useMutation({ mutationFn: createTask, onSuccess: invalidate });
};

export const useUpdateTask = (): UseMutationResult<
	Task,
	Error,
	{ id: number; payload: Partial<TaskPayload> }
> => {
	const invalidate = useInvalidateTasks();
	return useMutation({
		mutationFn: ({ id, payload }) => updateTask(id, payload),
		onSuccess: invalidate,
	});
};

export const useDeleteTask = (): UseMutationResult<
	{ id: number },
	Error,
	number
> => {
	const invalidate = useInvalidateTasks();
	return useMutation({ mutationFn: deleteTask, onSuccess: invalidate });
};
