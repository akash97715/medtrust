const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail: string = res.statusText || "Request failed";
    try {
      const json = JSON.parse(text);
      if (typeof json?.detail === "string") {
        detail = json.detail;
      } else if (Array.isArray(json?.detail)) {
        // Pydantic v2 validation errors — pick the first message
        detail = json.detail.map((e: { msg?: string; loc?: string[] }) =>
          `${e.loc?.slice(1).join(".") ?? "field"}: ${e.msg ?? "invalid"}`
        ).join("; ");
      } else if (text) {
        detail = text;
      }
    } catch { /* non-JSON body — use statusText */ }
    throw new Error(detail);
  }
  return res.json();
}

// Dashboard
export const getDashboardSummary = () => req("/api/dashboard/summary");
export const getTopProducts = () => req("/api/dashboard/top-products");
export const getProductLeaders = () => req("/api/dashboard/product-leaders");
export const getDailyActivity = () => req("/api/dashboard/daily-activity");
export const getLocations = () => req("/api/dashboard/locations");

// Parties
export const getParties = (type?: string) =>
  req(`/api/parties${type && type !== "all" ? `?type=${type}` : ""}`);
export const getParty = (id: string) => req(`/api/parties/${id}`);
export const createParty = (data: unknown) =>
  req("/api/parties", { method: "POST", body: JSON.stringify(data) });
export const updateParty = (id: string, data: unknown) =>
  req(`/api/parties/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteParty = (id: string) =>
  req(`/api/parties/${id}`, { method: "DELETE" });

// Products
export const getProducts = () => req("/api/products");
export const getProduct = (id: string) => req(`/api/products/${id}`);
export const createProduct = (data: unknown) =>
  req("/api/products", { method: "POST", body: JSON.stringify(data) });
export const updateProduct = (id: string, data: unknown) =>
  req(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteProduct = (id: string) =>
  req(`/api/products/${id}`, { method: "DELETE" });
export const addProductAlias = (id: string, alias_name: string) =>
  req(`/api/products/${id}/aliases`, { method: "POST", body: JSON.stringify({ alias_name }) });
export const deleteProductAlias = (productId: string, aliasId: string) =>
  req(`/api/products/${productId}/aliases/${aliasId}`, { method: "DELETE" });

// Visits
export const getVisits = () => req("/api/visits");
export const getVisit = (id: string) => req(`/api/visits/${id}`);
export const createVisit = (data: unknown) =>
  req("/api/visits", { method: "POST", body: JSON.stringify(data) });
export const updateVisit = (id: string, data: unknown) =>
  req(`/api/visits/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteVisit = (id: string) =>
  req(`/api/visits/${id}`, { method: "DELETE" });
export const addVisitItem = (visitId: string, data: unknown) =>
  req(`/api/visits/${visitId}/items`, { method: "POST", body: JSON.stringify(data) });
export const updateVisitItem = (itemId: string, data: unknown) =>
  req(`/api/visits/items/${itemId}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteVisitItem = (itemId: string) =>
  req(`/api/visits/items/${itemId}`, { method: "DELETE" });

// Orders
export const getOrders = () => req("/api/orders");
export const getOrder = (id: string) => req(`/api/orders/${id}`);
export const createOrder = (data: unknown) =>
  req("/api/orders", { method: "POST", body: JSON.stringify(data) });
export const updateOrder = (id: string, data: unknown) =>
  req(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteOrder = (id: string) =>
  req(`/api/orders/${id}`, { method: "DELETE" });
export const updateOrderItem = (itemId: string, data: unknown) =>
  req(`/api/orders/items/${itemId}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteOrderItem = (itemId: string) =>
  req(`/api/orders/items/${itemId}`, { method: "DELETE" });

// Pricing
export const getPricing = () => req("/api/pricing");
