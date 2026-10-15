import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "../common/types";
import { AppTitle } from "../components/layout/AppHeader";

export const NotFoundPage = (): FunctionComponent => {
	const { t } = useTranslation();
	return (
		<main className="mx-auto max-w-3xl px-4 pt-16">
			<AppTitle />
			<p className="mt-8 text-lg">{t("notFound.title")}</p>
			<Link
				className="mt-4 inline-block font-medium underline underline-offset-4"
				to="/tasks"
			>
				{t("notFound.back")}
			</Link>
		</main>
	);
};
