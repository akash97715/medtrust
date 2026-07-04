"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getParties, getStock, createOrder } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronDown, ChevronUp, Info } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type Product = {
  product_id: string;
  product_name: string;
  unit_of_measure: string;
  stock_quantity: number;
  last_updated_at: string | null;
};
type LineItem = {
  id: number;
  product_id: string;
  quantity: string;
  unit_of_measure: string;
  buy_rate: string;
  profit_pct: string;
  sell_rate: string;
  hsn_code: string;
  discount: string;
  expanded: boolean;
};

let itemCounter = 0;
function makeItem(): LineItem {
  return {
    id: ++itemCounter,
    product_id: "",
    quantity: "",
    unit_of_measure: "piece",
    buy_rate: "",
    profit_pct: "",
    sell_rate: "",
    hsn_code: "",
    discount: "0",
    expanded: true,
  };
}

function money(v: number) {
  return `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Tooltip ──────────────────────────────────────────────────────────────────
function Tip({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-center ml-1 cursor-help">
      <Info size={12} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
      <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 z-50 w-52 bg-slate-800 text-white text-[11px] rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-xl leading-relaxed">
        {text}
      </span>
    </span>
  );
}

// ── Line item row ────────────────────────────────────────────────────────────
function ItemRow({
  item, index, products, onChange, onRemove, canRemove,
}: {
  item: LineItem;
  index: number;
  products: Product[];
  onChange: (id: number, patch: Partial<LineItem>) => void;
  onRemove: (id: number) => void;
  canRemove: boolean;
}) {
  const product = products.find((p) => p.product_id === item.product_id);
  const qty = parseFloat(item.quantity) || 0;
  const everSet = product ? product.last_updated_at !== null : false;
  const availableStock = product ? product.stock_quantity : 0;
  const notTracked = product !== undefined && !everSet;
  const overStock = everSet && qty > availableStock && qty > 0;
  const sell = parseFloat(item.sell_rate) || 0;
  const disc = parseFloat(item.discount) || 0;
  const lineTotal = qty * sell - disc;
  const buy = parseFloat(item.buy_rate) || 0;
  const pct = parseFloat(item.profit_pct) || 0;
  const suggestedSell = buy > 0 && pct > 0 ? buy * (1 + pct / 100) : null;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Row header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-slate-50 cursor-pointer select-none"
        onClick={() => onChange(item.id, { expanded: !item.expanded })}
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-600 text-white text-[11px] font-bold shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-700 truncate">
            {product?.product_name ?? <span className="text-slate-400 font-normal italic">Select a product…</span>}
          </p>
          {!item.expanded && qty > 0 && (
            <p className="text-xs text-slate-400">
              {qty} × {money(sell)} {disc > 0 ? `− disc ${money(disc)}` : ""} = <span className="text-teal-700 font-semibold">{money(lineTotal)}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!item.expanded && lineTotal > 0 && (
            <span className="text-xs font-bold text-teal-700">{money(lineTotal)}</span>
          )}
          {canRemove && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
              className="text-slate-300 hover:text-red-500 transition-colors p-1"
            >
              <Trash2 size={14} />
            </button>
          )}
          {item.expanded ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
        </div>
      </div>

      {/* Expanded fields */}
      {item.expanded && (
        <div className="px-4 py-4 space-y-3">
          {/* Product select */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Product *</label>
            <Select
              value={item.product_id}
              onValueChange={(v) => {
                if (!v) return;
                const prod = products.find((p) => p.product_id === v);
                onChange(item.id, { product_id: v, unit_of_measure: prod?.unit_of_measure || item.unit_of_measure });
              }}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select product…" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.product_id} value={p.product_id}>
                    {p.product_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {product && (
              <p className={`text-xs mt-1 font-medium ${
                notTracked ? "text-amber-600" :
                availableStock === 0 ? "text-red-500" :
                availableStock <= 5 ? "text-amber-600" : "text-emerald-600"
              }`}>
                {notTracked
                  ? "⚠ Stock not set — go to Products & Stock page first"
                  : `● ${availableStock} ${product.unit_of_measure} in stock`}
              </p>
            )}
          </div>

          {/* Qty + Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Quantity *</label>
              <Input
                type="number" step="0.01" min="0.01"
                value={item.quantity}
                onChange={(e) => onChange(item.id, { quantity: e.target.value })}
                placeholder="100"
                disabled={notTracked}
                className={`h-9 text-sm ${overStock ? "border-red-400 focus-visible:ring-red-400" : notTracked ? "opacity-50 cursor-not-allowed" : ""}`}
              />
              {overStock && (
                <p className="text-xs text-red-600 font-semibold mt-1">
                  ⚠ Only {availableStock} {product?.unit_of_measure} in stock
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Unit</label>
              <Input
                value={item.unit_of_measure}
                onChange={(e) => onChange(item.id, { unit_of_measure: e.target.value })}
                placeholder="piece"
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Buy rate */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">
              Buy Rate
              <Tip text="Your cost price — what you paid the supplier." />
            </label>
            <Input
              type="number" step="0.01"
              value={item.buy_rate}
              onChange={(e) => onChange(item.id, { buy_rate: e.target.value, profit_pct: "" })}
              placeholder="₹0.00"
              className="h-9 text-sm"
            />
          </div>

          {/* Profit margin calculator */}
          {buy > 0 && (
            <div className="flex flex-wrap items-center gap-2 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2.5">
              <span className="text-[11px] font-semibold text-teal-700 uppercase tracking-wide shrink-0">Margin %</span>
              <div className="relative shrink-0">
                <Input
                  type="number" min="1" max="1000" step="any"
                  value={item.profit_pct}
                  onChange={(e) => onChange(item.id, { profit_pct: e.target.value })}
                  placeholder="e.g. 20"
                  className="h-8 w-20 text-sm text-center border-teal-200 focus-visible:ring-teal-400 bg-white"
                />
              </div>
              {suggestedSell !== null && (
                <>
                  <span className="text-slate-300 text-base leading-none">→</span>
                  <span className="text-sm font-bold text-teal-700 shrink-0">{money(suggestedSell)}</span>
                  <button
                    type="button"
                    onClick={() => onChange(item.id, { sell_rate: suggestedSell.toFixed(2) })}
                    className="ml-auto sm:ml-0 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap touch-manipulation"
                  >
                    Use ₹{suggestedSell.toFixed(2)} →
                  </button>
                </>
              )}
              {!item.profit_pct && (
                <span className="text-[11px] text-teal-500/70 ml-1">Enter % to calculate sell price</span>
              )}
            </div>
          )}

          {/* Sell rate */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">
              Sell Rate *
              <Tip text="Price charged to the party — appears on invoice." />
            </label>
            <Input
              type="number" step="0.01"
              value={item.sell_rate}
              onChange={(e) => onChange(item.id, { sell_rate: e.target.value })}
              placeholder="₹0.00"
              className="h-9 text-sm"
            />
          </div>

          {/* HSN + Discount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                HSN Code
                <Tip text="Harmonised System code for GST. E.g. 9018 for surgical instruments." />
              </label>
              <Input
                value={item.hsn_code}
                onChange={(e) => onChange(item.id, { hsn_code: e.target.value })}
                placeholder="e.g. 9018"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                Discount (₹)
                <Tip text="Flat discount in rupees deducted from taxable value." />
              </label>
              <Input
                type="number" step="0.01" min="0"
                value={item.discount}
                onChange={(e) => onChange(item.id, { discount: e.target.value })}
                placeholder="0"
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Line total */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              {qty > 0 && sell > 0 ? `${qty} × ${money(sell)}${disc > 0 ? ` − ${money(disc)}` : ""}` : "Fill qty & sell rate"}
            </span>
            <span className="text-sm font-bold text-teal-700">{lineTotal > 0 ? money(lineTotal) : "—"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AddOrderPage() {
  const qc = useQueryClient();
  const router = useRouter();

  const { data: parties, isLoading: lp } = useQuery({ queryKey: ["parties"], queryFn: () => getParties() });
  const { data: productsData, isLoading: lprod } = useQuery({ queryKey: ["stock"], queryFn: getStock, staleTime: 0 });
  const products = (productsData as Product[] ?? []);

  // Order header
  const [partyId, setPartyId] = useState("");
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [orderStatus, setOrderStatus] = useState("confirmed");
  const [billFrom, setBillFrom] = useState("");
  const [billTo, setBillTo] = useState("");
  const [cgstRate, setCgstRate] = useState("6");
  const [sgstRate, setSgstRate] = useState("6");
  const [refNum, setRefNum] = useState("");
  const [notes, setNotes] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Line items
  const [items, setItems] = useState<LineItem[]>([makeItem()]);

  const updateItem = (id: number, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, ...patch } : it));
  };
  const removeItem = (id: number) => setItems((prev) => prev.filter((it) => it.id !== id));
  const addItem = () => setItems((prev) => [...prev, makeItem()]);

  // Totals
  const subtotal = items.reduce((s, it) => {
    const qty = parseFloat(it.quantity) || 0;
    const sell = parseFloat(it.sell_rate) || 0;
    const disc = parseFloat(it.discount) || 0;
    return s + (qty * sell - disc);
  }, 0);
  const cgst = subtotal * ((parseFloat(cgstRate) || 0) / 100);
  const sgst = subtotal * ((parseFloat(sgstRate) || 0) / 100);
  const grandTotal = subtotal + cgst + sgst;

  const mut = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      const d = data as { id: string; party_id: string };
      const count = items.length;
      toast.success(`Order saved — ${count} product${count !== 1 ? "s" : ""}`, {
        duration: 7000,
        action: { label: "View order →", onClick: () => router.push(`/orders/${d.id}/edit`) },
      });
      qc.invalidateQueries({ queryKey: ["orders"] });
      setPartyId("");
      setOrderDate(new Date().toISOString().slice(0, 10));
      setOrderStatus("confirmed");
      setBillFrom("");
      setBillTo("");
      setCgstRate("6");
      setSgstRate("6");
      setRefNum("");
      setNotes("");
      setShowAdvanced(false);
      setItems([makeItem()]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyId) { toast.error("Please select a party"); return; }
    if (!orderDate) { toast.error("Order date is required"); return; }

    const validItems = items.filter((it) => it.product_id && parseFloat(it.quantity) > 0);
    if (validItems.length === 0) {
      toast.error("Add at least one product with quantity");
      return;
    }

    const missingRate = validItems.find((it) => !it.sell_rate || parseFloat(it.sell_rate) <= 0);
    if (missingRate) {
      const prod = products.find((p) => p.product_id === missingRate.product_id);
      toast.error(`Sell rate is required for ${prod?.product_name ?? "all products"}`);
      return;
    }

    const untrackedItem = validItems.find((it) => {
      const prod = products.find((p) => p.product_id === it.product_id);
      return !prod?.last_updated_at;
    });
    if (untrackedItem) {
      const prod = products.find((p) => p.product_id === untrackedItem.product_id);
      toast.error(`Stock not set for "${prod?.product_name}". Please set stock on the Products & Stock page before ordering.`);
      return;
    }

    const stockError = validItems.find((it) => {
      const prod = products.find((p) => p.product_id === it.product_id);
      if (!prod || !prod.last_updated_at) return false;
      return parseFloat(it.quantity) > prod.stock_quantity;
    });
    if (stockError) {
      const prod = products.find((p) => p.product_id === stockError.product_id);
      toast.error(`Not enough stock for ${prod?.product_name}: only ${prod?.stock_quantity} ${prod?.unit_of_measure} available`);
      return;
    }

    mut.mutate({
      party_id: partyId,
      order_date: orderDate,
      order_status: orderStatus,
      reference_number: refNum || undefined,
      notes: notes || undefined,
      bill_period_from: billFrom || undefined,
      bill_period_to: billTo || undefined,
      cgst_rate: parseFloat(cgstRate) || 6,
      sgst_rate: parseFloat(sgstRate) || 6,
      items: validItems.map((it) => ({
        product_id: it.product_id,
        quantity: parseFloat(it.quantity),
        unit_of_measure: it.unit_of_measure || "piece",
        buy_rate: parseFloat(it.buy_rate) || undefined,
        sell_rate: parseFloat(it.sell_rate),
        hsn_code: it.hsn_code || undefined,
        discount: parseFloat(it.discount) || 0,
      })),
    });
  };

  return (
    <div className="max-w-2xl mx-auto md:mx-0 pb-10">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Add Order</h1>
        <p className="text-slate-500 text-sm mt-0.5">Create an order with one or more products</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Party & Date ── */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Order Details</p>

          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Party *</label>
            {lp ? <Skeleton className="h-10" /> : (
              <Select value={partyId} onValueChange={(v) => v && setPartyId(v)}>
                <SelectTrigger><SelectValue placeholder="Select hospital / clinic / agency…" /></SelectTrigger>
                <SelectContent>
                  {(parties as Record<string, unknown>[] ?? []).map((p) => (
                    <SelectItem key={String(p.party_id)} value={String(p.party_id)}>
                      {String(p.party_name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Order Date *</label>
              <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Status</label>
              <Select value={orderStatus} onValueChange={(v) => v && setOrderStatus(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs text-slate-400 hover:text-teal-600 flex items-center gap-1 transition-colors"
          >
            {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showAdvanced ? "Hide" : "Show"} invoice / GST settings
          </button>

          {showAdvanced && (
            <div className="space-y-3 pt-1 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Bill Period From</label>
                  <Input type="date" value={billFrom} onChange={(e) => setBillFrom(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Bill Period To</label>
                  <Input type="date" value={billTo} onChange={(e) => setBillTo(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">CGST %</label>
                  <Input type="number" step="0.5" min="0" max="28" value={cgstRate} onChange={(e) => setCgstRate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">SGST %</label>
                  <Input type="number" step="0.5" min="0" max="28" value={sgstRate} onChange={(e) => setSgstRate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Reference Number</label>
                <Input value={refNum} onChange={(e) => setRefNum(e.target.value)} placeholder="PO / Challan number (optional)" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Notes</label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any delivery or special instructions" />
              </div>
            </div>
          )}
        </div>

        {/* ── Line Items ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Products <span className="text-teal-600 normal-case tracking-normal">({items.length})</span>
            </p>
            <span className="text-xs text-slate-400">Each product is a separate line on the invoice</span>
          </div>

          {lprod ? (
            <div className="space-y-2">{Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
          ) : (
            <>
              {items.map((item, index) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  products={products}
                  onChange={updateItem}
                  onRemove={removeItem}
                  canRemove={items.length > 1}
                />
              ))}

              <button
                type="button"
                onClick={addItem}
                className="w-full flex items-center justify-center gap-2 h-11 border-2 border-dashed border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 text-slate-400 hover:text-teal-600 rounded-xl text-sm font-semibold transition-all"
              >
                <Plus size={15} /> Add Another Product
              </button>
            </>
          )}
        </div>

        {/* ── Order Total ── */}
        {subtotal > 0 && (
          <div className="bg-slate-800 rounded-xl px-5 py-4 space-y-2">
            <div className="flex justify-between text-sm text-slate-300">
              <span>Taxable Value</span>
              <span className="font-semibold">{money(subtotal)}</span>
            </div>
            {cgst > 0 && (
              <div className="flex justify-between text-sm text-slate-400">
                <span>CGST ({cgstRate}%)</span>
                <span>{money(cgst)}</span>
              </div>
            )}
            {sgst > 0 && (
              <div className="flex justify-between text-sm text-slate-400">
                <span>SGST ({sgstRate}%)</span>
                <span>{money(sgst)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-white border-t border-slate-600 pt-2 mt-2">
              <span>Grand Total</span>
              <span>{money(grandTotal)}</span>
            </div>
          </div>
        )}

        {/* ── Submit ── */}
        <Button type="submit" className="w-full h-12 text-base" disabled={mut.isPending}>
          {mut.isPending ? "Saving…" : `Save Order${items.length > 1 ? ` (${items.length} products)` : ""}`}
        </Button>
      </form>
    </div>
  );
}
