"use client";
import { use, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrder, updateOrder, deleteOrder, updateOrderItem, deleteOrderItem } from "@/lib/api";
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
import { ArrowLeft, Trash2, Pencil } from "lucide-react";
import { money, fmt } from "@/lib/utils";

function EditItemRow({ item, onSaved, onDeleted }: { item: Record<string, unknown>; onSaved: () => void; onDeleted: () => void }) {
  const [editing, setEditing] = useState(false);
  const { register, handleSubmit, reset } = useForm({ defaultValues: {
    quantity: item.quantity, unit_of_measure: item.unit_of_measure,
    buy_rate: item.buy_rate ?? "", sell_rate: item.sell_rate ?? "", notes: item.notes ?? "",
  }});

  const updateMut = useMutation({
    mutationFn: (v: unknown) => updateOrderItem(String(item.id), v),
    onSuccess: () => { toast.success("Item updated"); setEditing(false); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteOrderItem(String(item.id)),
    onSuccess: () => { toast.success("Item removed"); onDeleted(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (editing) {
    return (
      <tr className="bg-slate-50">
        <td className="py-2 pr-4 font-medium">{fmt(item.product_name)}</td>
        <td className="py-2 pr-2"><Input type="number" step="0.01" {...register("quantity")} className="h-7 text-xs w-20" /></td>
        <td className="py-2 pr-2"><Input {...register("unit_of_measure")} className="h-7 text-xs w-20" /></td>
        <td className="py-2 pr-2"><Input type="number" step="0.01" {...register("buy_rate")} className="h-7 text-xs w-24" /></td>
        <td className="py-2 pr-2"><Input type="number" step="0.01" {...register("sell_rate")} className="h-7 text-xs w-24" /></td>
        <td className="py-2 pr-4 text-right text-slate-400">—</td>
        <td className="py-2">
          <div className="flex gap-1">
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit((v) => updateMut.mutate(v))} disabled={updateMut.isPending}>Save</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setEditing(false); reset(); }}>Cancel</Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b last:border-0 hover:bg-slate-50">
      <td className="py-2 pr-4 font-medium">{fmt(item.product_name)}</td>
      <td className="py-2 pr-4">{fmt(item.quantity)}</td>
      <td className="py-2 pr-4 text-slate-500">{fmt(item.unit_of_measure)}</td>
      <td className="py-2 pr-4">{money(item.buy_rate as number)}</td>
      <td className="py-2 pr-4">{money(item.sell_rate as number)}</td>
      <td className="py-2 pr-4 text-right font-medium text-teal-700">{money(item.line_value as number)}</td>
      <td className="py-2">
        <div className="flex gap-2 items-center">
          <button onClick={() => setEditing(true)} className="text-slate-400 hover:text-teal-600"><Pencil size={13} /></button>
          <AlertDialog>
            <AlertDialogTrigger className="text-slate-300 hover:text-red-500">
              <Trash2 size={13} />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Remove this line item?</AlertDialogTitle></AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMut.mutate()} className="bg-red-600 hover:bg-red-700">Remove</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  );
}

import { useState } from "react";

export default function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["order", id], queryFn: () => getOrder(id) });
  const { register, handleSubmit, setValue, reset } = useForm();

  useEffect(() => {
    if (data) {
      const o = data as Record<string, unknown>;
      reset({ order_date: o.order_date, order_status: o.order_status, reference_number: o.reference_number ?? "", notes: o.notes ?? "" });
    }
  }, [data, reset]);

  const updateMut = useMutation({
    mutationFn: (v: unknown) => updateOrder(id, v),
    onSuccess: () => { toast.success("Order updated"); qc.invalidateQueries({ queryKey: ["order", id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteOrder(id),
    onSuccess: () => { toast.success("Order deleted"); qc.invalidateQueries({ queryKey: ["orders"] }); router.push("/orders"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["order", id] });

  if (isLoading) return <div className="space-y-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>;
  const o = data as Record<string, unknown>;
  const items = (o?.items as Record<string, unknown>[]) ?? [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/orders" className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 mb-2"><ArrowLeft size={14} /> Orders</Link>
        <h1 className="text-2xl font-bold text-slate-800">Edit Order</h1>
        <p className="text-slate-500 text-sm mt-1">{fmt(o?.party_name)} · {fmt(o?.order_date)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Order header</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit((v) => updateMut.mutate(v))} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Order date *</label>
                    <Input type="date" {...register("order_date", { required: true })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Status</label>
                    <Select onValueChange={(v) => setValue("order_status", v)} defaultValue={String(o?.order_status ?? "confirmed")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Reference number</label>
                    <Input {...register("reference_number")} />
                  </div>
                </div>
                <div><label className="text-sm font-medium text-slate-700 block mb-1">Notes</label><Textarea {...register("notes")} rows={2} /></div>
                <Button type="submit" disabled={updateMut.isPending}>{updateMut.isPending ? "Saving…" : "Save changes"}</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Line items</CardTitle></CardHeader>
            <CardContent>
              {items.length === 0 ? <p className="text-slate-400 text-sm">No line items.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-slate-500">
                        <th className="pb-2 pr-4 text-left font-medium">Product</th>
                        <th className="pb-2 pr-4 text-left font-medium">Qty</th>
                        <th className="pb-2 pr-4 text-left font-medium">Unit</th>
                        <th className="pb-2 pr-4 text-left font-medium">Buy Rate</th>
                        <th className="pb-2 pr-4 text-left font-medium">Sell Rate</th>
                        <th className="pb-2 pr-4 text-right font-medium">Line Value</th>
                        <th className="pb-2 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <EditItemRow key={i} item={item} onSaved={refresh} onDeleted={refresh} />
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
            <CardHeader><CardTitle className="text-base text-red-600">Delete order</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 mb-3">Permanently deletes the order and all its line items. Consider setting status to <strong>Cancelled</strong> to preserve history instead.</p>
              <AlertDialog>
                <AlertDialogTrigger className="inline-flex items-center justify-center gap-1.5 w-full text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-md px-3 py-1.5 transition-colors">
                  <Trash2 size={14} />Delete order
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this order?</AlertDialogTitle>
                    <AlertDialogDescription>All line items will be deleted. This cannot be undone.</AlertDialogDescription>
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
