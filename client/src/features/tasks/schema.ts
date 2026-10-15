import { z } from "zod";
import {
	TASK_PRIORITIES,
	TASK_STATUSES,
	type Task,
	type TaskPayload,
} from "./types";

// Same limits as the server-side DTO validation (server/src/modules/tasks/task.dto.ts).
// Messages are i18n keys; the form translates them when rendering.
export const taskFormSchema = z.object({
	title: z
		.string()
		.trim()
		.min(1, "tasks.form.errors.titleRequired")
		.max(120, "tasks.form.errors.titleTooLong"),
	description: z.string().max(2000, "tasks.form.errors.descriptionTooLong"),
	status: z.enum(TASK_STATUSES),
	priority: z.enum(TASK_PRIORITIES),
	dueDate: z
		.string()
		.regex(/^(\d{4}-\d{2}-\d{2})?$/, "tasks.form.errors.dueDateInvalid"),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const emptyTaskForm: TaskFormValues = {
	title: "",
	description: "",
	status: "TODO",
	priority: "MEDIUM",
	dueDate: "",
};

export const taskToFormValues = (task: Task): TaskFormValues => ({
	title: task.title,
	description: task.description ?? "",
	status: task.status,
	priority: task.priority,
	dueDate: task.dueDate ?? "",
});

/** Empty strings in the form mean "no value" for the API. */
export const formValuesToPayload = (values: TaskFormValues): TaskPayload => ({
	title: values.title.trim(),
	description: values.description.trim() || null,
	status: values.status,
	priority: values.priority,
	dueDate: values.dueDate || null,
});
