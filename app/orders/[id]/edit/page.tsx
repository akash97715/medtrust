"use client";
import { use, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrder, getStock, updateOrder, deleteOrder, updateOrderItem, deleteOrderItem, addOrderItem } from "@/lib/api";
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
import { Trash2, Pencil, Plus, AlertTriangle } from "lucide-react";
import { money, fmt, cleanPayload } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

function EditItemRow({ item, onSaved, onDeleted, canDelete }: { item: Record<string, unknown>; onSaved: () => void; onDeleted: () => void; canDelete: boolean }) {
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
            <Button size="sm" className="h-7 text-xs" onClick={handleSubmit((v) => updateMut.mutate(cleanPayload(v as Record<string, unknown>)))} disabled={updateMut.isPending}>Save</Button>
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
          {canDelete && (
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
          )}
        </div>
      </td>
    </tr>
  );
}

type Product = { product_id: string; product_name: string; stock_quantity: number; last_updated_at: string | null; unit_of_measure: string };

function AddItemInline({ orderId, onAdded }: { orderId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("piece");
  const [buyRate, setBuyRate] = useState("");
  const [sellRate, setSellRate] = useState("");
  const [hsn, setHsn] = useState("");
  const [discount, setDiscount] = useState("0");

  const { data: productsData } = useQuery({ queryKey: ["stock"], queryFn: getStock, staleTime: 0 });
  const products = (productsData as Product[] ?? []);

  const selectedProduct = products.find((p) => p.product_id === productId);
  const everSet = selectedProduct ? selectedProduct.last_updated_at !== null : false;
  const notTracked = selectedProduct !== undefined && !everSet;
  const qtyNum = parseFloat(qty) || 0;
  const overStock = everSet && qtyNum > 0 && qtyNum > (selectedProduct?.stock_quantity ?? 0);

  const mut = useMutation({
    mutationFn: (data: unknown) => addOrderItem(orderId, data),
    onSuccess: () => {
      toast.success("Product added to order");
      setOpen(false);
      setProductId(""); setQty(""); setSellRate(""); setBuyRate(""); setHsn(""); setDiscount("0");
      onAdded();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleAdd = () => {
    if (!productId) { toast.error("Select a product"); return; }
    if (!qty || parseFloat(qty) <= 0) { toast.error("Enter a valid quantity"); return; }
    if (!sellRate || parseFloat(sellRate) <= 0) { toast.error("Sell rate is required"); return; }
    if (notTracked) {
      toast.error(`Stock not set for "${selectedProduct?.product_name}". Please set stock on the Products & Stock page before ordering.`);
      return;
    }
    if (overStock) {
      toast.error(`Not enough stock for ${selectedProduct?.product_name}: only ${selectedProduct?.stock_quantity} ${selectedProduct?.unit_of_measure} available`);
      return;
    }
    mut.mutate({
      product_id: productId,
      quantity: parseFloat(qty),
      unit_of_measure: unit || "piece",
      buy_rate: parseFloat(buyRate) || undefined,
      sell_rate: parseFloat(sellRate),
      hsn_code: hsn || undefined,
      discount: parseFloat(discount) || 0,
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 h-9 border-2 border-dashed border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 text-slate-400 hover:text-teal-600 rounded-lg text-xs font-semibold transition-all"
      >
        <Plus size={13} /> Add Product to Order
      </button>
    );
  }

  return (
    <div className="border border-teal-200 rounded-xl bg-teal-50/30 p-4 space-y-3">
      <p className="text-xs font-bold text-teal-700 uppercase tracking-widest">Add Product</p>
      <div>
        <Select
          value={productId}
          onValueChange={(v) => {
            if (!v) return;
            const prod = products.find((p) => p.product_id === v);
            setProductId(v);
            if (prod?.unit_of_measure) setUnit(prod.unit_of_measure);
          }}
        >
          <SelectTrigger className="h-9 text-sm w-full">
            {productId
              ? <span>{products.find(p => p.product_id === productId)?.product_name ?? productId}</span>
              : <span className="text-muted-foreground">Select product…</span>
            }
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => <SelectItem key={p.product_id} value={p.product_id}>{p.product_name}</SelectItem>)}
          </SelectContent>
        </Select>
        {selectedProduct && (
          <p className={`text-xs mt-1 font-medium ${
            notTracked ? "text-amber-600" :
            selectedProduct.stock_quantity === 0 ? "text-red-500" :
            selectedProduct.stock_quantity <= 5 ? "text-amber-600" : "text-emerald-600"
          }`}>
            {notTracked
              ? "⚠ Stock not set — go to Products & Stock page first"
              : `● ${selectedProduct.stock_quantity} ${selectedProduct.unit_of_measure} in stock`}
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <Input
            type="number" step="0.01" value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="Qty *"
            disabled={notTracked}
            className={`h-9 text-sm ${overStock ? "border-red-400 focus-visible:ring-red-400" : notTracked ? "opacity-50 cursor-not-allowed" : ""}`}
          />
          {overStock && (
            <p className="text-xs text-red-600 font-semibold mt-0.5">
              ⚠ Only {selectedProduct?.stock_quantity} {selectedProduct?.unit_of_measure} in stock
            </p>
          )}
        </div>
        <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit" className="h-9 text-sm" />
        <Input type="number" step="0.01" value={buyRate} onChange={(e) => setBuyRate(e.target.value)} placeholder="Buy Rate" className="h-9 text-sm" />
        <Input type="number" step="0.01" value={sellRate} onChange={(e) => setSellRate(e.target.value)} placeholder="Sell Rate *" className="h-9 text-sm" />
        <Input value={hsn} onChange={(e) => setHsn(e.target.value)} placeholder="HSN Code" className="h-9 text-sm" />
        <Input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="Discount ₹" className="h-9 text-sm" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleAdd} disabled={mut.isPending || overStock || notTracked} className="h-8 text-xs">
          {mut.isPending ? "Saving…" : "Add to Order"}
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

export default function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["order", id], queryFn: () => getOrder(id) });
  const { register, handleSubmit, setValue, reset, watch } = useForm();
  const [statusWarning, setStatusWarning] = useState<{ type: "no_payments" | "partial"; detail: string } | null>(null);

  useEffect(() => {
    if (data) {
      const o = data as Record<string, unknown>;
      reset({ order_date: o.order_date, order_status: o.order_status, reference_number: o.reference_number ?? "", notes: o.notes ?? "" });
    }
  }, [data, reset]);

  const updateMut = useMutation({
    mutationFn: (v: unknown) => updateOrder(id, v),
    onSuccess: () => {
      toast.success("Order updated");
      setStatusWarning(null);
      qc.removeQueries({ queryKey: ["order", id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (e: Error) => {
      const msg = e.message;
      if (msg.startsWith("NO_PAYMENTS:")) {
        setStatusWarning({ type: "no_payments", detail: msg.replace("NO_PAYMENTS: ", "") });
      } else if (msg.startsWith("PARTIAL_PAYMENT:")) {
        setStatusWarning({ type: "partial", detail: msg.replace("PARTIAL_PAYMENT: ", "") });
      } else {
        toast.error(msg);
      }
    },
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
                    <Select onValueChange={(v) => setValue("order_status", v)} value={watch("order_status") ?? String(o?.order_status ?? "confirmed")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="partial_payment">Partial Payment</SelectItem>
                        <SelectItem value="payment_received">Payment Received</SelectItem>
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
                {statusWarning && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex gap-2">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-800 font-medium">{statusWarning.detail}</p>
                      <Link
                        href={`/orders/${id}`}
                        className="text-xs text-teal-700 underline underline-offset-2 hover:text-teal-900 mt-1 inline-block"
                      >
                        ← Go to Payment Tracker to record payments
                      </Link>
                    </div>
                  </div>
                )}
                <Button type="submit" disabled={updateMut.isPending} onClick={() => setStatusWarning(null)}>
                  {updateMut.isPending ? "Saving…" : "Save changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Line items</CardTitle></CardHeader>
            <CardContent className="space-y-4">
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
                        <EditItemRow key={i} item={item} onSaved={refresh} onDeleted={refresh} canDelete={isAdmin} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <AddItemInline orderId={id} onAdded={refresh} />
            </CardContent>
          </Card>
        </div>

        {isAdmin && (
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
        )}
      </div>
    </div>
  );
}
