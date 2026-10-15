import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/20/solid";
import { useTranslation } from "react-i18next";
import { supportedLanguages } from "../../common/i18n";
import type { FunctionComponent } from "../../common/types";
import { useAuthStore } from "../../features/auth/auth-store";

const languageNames: Record<(typeof supportedLanguages)[number], string> = {
	uk: "Українська",
	en: "English",
};

export const LanguageSelect = (): FunctionComponent => {
	const { t, i18n } = useTranslation();
	return (
		<select
			aria-label={t("app.language")}
			className="rounded-md border border-transparent bg-transparent py-1 pr-6 pl-1 text-sm text-ink-soft hover:border-ink/20"
			value={i18n.resolvedLanguage}
			onChange={(event) => {
				void i18n.changeLanguage(event.target.value);
			}}
		>
			{supportedLanguages.map((language) => (
				<option key={language} value={language}>
					{languageNames[language]}
				</option>
			))}
		</select>
	);
};

export const AppTitle = (): FunctionComponent => {
	const { t } = useTranslation();
	return (
		<h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
			<span className="highlight px-1">{t("app.title")}</span>
		</h1>
	);
};

export const AppHeader = ({
	onLogout,
}: {
	onLogout: () => void;
}): FunctionComponent => {
	const { t } = useTranslation();
	const user = useAuthStore((state) => state.user);

	return (
		<header className="flex flex-wrap items-end justify-between gap-4">
			<AppTitle />
			<div className="flex items-center gap-3 text-sm">
				{user ? (
					<span className="text-ink-soft">{user.name ?? user.email}</span>
				) : null}
				<LanguageSelect />
				<button
					className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-ink hover:bg-sheet"
					type="button"
					onClick={onLogout}
				>
					<ArrowRightStartOnRectangleIcon
						aria-hidden="true"
						className="size-4"
					/>
					{t("auth.logout")}
				</button>
			</div>
		</header>
	);
};
