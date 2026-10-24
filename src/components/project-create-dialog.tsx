import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClients } from "@/hooks/use-clients";

const optionalAmount = z.string().refine(
  (value) => value.trim() === "" || (Number.isFinite(Number(value)) && Number(value) >= 0),
  "Enter an amount that is zero or greater.",
);

const schema = z.object({
  name: z.string().min(1, "Project name is required.").max(150),
  description: z.string().max(2000).optional(),
  status: z.enum(["active", "completed", "archived"]).default("active"),
  color: z.string().default("#c6963e"),
  client_id: z.string().default("none"),
  billing_type: z.enum(["hourly", "fixed", "non_billable"]).default("hourly"),
  hourly_rate: optionalAmount.default(""),
  fixed_budget: optionalAmount.default(""),
});
type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;
type ProjectCreateValues = Omit<FormValues, "client_id" | "hourly_rate" | "fixed_budget"> & {
  client_id: string | null;
  hourly_rate: number | null;
  fixed_budget: number | null;
};

function amountOrNull(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

export function ProjectCreateDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (v: ProjectCreateValues) => void;
  loading?: boolean;
}) {
  const { data: clientPage } = useClients({ include_archived: true });
  const clients = clientPage?.items ?? [];
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      status: "active",
      color: "#c6963e",
      client_id: "none",
      billing_type: "hourly",
      hourly_rate: "",
      fixed_budget: "",
    },
  });
  const billingType = watch("billing_type");

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  function submit(values: FormValues) {
    onSubmit({
      ...values,
      client_id: values.client_id === "none" ? null : values.client_id,
      hourly_rate: amountOrNull(values.hourly_rate),
      fixed_budget: amountOrNull(values.fixed_budget),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg> New project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New project</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="project_name">Name</Label>
            <Input id="project_name" placeholder="Website redesign" {...register("name")} />
            {errors.name && <p className="mt-1 text-xs text-clay-400">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="project_description">Description</Label>
            <Textarea id="project_description" rows={3} placeholder="What are we building?" {...register("description")} />
          </div>
          <div>
            <Label htmlFor="project_client">Client</Label>
            <Controller
              control={control}
              name="client_id"
              render={({ field }) => (
                <Select value={field.value ?? "none"} onValueChange={field.onChange}>
                  <SelectTrigger id="project_client" aria-label="Client"><SelectValue placeholder="No client" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No client</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="project_status">Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value ?? "active"} onValueChange={field.onChange}>
                    <SelectTrigger id="project_status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label>Color</Label>
              <Controller control={control} name="color" render={({ field }) => <ColorPicker value={field.value ?? "#c6963e"} onChange={field.onChange} />} />
            </div>
          </div>
          <div>
            <Label htmlFor="project_billing_type">Billing type</Label>
            <Controller
              control={control}
              name="billing_type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="project_billing_type" aria-label="Billing type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="fixed">Fixed budget</SelectItem>
                    <SelectItem value="non_billable">Non-billable</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          {billingType === "hourly" && (
            <div>
              <Label htmlFor="project_hourly_rate">Hourly rate</Label>
              <Input id="project_hourly_rate" type="number" min="0" step="0.01" placeholder="120.00" {...register("hourly_rate")} />
              {errors.hourly_rate && <p className="mt-1 text-xs text-clay-400">{errors.hourly_rate.message}</p>}
            </div>
          )}
          {billingType === "fixed" && (
            <div>
              <Label htmlFor="project_fixed_budget">Fixed budget</Label>
              <Input id="project_fixed_budget" type="number" min="0" step="0.01" placeholder="5000.00" {...register("fixed_budget")} />
              {errors.fixed_budget && <p className="mt-1 text-xs text-clay-400">{errors.fixed_budget.message}</p>}
            </div>
          )}
          <DialogFooter>
            <Button type="submit" loading={loading}>Create project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
