import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSearchParams } from "react-router-dom";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useResetPassword } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";

const schema = z.object({ new_password: z.string().min(8, "Password must be at least 8 characters.") });
type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const resetPassword = useResetPassword();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <AuthLayout title="Set a new password">
      <form onSubmit={handleSubmit((v) => resetPassword.mutate({ token, ...v }))} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="new_password">New password</Label>
          <Input id="new_password" type="password" autoComplete="new-password" {...register("new_password")} />
          {errors.new_password && <p className="mt-1 text-xs text-clay-400">{errors.new_password.message}</p>}
        </div>
        {resetPassword.isError && (
          <p className="rounded-[var(--radius-card)] border border-clay-500/30 bg-clay-950 px-3 py-2 text-sm text-clay-400">
            {resetPassword.error instanceof ApiError ? resetPassword.error.detail : "Something went wrong."}
          </p>
        )}
        <Button type="submit" className="w-full" loading={resetPassword.isPending} disabled={!token}>
          Reset password
        </Button>
        {!token && <p className="text-xs text-clay-400">This link is missing its reset token.</p>}
      </form>
    </AuthLayout>
  );
}
