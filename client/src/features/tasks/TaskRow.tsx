import { CheckIcon } from "@heroicons/react/20/solid";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "../../common/types";
import { Button } from "../../components/ui/Button";
import { formatDay, formatTimestampDay, isOverdue } from "./format";
import type { Task, TaskPriority } from "./types";

const priorityBar: Record<TaskPriority, string> = {
	HIGH: "bg-pencil",
	MEDIUM: "bg-amber",
	LOW: "bg-moss/70",
};

/** Round status control: empty = to do, half = in progress, filled = done. */
const StatusMark = ({ task }: { task: Task }): FunctionComponent => {
	if (task.status === "DONE") {
		return (
			<span className="flex size-6 items-center justify-center rounded-full bg-moss text-white">
				<CheckIcon aria-hidden="true" className="size-4" />
			</span>
		);
	}
	return (
		<span
			className={`block size-6 rounded-full border-2 border-ink/40 ${task.status === "IN_PROGRESS" ? "bg-[linear-gradient(90deg,var(--color-ink)_50%,transparent_50%)] border-ink" : ""}`}
		/>
	);
};

type TaskRowProps = {
	task: Task;
	showOwner: boolean;
	onToggle: (task: Task) => void;
	onEdit: (task: Task) => void;
	onDelete: (task: Task) => void;
};

export const TaskRow = ({
	task,
	showOwner,
	onToggle,
	onEdit,
	onDelete,
}: TaskRowProps): FunctionComponent => {
	const { t, i18n } = useTranslation();
	const language = i18n.resolvedLanguage ?? "uk";
	const done = task.status === "DONE";
	const overdue = isOverdue(task);

	return (
		<li className="relative flex items-start gap-3 py-3 pr-2 pl-5">
			<span
				className={`absolute top-3 bottom-3 left-0 w-1 rounded-r ${priorityBar[task.priority]}`}
				title={t("tasks.priorityOf", {
					value: t(`tasks.priority.${task.priority}`),
				})}
			/>
			<button
				aria-pressed={done}
				className="mt-0.5 shrink-0 rounded-full"
				type="button"
				aria-label={
					done
						? t("tasks.reopen", { title: task.title })
						: t("tasks.markDone", { title: task.title })
				}
				onClick={() => {
					onToggle(task);
				}}
			>
				<StatusMark task={task} />
			</button>

			<div className="min-w-0 flex-1">
				<p
					className={`font-medium break-words ${done ? "text-ink-soft line-through decoration-ink/40" : ""}`}
				>
					{task.title}
				</p>
				{task.description ? (
					<p className="mt-0.5 line-clamp-2 text-sm break-words text-ink-soft">
						{task.description}
					</p>
				) : null}
				<p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-soft">
					<span className="sr-only">
						{t("tasks.priorityOf", {
							value: t(`tasks.priority.${task.priority}`),
						})}
					</span>
					{task.status === "IN_PROGRESS" ? (
						<span className="text-ink">{t("tasks.status.IN_PROGRESS")}</span>
					) : null}
					{task.dueDate && !done ? (
						<span className={overdue ? "font-medium text-pencil" : ""}>
							{t(overdue ? "tasks.overdue" : "tasks.due", {
								date: formatDay(task.dueDate, language),
							})}
						</span>
					) : null}
					{done && task.completedAt ? (
						<span>
							{t("tasks.completedOn", {
								date: formatTimestampDay(task.completedAt, language),
							})}
						</span>
					) : null}
					{showOwner && task.owner ? (
						<span>
							{t("tasks.owner", { name: task.owner.name ?? task.owner.email })}
						</span>
					) : null}
				</p>
			</div>

			<div className="flex shrink-0 items-center">
				<Button
					aria-label={t("tasks.edit", { title: task.title })}
					variant="icon"
					onClick={() => {
						onEdit(task);
					}}
				>
					<PencilSquareIcon aria-hidden="true" className="size-5" />
				</Button>
				<Button
					aria-label={t("tasks.delete", { title: task.title })}
					className="hover:text-pencil"
					variant="icon"
					onClick={() => {
						onDelete(task);
					}}
				>
					<TrashIcon aria-hidden="true" className="size-5" />
				</Button>
			</div>
		</li>
	);
};
