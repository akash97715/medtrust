"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getParties, createVisit } from "@/lib/api";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700 block">{label}</label>
      {children}
    </div>
  );
}

function VisitForm({ onSaved }: { onSaved: () => void }) {
  const qc = useQueryClient();
  const router = useRouter();
  const { data: parties, isLoading } = useQuery({ queryKey: ["parties"], queryFn: () => getParties() });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<any>({
    defaultValues: {
      visit_purpose: "reg_existing_invoice",
      visit_status: "completed",
    },
  });

  const mut = useMutation({
    mutationFn: (v: Record<string, unknown>) => createVisit(v),
    onSuccess: (data) => {
      const d = data as { id: string };
      toast.success("Visit logged", {
        duration: 7000,
        action: { label: "View visits →", onClick: () => router.push("/visits") },
      });
      qc.removeQueries({ queryKey: ["visits"] });
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form onSubmit={handleSubmit((v) => mut.mutate(v as Record<string, unknown>))} className="space-y-4">
      <Field label="Party *">
        {isLoading ? <Skeleton className="h-10" /> : (
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
        {errors.party_id && <p className="text-xs text-red-500 mt-0.5">Party is required</p>}
      </Field>

      <Field label="Visit date *">
        <Input type="date" {...register("visit_date", { required: true })} />
        {errors.visit_date && <p className="text-xs text-red-500 mt-0.5">Date is required</p>}
      </Field>

      <Field label="Purpose">
        <Select onValueChange={(v) => setValue("visit_purpose", v)} defaultValue="reg_existing_invoice">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="reg_existing_invoice">Reg Existing Invoice</SelectItem>
            <SelectItem value="submit_invoice">Submit Invoice</SelectItem>
            <SelectItem value="collecting_order_details">Collecting Order Details</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Contact person">
        <Input {...register("contact_snapshot")} placeholder="Name of person met" />
      </Field>

      <Field label="Notes">
        <Textarea {...register("notes")} rows={3} placeholder="What was discussed, what was needed…" />
      </Field>

      <div className="pt-2 pb-6">
        <Button type="submit" className="w-full h-11 text-base" disabled={mut.isPending}>
          {mut.isPending ? "Saving…" : "Save Visit"}
        </Button>
      </div>
    </form>
  );
}

export default function AddVisitPage() {
  const [formKey, setFormKey] = useState(0);
  return (
    <div className="max-w-lg mx-auto md:mx-0">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Log Visit</h1>
        <p className="text-slate-500 text-sm mt-0.5">विज़िट दर्ज करें · Record a field visit</p>
      </div>
      <VisitForm key={formKey} onSaved={() => setFormKey((k) => k + 1)} />
    </div>
  );
}
