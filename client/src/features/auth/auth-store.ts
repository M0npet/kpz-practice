import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CurrentUser = {
	id: number;
	name: string | null;
	email: string;
	role: "ADMINISTRATOR" | "STANDARD";
};

type AuthState = {
	/** Full header value as the server returns it: "Bearer <jwt>". */
	token: string | null;
	user: CurrentUser | null;
	/** Why the user was signed out last time, shown once on the login page. */
	logoutReason: "expired" | null;
	setToken: (token: string) => void;
	logout: (reason?: "expired") => void;
	clearLogoutReason: () => void;
};

/**
 * Reads the JWT payload for display purposes only (name, role). The signature is
 * verified by the server on every request; the client never trusts it for security.
 */
const decodeUser = (token: string): CurrentUser | null => {
	try {
		const payloadPart = token.replace(/^Bearer\s+/, "").split(".")[1] ?? "";
		const json = decodeURIComponent(
			Array.from(atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/")))
				.map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
				.join("")
		);
		const payload = JSON.parse(json) as CurrentUser;
		return {
			id: payload.id,
			name: payload.name,
			email: payload.email,
			role: payload.role,
		};
	} catch {
		return null;
	}
};

// sessionStorage instead of localStorage: the token disappears with the tab, which limits
// the damage if it is ever stolen through XSS (see the lecture on JWT storage).
export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			token: null,
			user: null,
			logoutReason: null,
			setToken: (token): void => {
				set({ token, user: decodeUser(token), logoutReason: null });
			},
			logout: (reason): void => {
				set({ token: null, user: null, logoutReason: reason ?? null });
			},
			clearLogoutReason: (): void => {
				set({ logoutReason: null });
			},
		}),
		{
			name: "tasks-auth",
			storage: createJSONStorage(() => sessionStorage),
			partialize: (state) => ({ token: state.token, user: state.user }),
		}
	)
);

export const isAuthenticated = (): boolean =>
	Boolean(useAuthStore.getState().token);
