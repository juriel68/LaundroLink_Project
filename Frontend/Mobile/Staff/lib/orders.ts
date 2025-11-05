// lib/orders.ts 

import { API_URL } from "./api";

// =================================================================
// 1. INTERFACES
// =================================================================

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
  invoiceStatus?: string;
  latestProcessStatus?: string | null;
  reason?: string | null; 
  note?: string | null;  
}

export interface AddOnDetail {
    name: string;
    price: string; // Keep as string here for safe parsing in component
}

/**
 * 🔑 MODIFIED: Includes fabrics and addons, which are arrays of names/strings from the backend.
 */
export interface OrderDetail {
  orderId: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  serviceName: string;
  servicePrice: string;
  weight: string;
  deliveryType: string;
  deliveryFee: string;
  status: string;
  reason?: string | null; 
  note?: string | null;
  // 🔑 NEW FIELDS
  fabrics: string[]; 
  addons: AddOnDetail[];
}

export interface OrderSummaryData {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  chartData: { label: string; revenue: number }[];
  recentOrders: { 
    id: string; 
    customer: string; 
    status: string; 
    amount: number | null;
    invoiceStatus: string | null;
  }[];
}

// 🔑 NEW INTERFACE: For the updated weight/invoice response
export interface WeightUpdateResponse {
    success: boolean;
    message: string;
    newTotal?: string; // The newly calculated invoice total (PayAmount)
}

// =================================================================
// 2. API FUNCTIONS
// (Rest of the functions remain the same)
// =================================================================

/**
 * Fetches orders for a specific shop from the backend API.
 */
export const fetchOrders = async (shopId: string): Promise<Order[]> => {
  if (!shopId) return []; 
  
  try {
    const response = await fetch(`${API_URL}/orders/shop/${shopId}`);

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const orders: Order[] = await response.json();
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return [];
  }
};

/**
 * Updates the main order status.
 */
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

/**
 * Fetches a single order's details.
 */
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

/**
 * 🔑 MODIFIED: Updates the laundry weight and returns the newly calculated invoice total.
 * The backend will use this weight to calculate PayAmount.
 * @returns Promise resolving to the success status and the new total.
 */
export const updateOrderWeight = async (
    orderId: string, 
    newWeight: number, 
    isFinal: boolean = false,
    // 🔑 ADDED: User details for logging activity on the backend
    userId?: string, 
    userRole?: string
): Promise<WeightUpdateResponse> => {
  try {
    const response = await fetch(`${API_URL}/orders/weight`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      // Include all necessary fields in the payload
      body: JSON.stringify({ orderId, newWeight, isFinal, userId, userRole }), 
    });

    // The rest of the function remains the same...

    if (!response.ok) {
      throw new Error('Failed to update weight and invoice');
    }
    
    const data: WeightUpdateResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error in updateOrderWeight:", error);
    return { success: false, message: error.message || "Network Error" };
  }
};

/**
 * Updates the processing sub-status.
 */
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


/**
 * Fetches the dashboard summary metrics.
 */
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