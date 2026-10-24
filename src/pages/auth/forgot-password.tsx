import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useForgotPassword } from "@/hooks/use-auth";

const schema = z.object({ email: z.string().email("Enter a valid email address.") });
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (forgotPassword.isSuccess) {
    return (
      <AuthLayout title="Check your email" subtitle="If that address exists, we've sent a reset link.">
        <Link to="/login" className="text-sm text-brass-400 hover:underline">
          Back to log in
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a link to reset it">
      <form onSubmit={handleSubmit((v) => forgotPassword.mutate(v.email))} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" {...register("email")} />
          {errors.email && <p className="mt-1 text-xs text-clay-400">{errors.email.message}</p>}
        </div>
        <Button type="submit" className="w-full" loading={forgotPassword.isPending}>
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-paper-500">
        <Link to="/login" className="text-brass-400 hover:underline">
          Back to log in
        </Link>
      </p>
    </AuthLayout>
  );
}
