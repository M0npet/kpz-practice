import { create } from "zustand";

export type Toast = { id: number; message: string; tone: "success" | "error" };

type ToastState = {
	toasts: Array<Toast>;
	show: (message: string, tone?: Toast["tone"]) => void;
	dismiss: (id: number) => void;
};

const TOAST_TIMEOUT_MS = 3500;
let nextId = 1;

export const useToastStore = create<ToastState>()((set, get) => ({
	toasts: [],
	show: (message, tone = "success"): void => {
		const id = nextId++;
		set({ toasts: [...get().toasts, { id, message, tone }] });
		setTimeout(() => {
			get().dismiss(id);
		}, TOAST_TIMEOUT_MS);
	},
	dismiss: (id): void => {
		set({ toasts: get().toasts.filter((toast) => toast.id !== id) });
	},
}));

/** Lets non-React code (mutation callbacks) raise a toast. */
export const toast = (message: string, tone?: Toast["tone"]): void => {
	useToastStore.getState().show(message, tone);
};
