import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests drive the real UI against the real API.
 * Before running: start Postgres + the API (see the root README), then `pnpm test:e2e`.
 * Vite is started automatically if it is not running yet.
 *
 * CHROMIUM_PATH lets you use an already installed Chromium/Chrome instead of
 * `npx playwright install chromium` (e.g. CHROMIUM_PATH=/usr/bin/chromium on Arch).
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: process.env.CI ? "github" : [["list"], ["html", { open: "never" }]],
	use: {
		baseURL,
		locale: "uk-UA",
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				launchOptions: process.env.CHROMIUM_PATH
					? { executablePath: process.env.CHROMIUM_PATH }
					: {},
			},
		},
	],
	webServer: {
		command: "pnpm dev",
		url: baseURL,
		reuseExistingServer: true,
		env: { VITE_DEVTOOLS: "false" },
	},
});
