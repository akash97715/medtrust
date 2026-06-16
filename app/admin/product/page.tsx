"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct } from "@/lib/api";
import { useRouter } from "next/navigation";
import { cleanPayload } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700 block">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function ProductForm({ onSaved }: { onSaved: () => void }) {
  const qc = useQueryClient();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    defaultValues: { unit_of_measure: "piece", sample_priority: false },
  });

  const mut = useMutation({
    mutationFn: createProduct,
    onSuccess: (data) => {
      const d = data as { id: string; reactivated?: boolean };
      toast.success(d.reactivated ? "Product restored and updated" : "Product saved", {
        duration: 7000,
        action: { label: "View in catalog →", onClick: () => router.push(`/products/${d.id}`) },
      });
      qc.invalidateQueries({ queryKey: ["products"] });
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form onSubmit={handleSubmit((v) => mut.mutate(cleanPayload(v as Record<string, unknown>)))} className="space-y-4">
        <Field label="Product name *" hint="एक standard नाम — visits और orders में reuse होगा">
          <Input {...register("product_name", { required: true })} placeholder="e.g. IV Cannula 20G" />
          {errors.product_name && <p className="text-xs text-red-500 mt-0.5">Product name is required</p>}
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="SKU" hint="Short code e.g. IV-SET">
            <Input {...register("sku")} placeholder="IV-20G" />
          </Field>
          <Field label="Category" hint="e.g. Infusion, Gloves">
            <Input {...register("product_category")} placeholder="Infusion" />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Unit of measure" hint="piece, box, pack…">
            <Input {...register("unit_of_measure")} defaultValue="piece" />
          </Field>
          <Field label="Preferred brand" hint="e.g. Romson">
            <Input {...register("preferred_brand")} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Hindi name" hint="Field में जो नाम बोला जाता है">
            <Input {...register("hindi_name")} />
          </Field>
          <Field label="Alias" hint="Hospital का दूसरा नाम">
            <Input {...register("alias_name")} />
          </Field>
        </div>

        <div className="flex items-center gap-3 py-1">
          <input type="checkbox" id="sp" {...register("sample_priority")} className="w-4 h-4 rounded accent-teal-600" />
          <label htmlFor="sp" className="text-sm font-medium text-slate-700">
            Sample priority <span className="text-slate-400 font-normal">— नमूना प्राथमिकता</span>
          </label>
        </div>

        <Field label="Notes" hint="Product से जुड़ी कोई जरूरी बात">
          <Textarea {...register("notes")} rows={3} />
        </Field>

        <div className="pt-2 pb-6">
          <Button type="submit" className="w-full h-11 text-base" disabled={mut.isPending}>
            {mut.isPending ? "Saving…" : "Save Product"}
          </Button>
        </div>
      </form>
  );
}

export default function AddProductPage() {
  const [formKey, setFormKey] = useState(0);
  return (
    <div className="max-w-lg mx-auto md:mx-0">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Add Product</h1>
        <p className="text-slate-500 text-sm mt-0.5">उत्पाद जोड़ें · Surgical or medical item</p>
      </div>
      <ProductForm key={formKey} onSaved={() => setFormKey((k) => k + 1)} />
    </div>
  );
}
