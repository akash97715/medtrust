"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createParty } from "@/lib/api";
import { cleanPayload } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function AddPartyPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm();

  const mut = useMutation({
    mutationFn: createParty,
    onSuccess: (data) => {
      toast.success("Party saved");
      qc.invalidateQueries({ queryKey: ["parties"] });
      reset();
      router.push(`/parties/${(data as { id: string }).id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-lg mx-auto md:mx-0">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Add Party</h1>
        <p className="text-slate-500 text-sm mt-0.5">पार्टी जोड़ें · Hospital, agency or clinic</p>
      </div>

      <form onSubmit={handleSubmit((v) => mut.mutate(cleanPayload(v as Record<string, unknown>)))} className="space-y-4">
        <Field label="Party type *" hint="खरीदार का प्रकार चुनें">
          <Select onValueChange={(v) => setValue("party_type", v)} defaultValue="hospital">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hospital">Hospital</SelectItem>
              <SelectItem value="agency">Agency</SelectItem>
              <SelectItem value="clinic">Clinic</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Name *" hint="असली hospital या market का नाम लिखें">
          <Input {...register("name", { required: true })} placeholder="e.g. Sadar Hospital" />
          {errors.name && <p className="text-xs text-red-500 mt-0.5">Name is required</p>}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone" hint="WhatsApp / call नंबर">
            <Input {...register("phone")} placeholder="9934XXXXXX" />
          </Field>
          <Field label="Contact person" hint="Doctor या owner का नाम">
            <Input {...register("contact_person")} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="City *" hint="Route planning के लिए">
            <Input {...register("city", { required: true })} />
          </Field>
          <Field label="District">
            <Input {...register("district")} defaultValue="West Champaran" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="State">
            <Input {...register("state")} defaultValue="Bihar" />
          </Field>
          <Field label="Distance from base (km)">
            <Input type="number" step="0.01" {...register("distance_from_base_km")} placeholder="22" />
          </Field>
        </div>

        <Field label="Address line" hint="गली, market या landmark">
          <Input {...register("address_line")} />
        </Field>

        <Field label="Notes" hint="Demand, doctor preference, follow-up context">
          <Textarea {...register("notes")} rows={3} placeholder="Any useful field notes…" />
        </Field>

        <div className="pt-2 pb-6">
          <Button type="submit" className="w-full h-11 text-base" disabled={mut.isPending}>
            {mut.isPending ? "Saving…" : "Save Party"}
          </Button>
        </div>
      </form>
    </div>
  );
}
