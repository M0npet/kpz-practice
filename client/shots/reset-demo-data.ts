import { execSync } from "node:child_process";
import path from "node:path";

/** Puts the tasks table back to the demo seed so the screenshots are always the same. */
export default function resetDemoData(): void {
	execSync("npm run db:demo-reset", {
		cwd: path.resolve(process.cwd(), "../server"),
		stdio: "inherit",
	});
}
