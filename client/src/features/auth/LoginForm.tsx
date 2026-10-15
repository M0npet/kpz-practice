import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { apiRequest, ApiError } from "../../api/http";
import { describeError } from "../../common/errors";
import type { FunctionComponent } from "../../common/types";
import { Button } from "../../components/ui/Button";
import { controlClass, FormField } from "../../components/ui/FormField";
import { useAuthStore } from "./auth-store";

const loginSchema = z.object({
	email: z.email("auth.errors.emailInvalid"),
	password: z.string().min(1, "auth.errors.passwordRequired"),
});
type LoginValues = z.infer<typeof loginSchema>;

const DEMO_ACCOUNT: LoginValues = {
	email: "standard@standard.com",
	password: "pass1",
};

export const LoginForm = ({
	onSuccess,
}: {
	onSuccess: () => void;
}): FunctionComponent => {
	const { t } = useTranslation();
	const setToken = useAuthStore((state) => state.setToken);
	const {
		register,
		handleSubmit,
		setValue,
		setError,
		clearErrors,
		formState: { errors, isSubmitting },
	} = useForm<LoginValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: "", password: "" },
	});

	const onSubmit = async (values: LoginValues): Promise<void> => {
		try {
			const response = await apiRequest<string>("/auth/login", {
				method: "POST",
				body: values,
				skipAuth: true,
			});
			setToken(response.data);
			onSuccess();
		} catch (error) {
			// The API answers 404 for both an unknown email and a wrong password.
			const wrongCredentials =
				error instanceof ApiError &&
				(error.status === 404 || error.status === 400);
			setError("root", {
				message: wrongCredentials
					? t("auth.invalidCredentials")
					: describeError(error, t),
			});
		}
	};

	const message = (field: keyof LoginValues): string | undefined => {
		const text = errors[field]?.message;
		return text ? t(text as never) : undefined;
	};

	return (
		<form noValidate className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
			<FormField
				error={message("email")}
				id="login-email"
				label={t("auth.email")}
			>
				<input
					aria-describedby={errors.email ? "login-email-error" : undefined}
					aria-invalid={errors.email ? true : undefined}
					autoComplete="username"
					className={controlClass}
					id="login-email"
					type="email"
					{...register("email")}
				/>
			</FormField>
			<FormField
				error={message("password")}
				id="login-password"
				label={t("auth.password")}
			>
				<input
					aria-invalid={errors.password ? true : undefined}
					autoComplete="current-password"
					className={controlClass}
					id="login-password"
					type="password"
					aria-describedby={
						errors.password ? "login-password-error" : undefined
					}
					{...register("password")}
				/>
			</FormField>

			{errors.root?.message ? (
				<p
					className="rounded-md bg-pencil/10 px-3 py-2 text-sm text-pencil"
					role="alert"
				>
					{errors.root.message}
				</p>
			) : null}

			<Button className="w-full" disabled={isSubmitting} type="submit">
				{isSubmitting ? t("auth.submitting") : t("auth.submit")}
			</Button>

			<div className="border-t border-grid pt-4 text-sm text-ink-soft">
				<p>{t("auth.demoHint")}</p>
				<button
					className="mt-2 font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
					type="button"
					onClick={() => {
						clearErrors();
						setValue("email", DEMO_ACCOUNT.email);
						setValue("password", DEMO_ACCOUNT.password);
					}}
				>
					{t("auth.demo")}
				</button>
			</div>
		</form>
	);
};
