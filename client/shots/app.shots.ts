import path from "node:path";
import {
	expect,
	test,
	type Browser,
	type BrowserContextOptions,
	type Page,
} from "@playwright/test";

// Re-takes the report screenshots (docs/screenshots/03…17) on this machine.
// Run with `pnpm shots` (see playwright.shots.config.ts). Figure 01 (the starter's
// import error) is taken by hand — see the root README.

const APP = "http://localhost:5181"; // devtools buttons hidden
const APP_DEVTOOLS = "http://localhost:5182"; // TanStack Query devtools only
const OUT = path.resolve(process.cwd(), "../docs/screenshots");

const open = async (
	browser: Browser,
	options: BrowserContextOptions = {}
): Promise<Page> => {
	const locale = options.locale ?? "uk-UA";
	const context = await browser.newContext({
		viewport: { width: 1280, height: 820 },
		deviceScaleFactor: 1,
		colorScheme: "dark", // the report uses the dark theme (it follows the OS setting)
		...options,
		locale,
	});
	// pin the UI language: the app remembers the last chosen one in localStorage
	await context.addInitScript(
		(language) => {
			localStorage.setItem("i18nextLng", language);
		},
		locale.slice(0, 2)
	);
	return context.newPage();
};

const save = (page: Page, name: string): Promise<Buffer> =>
	page.screenshot({ path: path.join(OUT, name) });

/** Screenshot of the page content (the children of <main>) with a 24 px margin, like in the report. */
const saveContent = async (
	page: Page,
	name: string,
	pad = 24
): Promise<void> => {
	const boxes = await page.locator("main > *").evaluateAll((elements) =>
		elements.map((element) => {
			const r = element.getBoundingClientRect();
			return {
				x: r.left + window.scrollX,
				y: r.top + window.scrollY,
				w: r.width,
				h: r.height,
			};
		})
	);
	const x0 = Math.min(...boxes.map((b) => b.x));
	const y0 = Math.min(...boxes.map((b) => b.y));
	const x1 = Math.max(...boxes.map((b) => b.x + b.w));
	const y1 = Math.max(...boxes.map((b) => b.y + b.h));
	await page.screenshot({
		path: path.join(OUT, name),
		fullPage: true,
		clip: {
			x: Math.max(0, x0 - pad),
			y: Math.max(0, y0 - pad),
			width: x1 - x0 + 2 * pad,
			height: y1 - y0 + 2 * pad,
		},
	});
};

const signIn = async (
	page: Page,
	base: string,
	email = "standard@standard.com"
): Promise<void> => {
	await page.goto(`${base}/login`);
	await page.getByLabel("Email").fill(email);
	await page.getByLabel(/Пароль|Password/).fill("pass1");
	await page.getByRole("button", { name: /Увійти|Sign in/ }).click();
	await page.waitForURL(/\/tasks/);
	await page.getByRole("listitem").first().waitFor();
};

const waitToastGone = (page: Page, text: string): Promise<void> =>
	page.getByText(text).waitFor({ state: "detached", timeout: 8000 });

