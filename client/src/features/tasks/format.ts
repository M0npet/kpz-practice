import type { Task } from "./types";

const pad = (value: number): string => String(value).padStart(2, "0");

/** Today as YYYY-MM-DD in the user's local time zone (the format the API uses for dueDate). */
export const todayIso = (now: Date = new Date()): string =>
	`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

export const isOverdue = (task: Task, today: string = todayIso()): boolean =>
	task.status !== "DONE" && task.dueDate !== null && task.dueDate < today;

/** "2026-10-20" -> "20 жовт." / "Oct 20". Parsed as a local date, not UTC midnight. */
export const formatDay = (isoDate: string, language: string): string => {
	const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
	const date = new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
	const sameYear = date.getFullYear() === new Date().getFullYear();
	return new Intl.DateTimeFormat(language, {
		day: "numeric",
		month: "short",
		...(sameYear ? {} : { year: "numeric" }),
	}).format(date);
};

/** completedAt is a timestamp; show it as a local day. */
export const formatTimestampDay = (
	timestamp: string,
	language: string
): string => formatDay(todayIso(new Date(timestamp)), language);
