import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { describeError } from "../../common/errors";
import type { FunctionComponent } from "../../common/types";
import { Button } from "../../components/ui/Button";
import { controlClass, FormField } from "../../components/ui/FormField";
import { Modal } from "../../components/ui/Modal";
import { ApiError } from "../../api/http";
import { toast } from "../../store/toast-store";
import { useCreateTask, useUpdateTask } from "./queries";
import {
	emptyTaskForm,
	formValuesToPayload,
	taskFormSchema,
	taskToFormValues,
	type TaskFormValues,
} from "./schema";
import { TASK_PRIORITIES, TASK_STATUSES, type Task } from "./types";

type TaskFormDialogProps = {
	open: boolean;
	/** null = create a new task, Task = edit it */
	task: Task | null;
	onClose: () => void;
};

const FIELDS = [
	"title",
	"description",
	"status",
	"priority",
	"dueDate",
] as const;

export const TaskFormDialog = ({
	open,
	task,
	onClose,
}: TaskFormDialogProps): FunctionComponent => {
	const { t } = useTranslation();
	const createTask = useCreateTask();
	const updateTask = useUpdateTask();
	const {
		register,
		handleSubmit,
		reset,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<TaskFormValues>({
		resolver: zodResolver(taskFormSchema),
		defaultValues: emptyTaskForm,
	});

	// Fill the form every time the dialog opens for another task.
	useEffect(() => {
		if (open) reset(task ? taskToFormValues(task) : emptyTaskForm);
	}, [open, task, reset]);

	const onSubmit = async (values: TaskFormValues): Promise<void> => {
		const payload = formValuesToPayload(values);
		try {
			if (task) {
				await updateTask.mutateAsync({ id: task.id, payload });
				toast(t("tasks.toast.updated"));
			} else {
				await createTask.mutateAsync(payload);
				toast(t("tasks.toast.created"));
			}
			onClose();
		} catch (error) {
			// Server-side validation errors land next to the matching field.
			if (
				error instanceof ApiError &&
				Object.keys(error.fieldErrors).length > 0
			) {
				for (const field of FIELDS) {
					const message = error.fieldErrors[field];
					if (message) setError(field, { message });
				}
				return;
			}
			setError("root", { message: describeError(error, t) });
		}
	};

	// Zod messages are i18n keys; server messages are plain text and pass through t() unchanged.
	const message = (field: keyof TaskFormValues): string | undefined => {
		const text = errors[field]?.message;
		return text ? t(text as never) : undefined;
	};
	const aria = (field: keyof TaskFormValues): Record<string, unknown> => ({
		id: `task-${field}`,
		"aria-invalid": errors[field] ? true : undefined,
		"aria-describedby": errors[field] ? `task-${field}-error` : undefined,
	});

	return (
		<Modal
			open={open}
			title={task ? t("tasks.form.editTitle") : t("tasks.form.createTitle")}
			onClose={onClose}
		>
			<form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
				<FormField
					error={message("title")}
					id="task-title"
					label={t("tasks.form.title")}
				>
					<input
						autoFocus
						className={controlClass}
						maxLength={120}
						{...aria("title")}
						{...register("title")}
					/>
				</FormField>

				<FormField
					error={message("description")}
					hint={t("tasks.form.optional")}
					id="task-description"
					label={t("tasks.form.description")}
				>
					<textarea
						className={`${controlClass} resize-y`}
						rows={3}
						{...aria("description")}
						{...register("description")}
					/>
				</FormField>

				<div className="grid gap-4 sm:grid-cols-3">
					<FormField
						error={message("status")}
						id="task-status"
						label={t("tasks.form.status")}
					>
						<select
							className={controlClass}
							{...aria("status")}
							{...register("status")}
						>
							{TASK_STATUSES.map((status) => (
								<option key={status} value={status}>
									{t(`tasks.status.${status}`)}
								</option>
							))}
						</select>
					</FormField>
					<FormField
						error={message("priority")}
						id="task-priority"
						label={t("tasks.form.priority")}
					>
						<select
							className={controlClass}
							{...aria("priority")}
							{...register("priority")}
						>
							{TASK_PRIORITIES.map((priority) => (
								<option key={priority} value={priority}>
									{t(`tasks.priority.${priority}`)}
								</option>
							))}
						</select>
					</FormField>
					<FormField
						error={message("dueDate")}
						hint={t("tasks.form.optional")}
						id="task-dueDate"
						label={t("tasks.form.dueDate")}
					>
						<input
							className={controlClass}
							type="date"
							{...aria("dueDate")}
							{...register("dueDate")}
						/>
					</FormField>
				</div>

				{errors.root?.message ? (
					<p
						className="rounded-md bg-pencil/10 px-3 py-2 text-sm text-pencil"
						role="alert"
					>
						{errors.root.message}
					</p>
				) : null}

				<div className="flex justify-end gap-2 pt-2">
					<Button variant="secondary" onClick={onClose}>
						{t("tasks.form.cancel")}
					</Button>
					<Button disabled={isSubmitting} type="submit">
						{isSubmitting
							? t("tasks.form.saving")
							: task
								? t("tasks.form.save")
								: t("tasks.form.create")}
					</Button>
				</div>
			</form>
		</Modal>
	);
};
