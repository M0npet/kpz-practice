import { describe, expect, it } from "vitest";
import { formatDay, isOverdue, todayIso } from "./format";
import { formValuesToPayload, taskFormSchema } from "./schema";
import type { Task } from "./types";

const task = (overrides: Partial<Task>): Task => ({
	id: 1,
	title: "Task",
	description: null,
	status: "TODO",
	priority: "MEDIUM",
	dueDate: null,
	completedAt: null,
	createdAt: "2026-10-01T10:00:00.000Z",
	updatedAt: "2026-10-01T10:00:00.000Z",
	owner: null,
	...overrides,
});

describe("isOverdue", () => {
	const today = "2026-10-15";

	it("is true only for unfinished tasks with a past due date", () => {
		expect(isOverdue(task({ dueDate: "2026-10-14" }), today)).toBe(true);
		expect(isOverdue(task({ dueDate: "2026-10-15" }), today)).toBe(false);
		expect(isOverdue(task({ dueDate: null }), today)).toBe(false);
		expect(
			isOverdue(task({ dueDate: "2026-10-01", status: "DONE" }), today)
		).toBe(false);
	});
});

describe("dates", () => {
	it("builds today's date in local time", () => {
		expect(todayIso(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
	});

	it("formats a due date without shifting it by the time zone", () => {
		const year = new Date().getFullYear();
		expect(formatDay(`${year}-10-20`, "uk")).toBe("20 жовт.");
		expect(formatDay(`${year}-10-20`, "en")).toBe("Oct 20");
	});
});

describe("task form", () => {
	const valid = {
		title: "  Report  ",
		description: "",
		status: "TODO",
		priority: "HIGH",
		dueDate: "",
	};

	it("trims the title and turns empty optional fields into null", () => {
		const values = taskFormSchema.parse(valid);
		expect(formValuesToPayload(values)).toEqual({
			title: "Report",
			description: null,
			status: "TODO",
			priority: "HIGH",
			dueDate: null,
		});
	});

	it("rejects an empty title, a long title and a malformed date with i18n keys", () => {
		const blank = taskFormSchema.safeParse({ ...valid, title: "   " });
		expect(blank.error?.issues[0]?.message).toBe(
			"tasks.form.errors.titleRequired"
		);

		const long = taskFormSchema.safeParse({ ...valid, title: "x".repeat(121) });
		expect(long.error?.issues[0]?.message).toBe(
			"tasks.form.errors.titleTooLong"
		);

		const date = taskFormSchema.safeParse({ ...valid, dueDate: "31.10.2026" });
		expect(date.error?.issues[0]?.message).toBe(
			"tasks.form.errors.dueDateInvalid"
		);
	});
});
