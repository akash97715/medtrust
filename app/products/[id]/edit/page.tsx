"use client";
import { use, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProduct, updateProduct, deleteProduct, addProductAlias, deleteProductAlias } from "@/lib/api";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Trash2, X, Plus } from "lucide-react";
import { fmt } from "@/lib/utils";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

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
        product_name: p.product_name,
        product_category: p.product_category ?? "",
        unit_of_measure: p.unit_of_measure ?? "piece",
        notes: p.notes ?? "",
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

  if (isLoading) {
    return (
      <div className="max-w-xl space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const p = data as Record<string, unknown>;
  const aliases = (p?.aliases as { id: string; alias_name: string }[]) ?? [];

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
          <h1 className="text-xl font-semibold text-slate-800">{fmt(p.product_name)}</h1>
          <p className="text-xs text-slate-400 mt-0.5">Edit product details</p>
        </div>
      </div>

      {/* Main form */}
      <form onSubmit={handleSubmit((v) => updateMut.mutate(v))} className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        <div className="p-5 space-y-4">
          <Field label="Product name *">
            <Input {...register("product_name", { required: true })} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <Input {...register("product_category")} placeholder="—" />
            </Field>
            <Field label="Unit of measure">
              <Input {...register("unit_of_measure")} placeholder="piece" />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea {...register("notes")} rows={3} placeholder="Any additional notes…" />
          </Field>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" id="sp" {...register("sample_priority")} className="w-4 h-4 rounded accent-teal-600" />
            <span className="text-sm font-medium text-slate-700">Sample priority</span>
          </label>
        </div>

        <div className="p-5 flex gap-3">
          <Button type="submit" disabled={updateMut.isPending} className="bg-teal-600 hover:bg-teal-700">
            {updateMut.isPending ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>

      {/* Aliases */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 pt-5 pb-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Aliases</p>
          {aliases.length === 0 && (
            <p className="text-sm text-slate-400 mb-3">No aliases yet.</p>
          )}
          <div className="space-y-2">
            {aliases.map((a) => (
              <div key={a.id} className="flex items-center justify-between group py-1">
                <span className="text-sm text-slate-700">{fmt(a.alias_name)}</span>
                <button
                  onClick={() => deleteAliasMut.mutate(a.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="px-5 pb-5">
          <form onSubmit={handleAlias((v) => addAliasMut.mutate(v as Record<string, string>))} className="flex gap-2">
            <Input {...regAlias("alias_name", { required: true })} placeholder="Add alias…" className="text-sm" />
            <Button type="submit" size="sm" variant="outline" className="shrink-0">
              <Plus size={14} className="mr-1" />Add
            </Button>
          </form>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-100">
        <div className="p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-red-600">Deactivate product</p>
            <p className="text-xs text-slate-400 mt-0.5">Hides from new orders. History preserved.</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger className="flex items-center gap-1.5 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg px-3 py-1.5 transition-colors shrink-0">
              <Trash2 size={13} />Deactivate
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate product?</AlertDialogTitle>
                <AlertDialogDescription>History in visits and orders is preserved.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deactivateMut.mutate()} className="bg-red-600 hover:bg-red-700">
                  Deactivate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
