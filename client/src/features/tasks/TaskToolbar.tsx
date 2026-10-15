import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/20/solid";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { FunctionComponent } from "../../common/types";
import { Button } from "../../components/ui/Button";
import { controlClass } from "../../components/ui/FormField";
import { TASK_STATUSES, type TaskFilters, type TaskStatus } from "./types";

type TaskToolbarProps = {
	filters: TaskFilters;
	onChange: (filters: TaskFilters) => void;
	onCreate: () => void;
};

const SEARCH_DEBOUNCE_MS = 300;

export const TaskToolbar = ({
	filters,
	onChange,
	onCreate,
}: TaskToolbarProps): FunctionComponent => {
	const { t } = useTranslation();
	const [search, setSearch] = useState(filters.q ?? "");
	const [syncedQuery, setSyncedQuery] = useState(filters.q);

	// The URL changed from outside (back button, "clear filter"): show its value in the input.
	// Done during render, as React recommends for state derived from props.
	if (filters.q !== syncedQuery) {
		setSyncedQuery(filters.q);
		if ((filters.q ?? "") !== search.trim()) setSearch(filters.q ?? "");
	}

	// Debounce typing so the API is not called on every keystroke.
	useEffect(() => {
		const trimmed = search.trim();
		if (trimmed === (filters.q ?? "")) return;
		const timer = setTimeout(() => {
			onChange({ ...filters, q: trimmed || undefined });
		}, SEARCH_DEBOUNCE_MS);
		return (): void => {
			clearTimeout(timer);
		};
	}, [search, filters, onChange]);

	const options: Array<{ value: TaskStatus | undefined; label: string }> = [
		{ value: undefined, label: t("tasks.all") },
		...TASK_STATUSES.map((status) => ({
			value: status,
			label: t(`tasks.status.${status}`),
		})),
	];

	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div
				aria-label={t("tasks.filtersLabel")}
				className="flex flex-wrap gap-1"
				role="group"
			>
				{options.map((option) => {
					const active = option.value === filters.status;
					return (
						<button
							key={option.label}
							aria-pressed={active}
							className={`rounded-md px-2.5 py-1 text-sm ${active ? "highlight font-semibold text-ink" : "text-ink-soft hover:text-ink"}`}
							type="button"
							onClick={() => {
								onChange({ ...filters, status: option.value });
							}}
						>
							{option.label}
						</button>
					);
				})}
			</div>

			<div className="flex gap-2">
				<div className="relative flex-1 sm:w-56 sm:flex-none">
					<MagnifyingGlassIcon
						aria-hidden="true"
						className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-soft"
					/>
					<input
						aria-label={t("tasks.search")}
						className={`${controlClass} pl-8`}
						placeholder={t("tasks.search")}
						type="search"
						value={search}
						onChange={(event) => {
							setSearch(event.target.value);
						}}
					/>
				</div>
				<Button className="shrink-0" onClick={onCreate}>
					<PlusIcon aria-hidden="true" className="size-4" />
					{t("tasks.new")}
				</Button>
			</div>
		</div>
	);
};
