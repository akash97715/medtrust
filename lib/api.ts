// In production: empty BASE → relative /api/* URLs → caught by Next.js rewrite → proxied to Railway.
// In development: hit local backend directly.
const BASE = process.env.NODE_ENV === "development" ? "http://localhost:8001" : "";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Cannot reach the server. Please check your connection and try again.");
  }
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

// Public Catalog
export const getCatalogProducts = () => req("/api/catalog");
export const getCatalogProduct = (id: string) => req(`/api/catalog/${id}`);
export const createCatalogProduct = (data: unknown) =>
  req("/api/catalog", { method: "POST", body: JSON.stringify(data) });
export const deleteCatalogProduct = (id: string) =>
  req(`/api/catalog/${id}`, { method: "DELETE" });
export const updateCatalogProduct = (id: string, data: unknown) =>
  req(`/api/catalog/${id}`, { method: "PATCH", body: JSON.stringify(data) });

// Enquiries
export const createEnquiry = (data: { product_id: string; product_name: string; visitor_phone?: string }) =>
  req("/api/enquiries", { method: "POST", body: JSON.stringify(data) });
export const getEnquiries = () => req("/api/enquiries");

// Auth
export const verifyCode = (code: string) =>
  req<{ valid: boolean; role: string | null }>("/api/auth/verify", { method: "POST", body: JSON.stringify({ code }) });

// Dashboard
export const getDashboardSummary = () => req("/api/dashboard/summary");
export const getDashboardProfit = () => req("/api/dashboard/profit");
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
export const addOrderItem = (orderId: string, data: unknown) =>
  req(`/api/orders/${orderId}/items`, { method: "POST", body: JSON.stringify(data) });
export const updateOrderItem = (itemId: string, data: unknown) =>
  req(`/api/orders/items/${itemId}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteOrderItem = (itemId: string) =>
  req(`/api/orders/items/${itemId}`, { method: "DELETE" });

// Order Payments
export const addPayment = (orderId: string, data: { amount: number; payment_date: string; notes?: string }) =>
  req(`/api/orders/${orderId}/payments`, { method: "POST", body: JSON.stringify(data) });
export const deletePayment = (paymentId: string) =>
  req(`/api/orders/payments/${paymentId}`, { method: "DELETE" });

// Pricing
export const getPricing = () => req("/api/pricing");

// Stock
export const getStock = () => req("/api/stock");
export const getStockHistory = () => req("/api/stock/history");
export const updateStock = (productId: string, data: { quantity: number; notes?: string }) =>
  req(`/api/stock/${productId}`, { method: "PATCH", body: JSON.stringify(data) });

// Expenses
export const getExpenses = (month?: string) =>
  req(`/api/expenses${month ? `?month=${month}` : ""}`);
export const createExpense = (data: unknown) =>
  req("/api/expenses", { method: "POST", body: JSON.stringify(data) });
export const deleteExpense = (id: string) =>
  req(`/api/expenses/${id}`, { method: "DELETE" });
