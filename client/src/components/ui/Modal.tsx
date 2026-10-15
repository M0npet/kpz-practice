import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import type { ReactNode } from "react";
import type { FunctionComponent } from "../../common/types";

type ModalProps = {
	open: boolean;
	title: string;
	onClose: () => void;
	children: ReactNode;
	size?: "sm" | "md";
};

/** Accessible dialog: focus trap, Escape to close and aria wiring come from Headless UI. */
export const Modal = ({
	open,
	title,
	onClose,
	children,
	size = "md",
}: ModalProps): FunctionComponent => (
	<Dialog className="fixed inset-0 z-40" open={open} onClose={onClose}>
		<div aria-hidden="true" className="fixed inset-0 bg-ink/30" />
		<div className="fixed inset-0 flex items-end justify-center p-4 sm:items-center">
			<DialogPanel
				className={`w-full rounded-lg border border-grid bg-sheet p-6 shadow-[0_18px_48px_-12px_rgb(27_42_68/0.35)] ${size === "sm" ? "max-w-sm" : "max-w-lg"}`}
			>
				<DialogTitle className="font-display text-lg font-medium">
					{title}
				</DialogTitle>
				<div className="mt-4">{children}</div>
			</DialogPanel>
		</div>
	</Dialog>
);
