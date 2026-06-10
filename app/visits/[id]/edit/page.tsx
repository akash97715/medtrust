"use client";
import { use, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVisit, updateVisit, deleteVisit, deleteVisitItem } from "@/lib/api";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";
import { fmt } from "@/lib/utils";

export default function EditVisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["visit", id], queryFn: () => getVisit(id) });
  const { register, handleSubmit, setValue, reset, watch } = useForm();

  useEffect(() => {
    if (data) {
      const v = data as Record<string, unknown>;
      reset({
        visit_date: v.visit_date, visit_purpose: v.visit_purpose,
        visit_status: v.visit_status, location_snapshot: v.location_snapshot ?? "",
        distance_snapshot_km: v.distance_snapshot_km ?? "",
        contact_snapshot: v.contact_snapshot ?? "", notes: v.notes ?? "",
      });
    }
  }, [data, reset]);

  const updateMut = useMutation({
    mutationFn: (values: unknown) => updateVisit(id, values),
    onSuccess: () => { toast.success("Visit updated"); qc.invalidateQueries({ queryKey: ["visits"] }); router.push("/visits"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteVisit(id),
    onSuccess: () => { toast.success("Visit deleted"); qc.invalidateQueries({ queryKey: ["visits"] }); router.push("/visits"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteItemMut = useMutation({
    mutationFn: (itemId: string) => deleteVisitItem(itemId),
    onSuccess: () => { toast.success("Item removed"); qc.invalidateQueries({ queryKey: ["visit", id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="space-y-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>;
  const v = data as Record<string, unknown>;
  const items = (v?.items as Record<string, unknown>[]) ?? [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/visits" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2">
          <ArrowLeft size={14} /> Visits
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Edit Visit</h1>
        <p className="text-slate-500 text-sm mt-1">{fmt(v?.party_name)} · Party cannot be changed</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Visit details</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit((vals) => updateMut.mutate(vals))} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Visit date *</label>
                    <Input type="date" {...register("visit_date", { required: true })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Purpose</label>
                    <Select onValueChange={(v) => setValue("visit_purpose", v)} value={watch("visit_purpose") ?? String(v?.visit_purpose ?? "regular_visit")}>
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
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Status</label>
                    <Select onValueChange={(v) => setValue("visit_status", v)} value={watch("visit_status") ?? String(v?.visit_status ?? "completed")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="no_contact">No contact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Contact snapshot</label>
                    <Input {...register("contact_snapshot")} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Location snapshot</label>
                    <Input {...register("location_snapshot")} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Distance (km)</label>
                    <Input type="number" step="0.01" {...register("distance_snapshot_km")} />
                  </div>
                </div>
                <div><label className="text-sm font-medium text-slate-700 block mb-1">Notes</label><Textarea {...register("notes")} rows={2} /></div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={updateMut.isPending}>{updateMut.isPending ? "Saving…" : "Save changes"}</Button>
                  <Link href="/visits"><Button type="button" variant="outline">Cancel</Button></Link>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Requested items</CardTitle></CardHeader>
            <CardContent>
              {items.length === 0 ? <p className="text-slate-400 text-sm">No items for this visit.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-slate-500">
                        <th className="pb-2 pr-4 text-left font-medium">Product</th>
                        <th className="pb-2 pr-4 text-left font-medium">Type</th>
                        <th className="pb-2 pr-4 text-left font-medium">Qty Est.</th>
                        <th className="pb-2 pr-4 text-left font-medium">Brand</th>
                        <th className="pb-2 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                          <td className="py-2 pr-4 font-medium">{fmt(item.product_name)}</td>
                          <td className="py-2 pr-4 text-slate-500">{fmt(item.requirement_type)}</td>
                          <td className="py-2 pr-4">{fmt(item.quantity_estimate)} {fmt(item.unit_of_measure)}</td>
                          <td className="py-2 pr-4 text-slate-500">{fmt(item.brand_preference)}</td>
                          <td className="py-2">
                            <AlertDialog>
                              <AlertDialogTrigger className="text-slate-300 hover:text-red-500">
                                <Trash2 size={13} />
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove this item?</AlertDialogTitle>
                                  <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteItemMut.mutate(String(item.id))} className="bg-red-600 hover:bg-red-700">Remove</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-red-100">
            <CardHeader><CardTitle className="text-base text-red-600">Delete visit</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 mb-3">Permanently removes this visit and all its requested items. Cannot be undone.</p>
              <AlertDialog>
                <AlertDialogTrigger className="inline-flex items-center justify-center gap-1.5 w-full text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-md px-3 py-1.5 transition-colors">
                  <Trash2 size={14} />Delete visit
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this visit?</AlertDialogTitle>
                    <AlertDialogDescription>All requested items for this visit will also be deleted. This cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMut.mutate()} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
