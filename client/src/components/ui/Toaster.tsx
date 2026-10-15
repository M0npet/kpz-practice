import {
	CheckCircleIcon,
	ExclamationCircleIcon,
	XMarkIcon,
} from "@heroicons/react/20/solid";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "../../common/types";
import { useToastStore } from "../../store/toast-store";

export const Toaster = (): FunctionComponent => {
	const { t } = useTranslation();
	const toasts = useToastStore((state) => state.toasts);
	const dismiss = useToastStore((state) => state.dismiss);

	return (
		<div
			aria-live="polite"
			className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2"
		>
			{toasts.map((item) => (
				<div
					key={item.id}
					className="pointer-events-auto flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm text-white shadow-lg"
					role="status"
				>
					{item.tone === "success" ? (
						<CheckCircleIcon
							aria-hidden="true"
							className="size-5 text-marker"
						/>
					) : (
						<ExclamationCircleIcon
							aria-hidden="true"
							className="size-5 text-[#ff9b8a]"
						/>
					)}
					<span>{item.message}</span>
					<button
						aria-label={t("app.close")}
						className="ml-1 rounded p-0.5 text-white/70 hover:text-white"
						type="button"
						onClick={() => {
							dismiss(item.id);
						}}
					>
						<XMarkIcon aria-hidden="true" className="size-4" />
					</button>
				</div>
			))}
		</div>
	);
};
