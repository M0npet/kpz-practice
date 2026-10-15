import { useQueryClient } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import type { FunctionComponent } from "../common/types";
import { AppHeader } from "../components/layout/AppHeader";
import { useAuthStore } from "../features/auth/auth-store";
import { DeleteTaskDialog } from "../features/tasks/DeleteTaskDialog";
import { TaskFormDialog } from "../features/tasks/TaskFormDialog";
import { TaskList } from "../features/tasks/TaskList";
import { TaskToolbar } from "../features/tasks/TaskToolbar";
import type { Task, TaskFilters } from "../features/tasks/types";

const routeApi = getRouteApi("/tasks");

type FormState = { open: false } | { open: true; task: Task | null };

export const TasksPage = (): FunctionComponent => {
	const filters = routeApi.useSearch();
	const navigate = routeApi.useNavigate();
	const queryClient = useQueryClient();
	const token = useAuthStore((state) => state.token);
	const logout = useAuthStore((state) => state.logout);
	const isAdmin = useAuthStore((state) => state.user?.role === "ADMINISTRATOR");
	const [form, setForm] = useState<FormState>({ open: false });
	const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

	// The API answered 401 (expired token) or the user signed out: go to the login page.
	useEffect(() => {
		if (!token) void navigate({ to: "/login" });
	}, [token, navigate]);

	const onFiltersChange = useCallback(
		(next: TaskFilters): void => {
			void navigate({ search: next, replace: true });
		},
		[navigate]
	);

	return (
		<main className="mx-auto max-w-3xl px-4 pt-10 pb-24 sm:pt-16">
			<AppHeader
				onLogout={() => {
					queryClient.clear(); // the next user must not see this user's cached tasks
					logout();
				}}
			/>
			<div className="mt-10 space-y-4">
				<TaskToolbar
					filters={filters}
					onChange={onFiltersChange}
					onCreate={() => {
						setForm({ open: true, task: null });
					}}
				/>
				<TaskList
					filters={filters}
					showOwner={isAdmin}
					onDelete={setTaskToDelete}
					onEdit={(task) => {
						setForm({ open: true, task });
					}}
					onResetFilters={() => {
						onFiltersChange({});
					}}
				/>
			</div>

			<TaskFormDialog
				open={form.open}
				task={form.open ? form.task : null}
				onClose={() => {
					setForm({ open: false });
				}}
			/>
			<DeleteTaskDialog
				task={taskToDelete}
				onClose={() => {
					setTaskToDelete(null);
				}}
			/>
		</main>
	);
};
