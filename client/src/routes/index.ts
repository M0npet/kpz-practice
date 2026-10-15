import { createFileRoute, redirect } from "@tanstack/react-router";

// "/" has no page of its own: the tasks route decides whether to show the login form.
export const Route = createFileRoute("/")({
	beforeLoad: () => {
		// eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router redirects are thrown
		throw redirect({ to: "/tasks" });
	},
});
