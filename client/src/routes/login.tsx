import { createFileRoute, redirect } from "@tanstack/react-router";
import { isAuthenticated } from "../features/auth/auth-store";
import { LoginPage } from "../pages/LoginPage";

export const Route = createFileRoute("/login")({
	beforeLoad: () => {
		if (isAuthenticated()) {
			// eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router redirects are thrown
			throw redirect({ to: "/tasks" });
		}
	},
	component: LoginPage,
});
