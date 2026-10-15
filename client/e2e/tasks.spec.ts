import { expect, test, type Page } from "@playwright/test";

// Full CRUD through the UI, in Ukrainian (locale uk-UA in playwright.config.ts).
// Uses the seeded account standard@standard.com / pass1.

const signIn = async (page: Page): Promise<void> => {
	await page.goto("/tasks");
	await expect(page).toHaveURL(/\/login$/);
	await page.getByRole("button", { name: "Заповнити тестовим акаунтом" }).click();
	await page.getByRole("button", { name: "Увійти" }).click();
	await expect(page).toHaveURL(/\/tasks/);
};

test("create, edit, complete, find and delete a task", async ({ page }) => {
	const title = `E2E задача ${Date.now()}`;
	const renamed = `${title} (змінено)`;

	await signIn(page);
	await expect(page.getByRole("heading", { name: "Задачі" })).toBeVisible();

	// Create — first with an empty title to see client-side validation.
	await page.getByRole("button", { name: "Нова задача" }).click();
	const dialog = page.getByRole("dialog", { name: "Нова задача" });
	await dialog.getByRole("button", { name: "Створити задачу" }).click();
	await expect(dialog.getByText("Введіть назву задачі")).toBeVisible();

	await dialog.getByLabel("Назва").fill(title);
	await dialog.getByLabel("Опис").fill("Створено автотестом Playwright");
	await dialog.getByLabel("Пріоритет").selectOption("HIGH");
	await dialog.getByLabel("Термін").fill("2026-12-01");
	await dialog.getByRole("button", { name: "Створити задачу" }).click();
	await expect(page.getByText("Задачу створено")).toBeVisible();
	await expect(page.getByText(title, { exact: true })).toBeVisible();

	// Edit
	await page.getByRole("button", { name: `Редагувати «${title}»` }).click();
	const editDialog = page.getByRole("dialog", { name: "Редагування задачі" });
	await expect(editDialog.getByLabel("Назва")).toHaveValue(title);
	await editDialog.getByLabel("Назва").fill(renamed);
	await editDialog.getByRole("button", { name: "Зберегти зміни" }).click();
	await expect(page.getByText("Зміни збережено")).toBeVisible();
	await expect(page.getByText(renamed, { exact: true })).toBeVisible();

	// Complete it and check the "Готово" filter (kept in the URL).
	await page.getByRole("button", { name: `Позначити «${renamed}» виконаною` }).click();
	await expect(page.getByText("Задачу виконано")).toBeVisible();
	await page
		.getByRole("group", { name: "Фільтр за статусом" })
		.getByRole("button", { name: "Готово" })
		.click();
	await expect(page).toHaveURL(/status=DONE/);
	await expect(page.getByText(renamed, { exact: true })).toBeVisible();

	// Search by title (debounced, also kept in the URL).
	await page.getByRole("searchbox", { name: "Пошук за назвою" }).fill("змінено");
	await expect(page).toHaveURL(/q=/);
	await expect(page.getByRole("listitem")).toHaveCount(1);

	// Delete
	await page.getByRole("button", { name: `Видалити «${renamed}»` }).click();
	await page
		.getByRole("dialog", { name: "Видалити задачу?" })
		.getByRole("button", { name: "Видалити" })
		.click();
	await expect(page.getByText("Задачу видалено")).toBeVisible();
	await expect(page.getByText(renamed, { exact: true })).toHaveCount(0);
	await expect(page.getByText("Немає задач, що відповідають фільтру.")).toBeVisible();

	// Sign out
	await page.getByRole("button", { name: "Вийти" }).click();
	await expect(page).toHaveURL(/\/login$/);
});

test("shows a clear message for a wrong password", async ({ page }) => {
	await page.goto("/login");
	await page.getByLabel("Email").fill("standard@standard.com");
	await page.getByLabel("Пароль").fill("wrong-password");
	await page.getByRole("button", { name: "Увійти" }).click();
	await expect(page.getByRole("alert")).toHaveText("Неправильний email або пароль.");
});
