"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getParties, getProducts, getVisits, createParty, createProduct, createVisit, addVisitItem, createOrder } from "@/lib/api";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

function Hint({ en, hi }: { en: string; hi: string }) {
  return (
    <p className="text-xs text-slate-400 mt-0.5">
      {en} <span className="text-slate-300">·</span> <span className="text-slate-400">{hi}</span>
    </p>
  );
}

function FormField({ label, hint, children }: { label: string; hint?: { en: string; hi: string }; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 block mb-1">{label}</label>
      {children}
      {hint && <Hint en={hint.en} hi={hint.hi} />}
    </div>
  );
}

function AddPartyForm() {
  const qc = useQueryClient();
  const router = useRouter();
  const { register, handleSubmit, setValue, reset } = useForm();
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
    <form onSubmit={handleSubmit((v) => mut.mutate(v))} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Party type *" hint={{ en: "Hospital, agency, clinic or other buyer type", hi: "खरीदार का प्रकार चुनें" }}>
          <Select onValueChange={(v) => setValue("party_type", v)} defaultValue="hospital">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hospital">Hospital</SelectItem>
              <SelectItem value="agency">Agency</SelectItem>
              <SelectItem value="clinic">Clinic</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Name *" hint={{ en: "Use the real market or hospital name", hi: "असली hospital या market का नाम लिखें" }}><Input {...register("name", { required: true })} /></FormField>
        <FormField label="Phone" hint={{ en: "Primary number for calls or WhatsApp", hi: "call या WhatsApp के लिए मुख्य नंबर" }}><Input {...register("phone")} /></FormField>
        <FormField label="Contact person" hint={{ en: "Doctor, owner, or purchase contact", hi: "doctor, owner या purchase वाले का नाम" }}><Input {...register("contact_person")} /></FormField>
        <FormField label="City *" hint={{ en: "Used for route planning and grouping", hi: "route planning और grouping के लिए" }}><Input {...register("city", { required: true })} /></FormField>
        <FormField label="District" hint={{ en: "Keep consistent for clean reports", hi: "reports के लिए एक जैसा नाम रखें" }}><Input {...register("district")} defaultValue="West Champaran" /></FormField>
        <FormField label="State" hint={{ en: "Usually Bihar for current area", hi: "आमतौर पर Bihar रहेगा" }}><Input {...register("state")} defaultValue="Bihar" /></FormField>
        <FormField label="Distance from base (km)" hint={{ en: "Approx travel distance from Raxaul/Bagaha", hi: "Raxaul या Bagaha से लगभग दूरी" }}><Input type="number" step="0.01" {...register("distance_from_base_km")} /></FormField>
        <FormField label="Base reference" hint={{ en: "e.g. Raxaul to Bagaha", hi: "जैसे: Raxaul to Bagaha" }}><Input {...register("base_reference")} placeholder="Raxaul to Bagaha" /></FormField>
        <FormField label="Address line" hint={{ en: "Street, road, market or landmark", hi: "गली, सड़क, market या landmark" }}><Input {...register("address_line")} /></FormField>
      </div>
      <FormField label="Notes" hint={{ en: "Demand, competition, doctor preference, follow-up context", hi: "demand, competition, doctor preference या follow-up की जानकारी" }}><Textarea {...register("notes")} rows={2} /></FormField>
      <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Saving…" : "Save party"}</Button>
    </form>
  );
}

