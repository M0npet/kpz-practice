import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "@tanstack/react-router";
import { ApiError } from "./api/http";
import type { FunctionComponent } from "./common/types";
import type { TanstackRouter } from "./main";
import { TanStackRouterDevelopmentTools } from "./components/utils/development-tools/TanStackRouterDevelopmentTools";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// 4xx answers will not change on retry; network errors and 5xx get two more tries.
			retry: (failureCount: number, error: Error): boolean =>
				!(
					error instanceof ApiError &&
					error.status >= 400 &&
					error.status < 500
				) && failureCount < 2,
			refetchOnWindowFocus: false,
		},
	},
});

// Set VITE_DEVTOOLS=false to hide the floating devtools buttons (e.g. for screenshots).
const showDevtools = import.meta.env.VITE_DEVTOOLS !== "false";

type AppProps = { router: TanstackRouter };

const App = ({ router }: AppProps): FunctionComponent => {
	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
			{showDevtools ? (
				<>
					<TanStackRouterDevelopmentTools
						initialIsOpen={false}
						position="bottom-right"
						router={router}
					/>
					<ReactQueryDevtools
						buttonPosition="bottom-left"
						initialIsOpen={false}
					/>
				</>
			) : null}
		</QueryClientProvider>
	);
};

export default App;
