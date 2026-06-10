"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getParties, createVisit } from "@/lib/api";
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

export default function AddVisitPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const { data: parties, isLoading } = useQuery({ queryKey: ["parties"], queryFn: () => getParties() });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<any>({
    defaultValues: {
      visit_purpose: "regular_visit",
      visit_status: "completed",
    },
  });

  const mut = useMutation({
    mutationFn: (v: Record<string, unknown>) => createVisit(cleanPayload(v)),
    onSuccess: (data) => {
      toast.success("Visit saved");
      qc.invalidateQueries({ queryKey: ["visits"] });
      reset();
      router.push(`/parties/${(data as { party_id: string }).party_id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-lg mx-auto md:mx-0">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Log Visit</h1>
        <p className="text-slate-500 text-sm mt-0.5">विज़िट दर्ज करें · Record a field visit</p>
      </div>

      <form onSubmit={handleSubmit((v) => mut.mutate(v as Record<string, unknown>))} className="space-y-4">
        <Field label="Party *" hint="किस hospital या agency को visit किया">
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

        <div className="grid grid-cols-2 gap-3">
          <Field label="Purpose">
            <Select onValueChange={(v) => setValue("visit_purpose", v)} defaultValue="regular_visit">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="regular_visit">Regular visit</SelectItem>
                <SelectItem value="follow_up">Follow-up</SelectItem>
                <SelectItem value="sample_drop">Sample drop</SelectItem>
                <SelectItem value="order_collection">Order collection</SelectItem>
                <SelectItem value="complaint">Complaint</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select onValueChange={(v) => setValue("visit_status", v)} defaultValue="completed">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_contact">No contact</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Location snapshot">
            <Input {...register("location_snapshot")} placeholder="e.g. Bagaha Bus Stand" />
          </Field>
          <Field label="Distance (km)">
            <Input type="number" step="0.01" {...register("distance_snapshot_km")} placeholder="22" />
          </Field>
        </div>

        <Field label="Contact snapshot">
          <Input {...register("contact_snapshot")} placeholder="Name of person met" />
        </Field>

        <Field label="Notes" hint="क्या हुआ, क्या चाहिए था, follow-up">
          <Textarea {...register("notes")} rows={3} placeholder="What was discussed, what was needed…" />
        </Field>

        <div className="pt-2 pb-6">
          <Button type="submit" className="w-full h-11 text-base" disabled={mut.isPending}>
            {mut.isPending ? "Saving…" : "Save Visit"}
          </Button>
        </div>
      </form>
    </div>
  );
}
