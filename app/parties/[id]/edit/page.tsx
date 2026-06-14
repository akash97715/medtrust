"use client";
import { use, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getParty, updateParty } from "@/lib/api";
import { cleanPayload } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function EditPartyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["party", id], queryFn: () => getParty(id), staleTime: 0, refetchOnMount: "always" });
  const { register, handleSubmit, setValue, reset } = useForm();

  useEffect(() => {
    if (data) {
      const p = data as Record<string, unknown>;
      reset({
        name: p.party_name, phone: p.phone ?? "", contact_person: p.contact_person ?? "",
        address_line: p.address_line ?? "", notes: p.notes ?? "",
        city: p.city, district: p.district ?? "", state: p.state ?? "Bihar",
        distance_from_base_km: p.distance_from_base_km ?? "",
        base_reference: p.base_reference ?? "", party_type: p.party_type,
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (values: unknown) => updateParty(id, values),
    onSuccess: () => {
      toast.success("Party updated");
      qc.clear(); // wipe entire cache so detail page always fetches fresh
      router.push(`/parties/${id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="space-y-4">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href={`/parties/${id}`} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2">
          <ArrowLeft size={14} /> Back
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Edit Party</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit((v) => mutation.mutate(cleanPayload(v as Record<string, unknown>)))} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Party type</label>
                <Select onValueChange={(v) => setValue("party_type", v)} defaultValue={String((data as Record<string, unknown>)?.party_type ?? "hospital")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hospital">Hospital</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                    <SelectItem value="clinic">Clinic</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Name *</label>
                <Input {...register("name", { required: true })} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Phone</label>
                <Input {...register("phone")} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Contact person</label>
                <Input {...register("contact_person")} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">City *</label>
                <Input {...register("city", { required: true })} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">District</label>
                <Input {...register("district")} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">State</label>
                <Input {...register("state")} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Distance from base (km)</label>
                <Input type="number" step="0.01" {...register("distance_from_base_km")} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Base reference</label>
                <Input {...register("base_reference")} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">Address line</label>
                <Input {...register("address_line")} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Notes</label>
              <Textarea {...register("notes")} rows={3} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : "Save changes"}
              </Button>
              <Link href={`/parties/${id}`}><Button type="button" variant="outline">Cancel</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
