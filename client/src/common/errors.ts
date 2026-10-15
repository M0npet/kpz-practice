import type { TFunction } from "i18next";
import { API_URL, ApiError } from "../api/http";

/** One place that turns any thrown error into a sentence for the user. */
export const describeError = (error: unknown, t: TFunction): string => {
	if (error instanceof ApiError) {
		if (error.isNetworkError) return t("errors.network", { url: API_URL });
		if (error.status === 404) return t("errors.notFound");
		const details = [
			error.message,
			...error.details,
			...Object.values(error.fieldErrors),
		];
		return t("errors.generic", {
			message: details.filter(Boolean).join(" — "),
		});
	}
	return t("errors.generic", {
		message: error instanceof Error ? error.message : String(error),
	});
};
