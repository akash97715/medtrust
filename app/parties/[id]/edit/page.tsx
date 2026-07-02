"use client";
import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getParty, updateParty } from "@/lib/api";
import { cleanPayload } from "@/lib/utils";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

type PartyFormValues = {
  party_type: string;
  name: string;
  phone: string;
  contact_person: string;
  address_line: string;
  city: string;
  district: string;
  state: string;
  distance_from_base_km: string | number;
  notes: string;
};

function EditForm({ party, id }: { party: Record<string, unknown>; id: string }) {
  const router = useRouter();
  const qc = useQueryClient();

  const { register, handleSubmit, control } = useForm<PartyFormValues>({
    defaultValues: {
      party_type: String(party.party_type ?? "hospital"),
      name: String(party.party_name ?? ""),
      phone: String(party.phone ?? ""),
      contact_person: String(party.contact_person ?? ""),
      address_line: String(party.address_line ?? ""),
      city: String(party.city ?? ""),
      district: String(party.district ?? ""),
      state: String(party.state ?? "Bihar"),
      distance_from_base_km: (party.distance_from_base_km as string | number) ?? "",
      notes: String(party.notes ?? ""),
    },
  });

  const mutation = useMutation({
    mutationFn: (values: unknown) => updateParty(id, values),
    onSuccess: () => {
      toast.success("Party updated");
      qc.clear();
      router.push(`/parties/${id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-slate-800">{String(party.party_name ?? "")}</h1>
          <p className="text-xs text-slate-400 mt-0.5">Edit party details</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit((v) => mutation.mutate(cleanPayload(v as Record<string, unknown>)))}
        className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100"
      >
        {/* Identity */}
        <div className="p-5 space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Identity</p>
          <Field label="Party type">
            <Controller
              name="party_type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hospital">Hospital</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                    <SelectItem value="clinic">Clinic</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Name *">
            <Input {...register("name", { required: true })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone">
              <Input {...register("phone")} placeholder="—" />
            </Field>
            <Field label="Contact person">
              <Input {...register("contact_person")} placeholder="—" />
            </Field>
          </div>
          <Field label="Address">
            <Input {...register("address_line")} placeholder="—" />
          </Field>
        </div>

        {/* Location */}
        <div className="p-5 space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="City *">
              <Input {...register("city", { required: true })} />
            </Field>
            <Field label="District">
              <Input {...register("district")} placeholder="—" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="State">
              <Input {...register("state")} />
            </Field>
            <Field label="Distance from base (km)">
              <Input type="number" step="0.01" {...register("distance_from_base_km")} placeholder="—" />
            </Field>
          </div>
        </div>

        {/* Notes */}
        <div className="p-5 space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Notes</p>
          <Textarea {...register("notes")} rows={3} placeholder="Any additional notes…" />
        </div>

        {/* Actions */}
        <div className="p-5 flex gap-3">
          <Button type="submit" disabled={mutation.isPending} className="bg-teal-600 hover:bg-teal-700">
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function EditPartyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading } = useQuery({
    queryKey: ["party", id],
    queryFn: () => getParty(id),
    staleTime: 0,
    refetchOnMount: "always",
  });

  if (isLoading || !data) {
    return (
      <div className="max-w-xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return <EditForm party={data as Record<string, unknown>} id={id} />;
}
