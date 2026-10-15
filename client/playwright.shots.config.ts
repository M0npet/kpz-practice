import { defineConfig } from "@playwright/test";
import { chromiumProject } from "./playwright.browser";

/**
 * Re-takes the report screenshots into ../docs/screenshots: `pnpm shots`.
 * Needs the API running (cd ../server && npm run dev:local). The demo data is reset
 * first (shots/reset-demo-data.ts), so every run produces the same pictures.
 * Two private Vite servers are started: one without devtools buttons and one with
 * the TanStack Query devtools only (for the devtools screenshot).
 */
export default defineConfig({
	testDir: "./shots",
	testMatch: "**/*.shots.ts",
	fullyParallel: false,
	workers: 1,
	retries: 0,
	timeout: 180_000,
	reporter: "list",
	globalSetup: "./shots/reset-demo-data.ts",
	use: {
		locale: "uk-UA",
		viewport: { width: 1280, height: 820 },
		deviceScaleFactor: 1,
	},
	// --lang makes the browser UI (e.g. the date input) Ukrainian too
	projects: [chromiumProject(["--lang=uk-UA"])],
	webServer: [
		{
			command: "pnpm exec vite --port 5181 --strictPort",
			url: "http://localhost:5181",
			reuseExistingServer: false,
			env: { VITE_DEVTOOLS: "false" },
		},
		{
			command: "pnpm exec vite --port 5182 --strictPort",
			url: "http://localhost:5182",
			reuseExistingServer: false,
			env: { VITE_DEVTOOLS: "query" },
		},
	],
});
