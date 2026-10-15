import { useTranslation } from "react-i18next";
import { describeError } from "../../common/errors";
import type { FunctionComponent } from "../../common/types";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { toast } from "../../store/toast-store";
import { useDeleteTask } from "./queries";
import type { Task } from "./types";

type DeleteTaskDialogProps = {
	task: Task | null;
	onClose: () => void;
};

export const DeleteTaskDialog = ({
	task,
	onClose,
}: DeleteTaskDialogProps): FunctionComponent => {
	const { t } = useTranslation();
	const deleteTask = useDeleteTask();

	const confirm = (): void => {
		if (!task) return;
		deleteTask.mutate(task.id, {
			onSuccess: () => {
				toast(t("tasks.toast.deleted"));
				onClose();
			},
			onError: (error) => {
				toast(describeError(error, t), "error");
			},
		});
	};

	return (
		<Modal
			open={task !== null}
			size="sm"
			title={t("tasks.deleteDialog.title")}
			onClose={onClose}
		>
			<p className="text-sm break-words text-ink-soft">
				{t("tasks.deleteDialog.body", { title: task?.title ?? "" })}
			</p>
			<div className="mt-6 flex justify-end gap-2">
				<Button variant="secondary" onClick={onClose}>
					{t("tasks.deleteDialog.cancel")}
				</Button>
				<Button
					disabled={deleteTask.isPending}
					variant="danger"
					onClick={confirm}
				>
					{deleteTask.isPending
						? t("tasks.deleteDialog.deleting")
						: t("tasks.deleteDialog.confirm")}
				</Button>
			</div>
		</Modal>
	);
};
