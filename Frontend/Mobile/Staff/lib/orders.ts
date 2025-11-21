// lib/orders.ts

import { API_URL } from "./api";

// =================================================================
// 1. UNIFIED INTERFACES
// =================================================================

export interface AddOnDetail {
    name: string;
    price: number; 
}

/**
 * Base Order structure for lists.
 */
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
    totalAmount?: number; // Useful for lists
}

/**
 * Detailed Order structure for single view.
 * Used by both Staff (OrderDetail) and Customer (CustomerOrderDetails).
 */
export interface OrderDetail {
    orderId: string;
    createdAt: string;
    
    // Customer Info
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    
    // Shop Info
    shopName?: string;
    shopAddress?: string;
    shopPhone?: string;
    
    // Invoice Info
    invoiceId?: string;
    invoiceStatus?: string;
    totalAmount?: string | number;
    proofImage?: string | null;
    paymentMethodName?: string;

    // Order Details
    serviceId: string;
    serviceName: string;
    servicePrice: string | number;
    weight: number; 
    deliveryType: string;
    deliveryFee: string | number;
    status: string;
    reason?: string | null; 
    note?: string | null;
    instructions?: string | null;
    
    // Arrays
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

export interface OrderProcessStep {
    status: string;
    time: string;   
}

// =================================================================
// 2. API FUNCTIONS
// =================================================================

// --- GENERAL FETCHERS ---

export const fetchOrders = async (shopId: string): Promise<Order[]> => {
    if (!shopId) return []; 
    try {
        const response = await fetch(`${API_URL}/orders/shop/${shopId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const orders: Order[] = await response.json();
        return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
        console.error("Failed to fetch orders:", error);
        return [];
    }
};

export const fetchOrderDetails = async (orderId: string): Promise<OrderDetail | null> => {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`);
        if (response.status === 404) return null;
        if (!response.ok) throw new Error('Failed to fetch order details');
        return await response.json(); 
    } catch (error) {
        console.error("Error in fetchOrderDetails:", error);
        return null;
    }
};

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

export const fetchProcessHistory = async (orderId: string): Promise<OrderProcessStep[]> => {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/process-history`);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching process history:`, error);
        return [];
    }
};

// --- ACTIONS (UPDATE/POST) ---

export const updateOrderStatus = async (
    orderId: string, 
    newStatus: string, 
    userId?: string, 
    userRole?: string, 
    reason?: string, 
    note?: string
): Promise<boolean> => {
    try {
        const response = await fetch(`${API_URL}/orders/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, newStatus, userId, userRole, reason, note }),
        });
        if (!response.ok) throw new Error('Failed to update status');
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error("Error in updateOrderStatus:", error);
        return false;
    }
};

export const submitDeliveryBooking = async (
    orderId: string,
    fee: number,
    total: number, 
    imageUri: string,
    userId: string,
    userRole: string
): Promise<boolean> => {
    try {
        const formData = new FormData();
        formData.append('orderId', orderId);
        formData.append('fee', fee.toString());
        formData.append('total', total.toString()); 
        formData.append('userId', userId);
        formData.append('userRole', userRole);

        const filename = imageUri.split('/').pop() || 'proof.jpg';
        const fileType = filename.split('.').pop() === 'png' ? 'image/png' : 'image/jpeg';

        formData.append('proofImage', {
            uri: imageUri,
            name: filename,
            type: fileType,
        } as any);

        const response = await fetch(`${API_URL}/orders/delivery-booking`, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' },
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`❌ Server Error (${response.status}):`, errText);
            return false;
        }

        const data = await response.json();
        return data.success;

    } catch (error: any) {
        console.error("❌ NETWORK ERROR in submitDeliveryBooking:", error);
        return false;
    }
};

export const updateOrderWeight = async (
    orderId: string, 
    newWeight: number, 
    isFinal: boolean = false,
    userId?: string, 
    userRole?: string
): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await fetch(`${API_URL}/orders/weight`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, newWeight, isFinal, userId, userRole }), 
        });

        const data: { success: boolean; message: string } = await response.json();

        if (!response.ok) throw new Error(data.message || 'Failed to update weight');
        return data; 
    } catch (error: any) {
        console.error("Error in updateOrderWeight:", error);
        return { success: false, message: error.message || "Network Error" }; 
    }
};

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
 * Staff Action: Approve Payment (Sets Invoice='Paid', Order='Processing')
 */
export const approvePayment = async (orderId: string, userId?: string, userRole?: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_URL}/orders/approve-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, userId, userRole }),
        });

        if (!response.ok) throw new Error('Failed to approve payment');
        
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error("Error in approvePayment:", error);
        return false;
    }
};