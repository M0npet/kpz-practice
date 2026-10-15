import { devices, type Project } from "@playwright/test";

/**
 * Which browser Playwright drives:
 * - CHROMIUM_PATH=<path to chrome/chromium> → that binary;
 * - on Windows → the installed Microsoft Edge (nothing to download);
 * - otherwise → Playwright's own Chromium (`npx playwright install chromium`).
 */
export const chromiumProject = (args: Array<string> = []): Project => {
	const executablePath = process.env["CHROMIUM_PATH"];
	return {
		name: "chromium",
		use: {
			...devices["Desktop Chrome"],
			...(process.platform === "win32" && !executablePath
				? { channel: "msedge" }
				: {}),
			launchOptions: {
				args,
				...(executablePath ? { executablePath } : {}),
			},
		},
	};
};
