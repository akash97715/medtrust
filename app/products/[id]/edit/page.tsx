"use client";
import { use, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProduct, updateProduct, deleteProduct, addProductAlias, deleteProductAlias } from "@/lib/api";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, X } from "lucide-react";
import { fmt } from "@/lib/utils";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["product", id], queryFn: () => getProduct(id) });
  const { register, handleSubmit, reset } = useForm();
  const { register: regAlias, handleSubmit: handleAlias, reset: resetAlias } = useForm();

  useEffect(() => {
    if (data) {
      const p = data as Record<string, unknown>;
      reset({
        product_name: p.product_name, sku: p.sku ?? "", product_category: p.product_category ?? "",
        unit_of_measure: p.unit_of_measure ?? "piece", preferred_brand: p.preferred_brand ?? "",
        hindi_name: p.hindi_name ?? "", notes: p.notes ?? "",
        sample_priority: p.sample_priority,
      });
    }
  }, [data, reset]);

  const updateMut = useMutation({
    mutationFn: (values: unknown) => updateProduct(id, values),
    onSuccess: () => { toast.success("Product updated"); qc.invalidateQueries({ queryKey: ["products"] }); router.push("/products"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deactivateMut = useMutation({
    mutationFn: () => deleteProduct(id),
    onSuccess: () => { toast.success("Product deactivated"); qc.invalidateQueries({ queryKey: ["products"] }); router.push("/products"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const addAliasMut = useMutation({
    mutationFn: (v: Record<string, string>) => addProductAlias(id, v.alias_name),
    onSuccess: () => { toast.success("Alias added"); qc.invalidateQueries({ queryKey: ["product", id] }); resetAlias(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteAliasMut = useMutation({
    mutationFn: (aliasId: string) => deleteProductAlias(id, aliasId),
    onSuccess: () => { toast.success("Alias removed"); qc.invalidateQueries({ queryKey: ["product", id] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="space-y-4">{Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>;
  const p = data as Record<string, unknown>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Edit Product</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Product details</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit((v) => updateMut.mutate(v))} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium text-slate-700 block mb-1">Product name *</label><Input {...register("product_name", { required: true })} /></div>
                  <div><label className="text-sm font-medium text-slate-700 block mb-1">SKU</label><Input {...register("sku")} /></div>
                  <div><label className="text-sm font-medium text-slate-700 block mb-1">Category</label><Input {...register("product_category")} /></div>
                  <div><label className="text-sm font-medium text-slate-700 block mb-1">Unit of measure</label><Input {...register("unit_of_measure")} /></div>
                  <div><label className="text-sm font-medium text-slate-700 block mb-1">Preferred brand</label><Input {...register("preferred_brand")} /></div>
                  <div><label className="text-sm font-medium text-slate-700 block mb-1">Hindi name</label><Input {...register("hindi_name")} /></div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="sp" {...register("sample_priority")} className="rounded" />
                  <label htmlFor="sp" className="text-sm font-medium text-slate-700">Sample priority</label>
                </div>
                <div><label className="text-sm font-medium text-slate-700 block mb-1">Notes</label><Textarea {...register("notes")} rows={2} /></div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={updateMut.isPending}>{updateMut.isPending ? "Saving…" : "Save changes"}</Button>
                  <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Aliases</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {((p?.aliases as { id: string; alias_name: string }[]) ?? []).map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span>{fmt(a.alias_name)}</span>
                  <button onClick={() => deleteAliasMut.mutate(a.id)} className="text-slate-300 hover:text-red-500"><X size={14} /></button>
                </div>
              ))}
              <form onSubmit={handleAlias((v) => addAliasMut.mutate(v as Record<string, string>))} className="flex gap-2 pt-1">
                <Input {...regAlias("alias_name", { required: true })} placeholder="New alias" className="text-sm" />
                <Button type="submit" size="sm" variant="outline">Add</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-red-100">
            <CardHeader><CardTitle className="text-base text-red-600">Deactivate</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 mb-3">Hides from new orders. History preserved.</p>
              <AlertDialog>
                <AlertDialogTrigger className="inline-flex items-center justify-center gap-1.5 w-full text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-md px-3 py-1.5 transition-colors">
                  <Trash2 size={14} />Deactivate product
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deactivate product?</AlertDialogTitle>
                    <AlertDialogDescription>History in visits and orders is preserved.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deactivateMut.mutate()} className="bg-red-600 hover:bg-red-700">Deactivate</AlertDialogAction>
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
