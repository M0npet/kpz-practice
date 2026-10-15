import type { ReactNode } from "react";
import type { FunctionComponent } from "../../common/types";

export const controlClass =
	"block w-full rounded-md border border-ink/20 bg-sheet px-3 py-2 text-sm text-ink placeholder:text-ink-soft/70 hover:border-ink/40 aria-invalid:border-pencil";

type FormFieldProps = {
	id: string;
	label: string;
	hint?: string;
	error?: string;
	children: ReactNode;
};

/**
 * Label + control + error message. The control itself must carry
 * `id`, `aria-invalid` and `aria-describedby={`${id}-error`}`.
 */
export const FormField = ({
	id,
	label,
	hint,
	error,
	children,
}: FormFieldProps): FunctionComponent => (
	<div>
		<label className="mb-1 block text-sm font-medium" htmlFor={id}>
			{label}
			{hint ? (
				<span className="ml-1 font-normal text-ink-soft">({hint})</span>
			) : null}
		</label>
		{children}
		{error ? (
			<p className="mt-1 text-sm text-pencil" id={`${id}-error`}>
				{error}
			</p>
		) : null}
	</div>
);
