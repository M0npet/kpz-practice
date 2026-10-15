import { useTranslation } from "react-i18next";
import { describeError } from "../../common/errors";
import type { FunctionComponent } from "../../common/types";
import { Button } from "../../components/ui/Button";
import { toast } from "../../store/toast-store";
import { useUpdateTask, useTasks } from "./queries";
import { TaskRow } from "./TaskRow";
import type { Task, TaskFilters } from "./types";

type TaskListProps = {
	filters: TaskFilters;
	showOwner: boolean;
	onEdit: (task: Task) => void;
	onDelete: (task: Task) => void;
	onResetFilters: () => void;
};

export const TaskList = ({
	filters,
	showOwner,
	onEdit,
	onDelete,
	onResetFilters,
}: TaskListProps): FunctionComponent => {
	const { t } = useTranslation();
	const tasksQuery = useTasks(filters);
	const updateTask = useUpdateTask();
	const filtered = Boolean(filters.status ?? filters.q);

	const toggle = (task: Task): void => {
		const status = task.status === "DONE" ? "TODO" : "DONE";
		updateTask.mutate(
			{ id: task.id, payload: { status } },
			{
				onSuccess: () => {
					toast(
						t(status === "DONE" ? "tasks.toast.done" : "tasks.toast.reopened")
					);
				},
				onError: (error) => {
					toast(describeError(error, t), "error");
				},
			}
		);
	};

	if (tasksQuery.isPending) {
		return (
			<p className="py-10 text-center text-sm text-ink-soft">
				{t("tasks.loading")}
			</p>
		);
	}

	if (tasksQuery.isError) {
		return (
			<div
				className="rounded-lg border border-pencil/30 bg-sheet px-5 py-6"
				role="alert"
			>
				<p className="text-sm text-pencil">
					{t("tasks.loadError", { reason: describeError(tasksQuery.error, t) })}
				</p>
				<Button
					className="mt-4"
					variant="secondary"
					onClick={() => {
						void tasksQuery.refetch();
					}}
				>
					{t("tasks.retry")}
				</Button>
			</div>
		);
	}

	const tasks = tasksQuery.data;

	if (tasks.length === 0) {
		return (
			<div className="rounded-lg border border-dashed border-ink/25 bg-sheet/70 px-5 py-10 text-center">
				<p className="text-sm text-ink-soft">
					{filtered ? t("tasks.emptyFiltered") : t("tasks.empty")}
				</p>
				{filtered ? (
					<Button className="mt-4" variant="secondary" onClick={onResetFilters}>
						{t("tasks.resetFilters")}
					</Button>
				) : null}
			</div>
		);
	}

	return (
		<section aria-busy={tasksQuery.isFetching}>
			<p className="mb-2 text-sm text-ink-soft">
				{t("tasks.count", { count: tasks.length })}
			</p>
			<ul className="divide-y divide-grid rounded-lg border border-grid bg-sheet">
				{tasks.map((task) => (
					<TaskRow
						key={task.id}
						showOwner={showOwner}
						task={task}
						onDelete={onDelete}
						onEdit={onEdit}
						onToggle={toggle}
					/>
				))}
			</ul>
		</section>
	);
};
