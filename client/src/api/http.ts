import { useAuthStore } from "../features/auth/auth-store";

export const API_URL =
	import.meta.env.VITE_API_URL ?? "http://localhost:4000/v1";

/** Response envelope used by every successful endpoint of the server. */
export type ApiSuccess<T> = { message: string; data: T };

/** Error body produced by the server's CustomError. */
type ApiErrorBody = {
	errorType?: string;
	errorMessage?: string;
	errors?: Array<string> | null;
	errorsValidation?: Array<Record<string, string>> | null;
};

export class ApiError extends Error {
	public readonly status: number;
	public readonly details: Array<string>;
	public readonly fieldErrors: Record<string, string>;

	public constructor(
		status: number,
		body: ApiErrorBody | null,
		fallbackMessage: string
	) {
		super(body?.errorMessage ?? fallbackMessage);
		this.name = "ApiError";
		this.status = status;
		this.details = body?.errors ?? [];
		this.fieldErrors = Object.assign(
			{},
			...(body?.errorsValidation ?? [])
		) as Record<string, string>;
	}

	/** status 0 = the request never reached the server (offline, CORS, API down). */
	public get isNetworkError(): boolean {
		return this.status === 0;
	}
}

type RequestOptions = {
	method?: "GET" | "POST" | "PATCH" | "DELETE";
	body?: unknown;
	query?: Record<string, string | undefined>;
	/** Login must not trigger the "session expired" logout on 401/404. */
	skipAuth?: boolean;
};

const buildUrl = (path: string, query?: RequestOptions["query"]): string => {
	const url = new URL(`${API_URL}${path}`);
	for (const [key, value] of Object.entries(query ?? {})) {
		if (value) url.searchParams.set(key, value);
	}
	return url.toString();
};

/**
 * Thin wrapper over fetch:
 * - adds the JWT from the auth store;
 * - stores the refreshed token the server sends back in the `token` header;
 * - turns the server's error format into ApiError.
 */
export async function apiRequest<T>(
	path: string,
	options: RequestOptions = {}
): Promise<ApiSuccess<T>> {
	const { token, setToken, logout } = useAuthStore.getState();
	const headers: Record<string, string> = { Accept: "application/json" };
	if (options.body !== undefined) headers["Content-Type"] = "application/json";
	if (token && !options.skipAuth) headers["Authorization"] = token;

	let response: Response;
	try {
		response = await fetch(buildUrl(path, options.query), {
			method: options.method ?? "GET",
			headers,
			body:
				options.body === undefined ? undefined : JSON.stringify(options.body),
		});
	} catch (error) {
		throw new ApiError(
			0,
			null,
			error instanceof Error ? error.message : "Network error"
		);
	}

	const refreshedToken = response.headers.get("token");
	if (refreshedToken && !options.skipAuth) setToken(refreshedToken);

	const body = await response.json().catch(() => null);

	if (!response.ok) {
		if (response.status === 401 && !options.skipAuth) logout("expired");
		throw new ApiError(
			response.status,
			body as ApiErrorBody | null,
			response.statusText
		);
	}
	return body as ApiSuccess<T>;
}
