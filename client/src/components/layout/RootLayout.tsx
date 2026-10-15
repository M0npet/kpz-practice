import { Outlet } from "@tanstack/react-router";
import type { FunctionComponent } from "../../common/types";
import { Toaster } from "../ui/Toaster";

export const RootLayout = (): FunctionComponent => (
	<>
		<Outlet />
		<Toaster />
	</>
);
