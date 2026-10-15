import { createFileRoute, redirect } from "@tanstack/react-router";
import { isAuthenticated } from "../features/auth/auth-store";
import { isTaskStatus, type TaskFilters } from "../features/tasks/types";
import { TasksPage } from "../pages/TasksPage";

/**
 * Filters live in the URL (/tasks?status=DONE&q=report): they survive a reload,
 * work with the back button and can be shared as a link. TanStack Router validates
 * and types them here; TasksPage reads them with getRouteApi("/tasks").useSearch().
 */
const validateSearch = (search: Record<string, unknown>): TaskFilters => {
	const status = search["status"];
	const query = search["q"];
	return {
		status: isTaskStatus(status) ? status : undefined,
		q:
			typeof query === "string" && query.trim()
				? query.trim().slice(0, 120)
				: undefined,
	};
};

export const Route = createFileRoute("/tasks")({
	validateSearch,
	beforeLoad: () => {
		if (!isAuthenticated()) {
			// eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router redirects are thrown
			throw redirect({ to: "/login" });
		}
	},
	component: TasksPage,
});