test("report screenshots", async ({ browser }) => {
	// 03 — login page with the test account filled in
	const page = await open(browser);
	await page.goto(`${APP}/tasks`);
	await page.waitForURL(/\/login/);
	await page
		.getByRole("button", { name: "Заповнити тестовим акаунтом" })
		.click();
	await saveContent(page, "03-login.png");

	// 04 — task list
	await page.getByRole("button", { name: "Увійти" }).click();
	await page.waitForURL(/\/tasks/);
	await page.getByRole("listitem").first().waitFor();
	await saveContent(page, "04-tasks-list.png");

	// 05, 06, 07 — create: validation error, filled form, result
	await page.getByRole("button", { name: "Нова задача" }).click();
	const create = page.getByRole("dialog", { name: "Нова задача" });
	await create.getByLabel("Назва").fill("   ");
	await create.getByLabel("Термін").fill("2026-10-31");
	await create.getByRole("button", { name: "Створити задачу" }).click();
	await expect(create.getByText("Введіть назву задачі")).toBeVisible();
	await save(page, "05-create-validation.png");
	await create.getByLabel("Назва").fill("Здати практику викладачу");
	await create
		.getByLabel("Опис")
		.fill("Посилання на репозиторій + README зі звітом.");
	await create.getByLabel("Пріоритет").selectOption("HIGH");
	await save(page, "06-create-filled.png");
	await create.getByRole("button", { name: "Створити задачу" }).click();
	await expect(page.getByText("Задачу створено")).toBeVisible();
	await expect(
		page.getByText("Здати практику викладачу", { exact: true })
	).toBeVisible();
	await saveContent(page, "07-created.png");
	await waitToastGone(page, "Задачу створено");

	// 08 — edit
	await page
		.getByRole("button", { name: "Редагувати «Підготувати звіт з практики»" })
		.click();
	const edit = page.getByRole("dialog", { name: "Редагування задачі" });
	await edit
		.getByLabel("Опис")
		.fill(
			"Описати хід роботи, додати скріншоти, логи налагодження та висновки."
		);
	await save(page, "08-edit.png");
	await edit.getByRole("button", { name: "Зберегти зміни" }).click();
	await expect(page.getByText("Зміни збережено")).toBeVisible();
	await waitToastGone(page, "Зміни збережено");

	// 09 — mark a task as done and filter "Готово"
	await page
		.getByRole("button", {
			name: "Позначити «Налаштувати CI для репозиторію» виконаною",
		})
		.click();
	await expect(page.getByText("Задачу виконано")).toBeVisible();
	await waitToastGone(page, "Задачу виконано");
	const filters = page.getByRole("group", { name: "Фільтр за статусом" });
	await filters.getByRole("button", { name: "Готово" }).click();
	await page.waitForURL(/status=DONE/);
	await expect(page.getByRole("listitem")).toHaveCount(2);
	await saveContent(page, "09-filter-done.png");

	// 10 — search by title
	await filters.getByRole("button", { name: "Усі" }).click();
	await page.getByRole("searchbox", { name: "Пошук за назвою" }).fill("звіт");
	await page.waitForURL(/q=/);
	await expect(page.getByRole("listitem")).toHaveCount(1);
	await saveContent(page, "10-search.png");

	// 11, 12 — delete with confirmation
	await page.getByRole("searchbox", { name: "Пошук за назвою" }).fill("");
	await page.waitForURL((url) => !url.search.includes("q="));
	await expect(page.getByRole("listitem")).toHaveCount(5);
	await page
		.getByRole("button", { name: "Видалити «Здати практику викладачу»" })
		.click();
	await expect(
		page.getByRole("dialog", { name: "Видалити задачу?" })
	).toBeVisible();
	await save(page, "11-delete-confirm.png");
	await page
		.getByRole("dialog", { name: "Видалити задачу?" })
		.getByRole("button", { name: "Видалити" })
		.click();
	await expect(page.getByText("Задачу видалено")).toBeVisible();
	await expect(page.getByRole("listitem")).toHaveCount(4);
	await save(page, "12-deleted.png");

	// 13 — English interface
	const english = await open(browser, { locale: "en-US" });
	await signIn(english, APP);
	await saveContent(english, "13-english.png");

	// 14 — phone width
	const mobile = await open(browser, {
		viewport: { width: 390, height: 844 },
		deviceScaleFactor: 2,
		isMobile: true,
		hasTouch: true,
	});
	await signIn(mobile, APP);
	await mobile.screenshot({
		path: path.join(OUT, "14-mobile.png"),
		fullPage: true,
	});

	// 15 — administrator sees everybody's tasks
	const admin = await open(browser);
	await signIn(admin, APP, "admin@admin.com");
	await saveContent(admin, "15-admin.png");

	// 16 — wrong password
	const wrong = await open(browser);
	await wrong.goto(`${APP}/login`);
	await wrong.getByLabel("Email").fill("standard@standard.com");
	await wrong.getByLabel("Пароль").fill("nope");
	await wrong.getByRole("button", { name: "Увійти" }).click();
	await expect(wrong.getByRole("alert")).toBeVisible();
	await saveContent(wrong, "16-login-error.png");

	// 17 — TanStack Query devtools with the task list query selected
	const devtools = await open(browser);
	await signIn(devtools, APP_DEVTOOLS);
	await devtools
		.getByRole("button", { name: /open tanstack query devtools/i })
		.click();
	const query = devtools.getByText('"list"').first();
	await query.waitFor();
	await query.click();
	await devtools.waitForTimeout(500);
	await save(devtools, "17-query-devtools.png");
});
