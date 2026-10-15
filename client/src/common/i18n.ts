import i18n, { type InitOptions } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import translationEN from "../assets/locales/en/translations.json";
import translationUK from "../assets/locales/uk/translations.json";
import { isProduction } from "./utilities";

export const defaultNS = "translations";
export const resources = {
	uk: { translations: translationUK },
	en: { translations: translationEN },
} as const;

export const supportedLanguages = ["uk", "en"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

// Translations are small, so they are bundled instead of being fetched over HTTP:
// no flash of untranslated keys and no Suspense boundary needed on first render.
const i18nOptions: InitOptions = {
	resources,
	defaultNS,
	ns: [defaultNS],
	debug: !isProduction,
	supportedLngs: supportedLanguages,
	nonExplicitSupportedLngs: true,
	load: "languageOnly",
	fallbackLng: "uk",
	detection: {
		order: ["localStorage", "navigator"],
		caches: ["localStorage"],
	},
	interpolation: {
		escapeValue: false, // not needed for react as it escapes by default
	},
};

// Keep <html lang> in sync for screen readers and for the browser's date input.
i18n.on("languageChanged", (language) => {
	document.documentElement.lang = language;
});

void i18n.use(initReactI18next).use(LanguageDetector).init(i18nOptions);

export default i18n;
