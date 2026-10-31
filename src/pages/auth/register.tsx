import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRegister } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";

const schema = z.object({
  full_name: z.string().min(1, "Your name is required."),
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .refine(
      (v) => !/^[a-zA-Z]+$/.test(v) && !/^[0-9]+$/.test(v),
      "Use a mix of letters and numbers.",
    ),
  workspace_name: z.string().min(1, "Workspace name is required."),
});
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const registerUser = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  return (
    <AuthLayout
      title="Create your workspace"
      subtitle="Start managing clients and projects in minutes"
    >
      <form
        onSubmit={handleSubmit((v) => registerUser.mutate(v))}
        className="space-y-4"
        noValidate
      >
        <div>
          <Label htmlFor="full_name">Your name</Label>
          <Input
            id="full_name"
            autoComplete="name"
            placeholder="Ada Lovelace"
            {...register("full_name")}
          />
          {errors.full_name && (
            <p className="mt-1 text-xs text-clay-400">
              {errors.full_name.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="workspace_name">Workspace name</Label>
          <Input
            id="workspace_name"
            placeholder="Acme Studio"
            {...register("workspace_name")}
          />
          {errors.workspace_name && (
            <p className="mt-1 text-xs text-clay-400">
              {errors.workspace_name.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-clay-400">{errors.email.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-clay-400">
              {errors.password.message}
            </p>
          )}
        </div>

        {registerUser.isError && (
          <p className="rounded-[var(--radius-card)] border border-clay-500/30 bg-clay-950 px-3 py-2 text-sm text-clay-400">
            {registerUser.error instanceof ApiError
              ? registerUser.error.detail
              : "Something went wrong."}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          loading={registerUser.isPending}
        >
          Create workspace
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-paper-500">
        Already have an account?{" "}
        <Link to="/login" className="text-brass-400 hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
