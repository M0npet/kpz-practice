import type { ButtonHTMLAttributes } from "react";
import type { FunctionComponent } from "../../common/types";

type Variant = "primary" | "secondary" | "danger" | "icon";

const variants: Record<Variant, string> = {
	primary: "bg-ink text-white hover:bg-ink/90 px-4 py-2",
	secondary:
		"border border-ink/25 bg-sheet text-ink hover:border-ink/60 px-4 py-2",
	danger: "bg-pencil text-white hover:bg-pencil/90 px-4 py-2",
	icon: "text-ink-soft hover:bg-paper hover:text-ink p-2",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: Variant;
};

export const Button = ({
	variant = "primary",
	className = "",
	type = "button",
	...rest
}: ButtonProps): FunctionComponent => (
	<button
		className={`inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
		type={type}
		{...rest}
	/>
);
