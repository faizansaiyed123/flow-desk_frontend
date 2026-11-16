import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLogin } from "@/hooks/use-auth";
import { ApiError } from "@/lib/api-client";
import { DEMO_MODE, DEMO_PASSWORD } from "@/lib/demo-api";

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "alex@northstar.demo", password: "Demo1234!" },
  });

  const onSubmit = (values: FormValues) => login.mutate(values);

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to your workspace">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="mb-1.5 text-xs text-brass-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-clay-400">
              {errors.password.message}
            </p>
          )}
        </div>

        {login.isError && (
          <p className="rounded-[var(--radius-card)] border border-clay-500/30 bg-clay-950 px-3 py-2 text-sm text-clay-400">
            {login.error instanceof ApiError
              ? login.error.detail
              : "Something went wrong."}
          </p>
        )}

        <Button type="submit" className="w-full" loading={login.isPending}>
          Log in
        </Button>
      </form>

      {DEMO_MODE && (
        <div className="mt-4 rounded-[var(--radius-card)] border border-line-700 bg-ink-900 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-paper-100">Demo workspaces</p>
            <span className="text-[11px] text-paper-500">Password: {DEMO_PASSWORD}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Owner", email: "alex@northstar.demo" },
              { label: "Admin", email: "jordan@northstar.demo" },
              { label: "Member", email: "sam@northstar.demo" },
              { label: "Viewer", email: "taylor@northstar.demo" },
            ].map((account) => (
              <button key={account.email} type="button" onClick={() => { setValue("email", account.email); setValue("password", DEMO_PASSWORD); }} className="rounded-md border border-line-600 px-3 py-2 text-left text-xs text-paper-300 transition-colors hover:border-brass-400/50 hover:bg-ink-800">
                <span className="block font-semibold text-paper-100">{account.label}</span>
                <span className="mt-0.5 block truncate text-paper-500">{account.email}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-5 text-paper-500">Changes are stored only in this browser. The demo does not need a running backend.</p>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-paper-500">
        Don't have an account?{" "}
        <Link to="/register" className="text-brass-400 hover:underline">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
