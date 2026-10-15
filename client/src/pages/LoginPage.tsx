import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "../common/types";
import { AppTitle, LanguageSelect } from "../components/layout/AppHeader";
import { useAuthStore } from "../features/auth/auth-store";
import { LoginForm } from "../features/auth/LoginForm";

export const LoginPage = (): FunctionComponent => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const logoutReason = useAuthStore((state) => state.logoutReason);

	return (
		<main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-12">
			<div className="mb-8 flex items-end justify-between">
				<AppTitle />
				<LanguageSelect />
			</div>
			<div className="rounded-lg border border-grid bg-sheet p-6">
				<h2 className="font-display text-lg font-medium">
					{t("auth.heading")}
				</h2>
				<p className="mt-1 mb-5 text-sm text-ink-soft">{t("auth.intro")}</p>
				{logoutReason === "expired" ? (
					<p
						className="mb-4 rounded-md bg-marker/50 px-3 py-2 text-sm"
						role="status"
					>
						{t("auth.sessionExpired")}
					</p>
				) : null}
				<LoginForm
					onSuccess={() => {
						void navigate({ to: "/tasks" });
					}}
				/>
			</div>
		</main>
	);
};
