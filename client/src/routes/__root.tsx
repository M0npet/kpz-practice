import { createRootRoute } from "@tanstack/react-router";
import { RootLayout } from "../components/layout/RootLayout";
import { NotFoundPage } from "../pages/NotFoundPage";

export const Route = createRootRoute({
	component: RootLayout,
	notFoundComponent: NotFoundPage,
});