function AddProductForm() {
  const qc = useQueryClient();
  const { register, handleSubmit, reset } = useForm();
  const mut = useMutation({
    mutationFn: createProduct,
    onSuccess: () => { toast.success("Product saved"); qc.invalidateQueries({ queryKey: ["products"] }); reset(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <form onSubmit={handleSubmit((v) => mut.mutate(v))} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Product name *" hint={{ en: "One clean standard name — reused across visits and orders", hi: "एक standard नाम — visits और orders में reuse होगा" }}><Input {...register("product_name", { required: true })} /></FormField>
        <FormField label="SKU" hint={{ en: "Short internal code e.g. IV-SET, COTTON-400GM", hi: "short code जैसे IV-SET या COTTON-400GM" }}><Input {...register("sku")} /></FormField>
        <FormField label="Category" hint={{ en: "e.g. Gloves, Urology, Infusion, Dressing", hi: "जैसे: Gloves, Urology, Infusion, Dressing" }}><Input {...register("product_category")} /></FormField>
        <FormField label="Unit of measure" hint={{ en: "piece, box, pack, bottle, roll…", hi: "piece, box, pack, bottle, roll…" }}><Input {...register("unit_of_measure")} defaultValue="piece" /></FormField>
        <FormField label="Preferred brand" hint={{ en: "Brand usually supplied e.g. Romson", hi: "आमतौर पर दी जाने वाली brand जैसे Romson" }}><Input {...register("preferred_brand")} /></FormField>
        <FormField label="Hindi name" hint={{ en: "Local name used in field", hi: "field में जो नाम बोला जाता है" }}><Input {...register("hindi_name")} /></FormField>
        <FormField label="Alias (optional)" hint={{ en: "Another name hospitals may use for this product", hi: "hospital जो दूसरा नाम लेते हों" }}><Input {...register("alias_name")} /></FormField>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="sp" {...register("sample_priority")} />
        <label htmlFor="sp" className="text-sm font-medium text-slate-700">Sample priority <span className="text-slate-400 font-normal text-xs">— नमूना देने की प्राथमिकता</span></label>
      </div>
      <FormField label="Notes" hint={{ en: "Any product-specific notes", hi: "product से जुड़ी कोई जरूरी बात" }}><Textarea {...register("notes")} rows={2} /></FormField>
      <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Saving…" : "Save product"}</Button>
    </form>
  );
}

function AddVisitForm() {
  const qc = useQueryClient();
  const router = useRouter();
  const { data: parties } = useQuery({ queryKey: ["parties"], queryFn: () => getParties() });
  const { register, handleSubmit, setValue, reset } = useForm();
  const mut = useMutation({
    mutationFn: createVisit,
    onSuccess: (data) => {
      toast.success("Visit saved");
      qc.invalidateQueries({ queryKey: ["visits"] });
      reset();
      router.push(`/parties/${(data as { party_id: string }).party_id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <form onSubmit={handleSubmit((v) => mut.mutate(v))} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Party *">
          <Select onValueChange={(v) => setValue("party_id", v)}>
            <SelectTrigger><SelectValue placeholder="Select party" /></SelectTrigger>
            <SelectContent>
              {(parties as Record<string, unknown>[] ?? []).map((p) => (
                <SelectItem key={String(p.party_id)} value={String(p.party_id)}>{String(p.party_name)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Visit date *"><Input type="date" {...register("visit_date", { required: true })} /></FormField>
        <FormField label="Purpose">
          <Select onValueChange={(v) => setValue("visit_purpose", v)} defaultValue="regular_visit">
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
        </FormField>
        <FormField label="Status">
          <Select onValueChange={(v) => setValue("visit_status", v)} defaultValue="completed">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="no_contact">No contact</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Location snapshot"><Input {...register("location_snapshot")} /></FormField>
        <FormField label="Distance (km)"><Input type="number" step="0.01" {...register("distance_snapshot_km")} /></FormField>
        <FormField label="Contact snapshot"><Input {...register("contact_snapshot")} /></FormField>
      </div>
      <FormField label="Notes"><Textarea {...register("notes")} rows={2} /></FormField>
      <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Saving…" : "Save visit"}</Button>
    </form>
  );
}

function AddOrderForm() {
  const qc = useQueryClient();
  const router = useRouter();
  const { data: parties } = useQuery({ queryKey: ["parties"], queryFn: () => getParties() });
  const { data: products } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const { register, handleSubmit, setValue, reset } = useForm();
  const mut = useMutation({
    mutationFn: createOrder,
    onSuccess: (data) => {
      toast.success("Order saved");
      qc.invalidateQueries({ queryKey: ["orders"] });
      reset();
      router.push(`/parties/${(data as { party_id: string }).party_id}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <form onSubmit={handleSubmit((v) => mut.mutate(v))} className="space-y-4">
      <p className="text-xs text-slate-500 bg-amber-50 border border-amber-100 rounded-lg p-3">Use this for actual confirmed business only. Saving an order also updates party-wise product pricing.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Party *">
          <Select onValueChange={(v) => setValue("party_id", v)}>
            <SelectTrigger><SelectValue placeholder="Select party" /></SelectTrigger>
            <SelectContent>
              {(parties as Record<string, unknown>[] ?? []).map((p) => (
                <SelectItem key={String(p.party_id)} value={String(p.party_id)}>{String(p.party_name)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Product *">
          <Select onValueChange={(v) => setValue("product_id", v)}>
            <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
            <SelectContent>
              {(products as Record<string, unknown>[] ?? []).map((p) => (
                <SelectItem key={String(p.product_id)} value={String(p.product_id)}>{String(p.product_name)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Order date *"><Input type="date" {...register("order_date", { required: true })} /></FormField>
        <FormField label="Status">
          <Select onValueChange={(v) => setValue("order_status", v)} defaultValue="confirmed">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Quantity *"><Input type="number" step="0.01" {...register("quantity", { required: true })} /></FormField>
        <FormField label="Unit"><Input {...register("unit_of_measure")} defaultValue="piece" /></FormField>
        <FormField label="Buy rate"><Input type="number" step="0.01" {...register("buy_rate")} /></FormField>
        <FormField label="Sell rate"><Input type="number" step="0.01" {...register("sell_rate")} /></FormField>
        <FormField label="Reference number"><Input {...register("reference_number")} /></FormField>
      </div>
      <FormField label="Notes"><Textarea {...register("notes")} rows={2} /></FormField>
      <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Saving…" : "Save order"}</Button>
    </form>
  );
}

export default function AdminPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Add Data</h1>
        <p className="text-slate-500 text-sm mt-1">Add parties, products, visits, and orders · डेटा जोड़ें</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { step: "1", title: "Add Party", sub: "पार्टी जोड़ें", desc: "Register a hospital, agency or clinic as a buyer.", tab: "party", color: "bg-blue-50 border-blue-100" },
          { step: "2", title: "Add Product", sub: "उत्पाद जोड़ें", desc: "Add each surgical or medical item once to the master list.", tab: "product", color: "bg-teal-50 border-teal-100" },
          { step: "3", title: "Log Visit", sub: "विज़िट दर्ज करें", desc: "Record a field visit — what you saw, what was needed.", tab: "visit", color: "bg-purple-50 border-purple-100" },
          { step: "4", title: "Add Order", sub: "ऑर्डर जोड़ें", desc: "Capture a confirmed order with quantity and rates.", tab: "order", color: "bg-amber-50 border-amber-100" },
        ].map((item) => (
          <div key={item.step} className={`rounded-xl border p-4 ${item.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">{item.step}</span>
              <span className="font-semibold text-sm text-slate-700">{item.title}</span>
              <span className="text-xs text-slate-400">{item.sub}</span>
            </div>
            <p className="text-xs text-slate-500">{item.desc}</p>
          </div>
        ))}
      </div>
      <Tabs defaultValue="party">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="party">Party</TabsTrigger>
          <TabsTrigger value="product">Product</TabsTrigger>
          <TabsTrigger value="visit">Visit</TabsTrigger>
          <TabsTrigger value="order">Order</TabsTrigger>
        </TabsList>
        <TabsContent value="party" className="mt-4">
          <Card><CardHeader><CardTitle className="text-base">Add Party</CardTitle></CardHeader><CardContent><AddPartyForm /></CardContent></Card>
        </TabsContent>
        <TabsContent value="product" className="mt-4">
          <Card><CardHeader><CardTitle className="text-base">Add Product</CardTitle></CardHeader><CardContent><AddProductForm /></CardContent></Card>
        </TabsContent>
        <TabsContent value="visit" className="mt-4">
          <Card><CardHeader><CardTitle className="text-base">Log Visit</CardTitle></CardHeader><CardContent><AddVisitForm /></CardContent></Card>
        </TabsContent>
        <TabsContent value="order" className="mt-4">
          <Card><CardHeader><CardTitle className="text-base">Add Order</CardTitle></CardHeader><CardContent><AddOrderForm /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
