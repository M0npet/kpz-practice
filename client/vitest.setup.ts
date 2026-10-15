import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
// jest-dom v6 ships a ready-made Vitest entry; the starter's
// `import matchers from ".../matchers"` resolves to undefined and crashes every test file.
import "@testing-library/jest-dom/vitest";

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
	cleanup();
});
