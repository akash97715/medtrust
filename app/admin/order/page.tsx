"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getParties, getProducts, createOrder } from "@/lib/api";
import { cleanPayload } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700 block">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export default function AddOrderPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const { data: parties, isLoading: lp } = useQuery({ queryKey: ["parties"], queryFn: () => getParties() });
  const { data: products, isLoading: lprod } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<any>({
    defaultValues: { order_status: "confirmed", unit_of_measure: "piece" },
  });

  const mut = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      toast.success("Order saved");
      qc.invalidateQueries({ queryKey: ["orders"] });
      reset();
      router.push(`/parties/${(data as { party_id: string }).party_id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-lg mx-auto md:mx-0">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Add Order</h1>
        <p className="text-slate-500 text-sm mt-0.5">ऑर्डर जोड़ें · Confirmed orders only</p>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
        <p className="text-xs text-amber-700 font-medium">Confirmed business only</p>
        <p className="text-xs text-amber-600 mt-0.5">Saving updates party-wise product pricing automatically.</p>
      </div>

      <form onSubmit={handleSubmit((v) => mut.mutate(cleanPayload(v as Record<string, unknown>)))} className="space-y-4">
        <Field label="Party *">
          {lp ? <Skeleton className="h-10" /> : (
            <Select onValueChange={(v) => setValue("party_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select party…" /></SelectTrigger>
              <SelectContent>
                {(parties as Record<string, unknown>[] ?? []).map((p) => (
                  <SelectItem key={String(p.party_id)} value={String(p.party_id)}>
                    {String(p.party_name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>

        <Field label="Product *">
          {lprod ? <Skeleton className="h-10" /> : (
            <Select onValueChange={(v) => setValue("product_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select product…" /></SelectTrigger>
              <SelectContent>
                {(products as Record<string, unknown>[] ?? []).map((p) => (
                  <SelectItem key={String(p.product_id)} value={String(p.product_id)}>
                    {String(p.product_name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Order date *">
            <Input type="date" {...register("order_date", { required: true })} />
          </Field>
          <Field label="Status">
            <Select onValueChange={(v) => setValue("order_status", v)} defaultValue="confirmed">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantity *" hint="Amount ordered">
            <Input type="number" step="0.01" {...register("quantity", { required: true })} placeholder="100" />
            {errors.quantity && <p className="text-xs text-red-500 mt-0.5">Required</p>}
          </Field>
          <Field label="Unit">
            <Input {...register("unit_of_measure")} defaultValue="piece" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Buy rate" hint="Your cost price">
            <Input type="number" step="0.01" {...register("buy_rate")} placeholder="0.00" />
          </Field>
          <Field label="Sell rate" hint="Price charged to party">
            <Input type="number" step="0.01" {...register("sell_rate")} placeholder="0.00" />
          </Field>
        </div>

        <Field label="Reference number">
          <Input {...register("reference_number")} placeholder="Optional PO or ref" />
        </Field>

        <Field label="Notes">
          <Textarea {...register("notes")} rows={3} />
        </Field>

        <div className="pt-2 pb-6">
          <Button type="submit" className="w-full h-11 text-base" disabled={mut.isPending}>
            {mut.isPending ? "Saving…" : "Save Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}
