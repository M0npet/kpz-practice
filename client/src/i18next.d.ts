import type { resources, defaultNS } from "./common/i18n";

declare module "i18next" {
	interface CustomTypeOptions {
		defaultNS: typeof defaultNS;
		// Ukrainian is the primary language; the English file has the same keys.
		resources: (typeof resources)["uk"];
	}
}
