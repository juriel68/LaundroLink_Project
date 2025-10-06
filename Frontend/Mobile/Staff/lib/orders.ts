// lib/orders.ts

import { API_URL } from "./api"; // ✅ Import the shared URL

// This interface now matches the data structure from your backend
export interface Order {
  orderId: string;
  customerId: string;
  shopId: string;
  serviceId: string;
  laundryDetailId: string;
  deliveryId: string;
  createdAt: string;
  status: string;
  updatedAt: string;
  customerName: string;
  latestProcessStatus?: string | null;
  reason?: string | null; 
  note?: string | null;  
}

/**
 * Fetches orders for a specific shop from the backend API.
 */
export const fetchOrders = async (shopId: string): Promise<Order[]> => {
  if (!shopId) return []; // Don't fetch if shopId is missing
  
  try {
    // ✅ FIX: The URL now includes the shopId to call the correct backend route
    const response = await fetch(`${API_URL}/orders/shop/${shopId}`);

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const orders: Order[] = await response.json();
    // Sort orders by creation date, newest first
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return []; // Return an empty array on error to prevent app crashes
  }
};

// ✅ ADD THIS NEW FUNCTION for updating the status
export const updateOrderStatus = async (orderId: string, newStatus: string, reason?: string, note?: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/orders/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, newStatus, reason, note }),
    });

    if (!response.ok) {
      throw new Error('Failed to update status');
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error in updateOrderStatus:", error);
    return false;
  }
};

export interface OrderDetail {
  orderId: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  serviceName: string;
  servicePrice: string; // ✅ Was number, now string
  weight: string;       // ✅ Was number, now string
  deliveryType: string;
  deliveryFee: string;  // ✅ Was number, now string
  status: string;
  reason?: string | null; 
  note?: string | null;
}

// ✅ ADD THIS NEW FUNCTION to fetch a single order's details
export const fetchOrderDetails = async (orderId: string): Promise<OrderDetail | null> => {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch order details');
    }
    return await response.json();
  } catch (error) {
    console.error("Error in fetchOrderDetails:", error);
    return null;
  }
};

// ✅ ADD THIS MISSING FUNCTION to update the weight
export const updateOrderWeight = async (orderId: string, newWeight: number): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/orders/weight`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, newWeight }),
    });

    if (!response.ok) {
      throw new Error('Failed to update weight');
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error in updateOrderWeight:", error);
    return false;
  }
};

// ✅ ADD THIS to update the processing sub-status
export const updateProcessStatus = async (orderId: string, status: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/orders/processing-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status }),
    });
    const data = await response.json();
    return response.ok && data.success;
  } catch (error) {
    console.error(error);
    return false;
  }
};

// ✅ ADD THIS NEW INTERFACE for the summary data
export interface OrderSummaryData {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  chartData: { label: string; revenue: number }[];
  recentOrders: { id: string; customer: string; status: string; amount: number | null }[];
}

// ✅ ADD THIS NEW FUNCTION to fetch the summary
export const fetchOrderSummary = async (shopId: string, dateRange: string): Promise<OrderSummaryData | null> => {
  try {
    const response = await fetch(`${API_URL}/orders/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId, dateRange }),
    });
    if (!response.ok) throw new Error("Failed to fetch order summary");
    return await response.json();
  } catch (error) {
    console.error("Error in fetchOrderSummary:", error);
    return null;
  }
};