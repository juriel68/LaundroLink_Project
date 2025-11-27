import axios from "axios";
import { API_URL } from "./api";
import { Platform } from "react-native";

// =================================================================
// 1. UNIFIED INTERFACES
// =================================================================

export interface AddOnDetail {
    name: string;
    price: number; 
}

/**
 * Base Order structure for lists (Matches GET /orders/shop/:shopId)
 */
export interface Order {
    orderId: string;
    customerId: string;
    shopId: string;
    serviceId: string;
    laundryDetailId: string;
    deliveryId: string; // This is actually DlvryTypeID now, but kept name for compatibility if frontend uses it
    deliveryOptionId?: number; // New field from backend
    createdAt: string;
    laundryStatus: string; 
    deliveryStatus?: string; 
    deliveryPaymentStatus?: string;
    deliveryAmount?: number;
    
    // Fields for Delivery Payment Modal
    deliveryPaymentMethod?: string;
    deliveryPaymentDate?: string;
    deliveryProofImage?: string;
    
    updatedAt: string;
    customerName: string;
    serviceName: string;
    invoiceStatus?: string;
    latestProcessStatus?: string | null;
    totalAmount?: number; 
}

/**
 * Detailed Order structure (Matches GET /orders/:orderId)
 */
export interface OrderDetail {
    orderId: string;
    createdAt: string;
    
    // Customer Info
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    
    // Shop Info
    shopId: number;
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
    weightProofImage?: string; // Added this
    
    deliveryType: string;
    deliveryFee: string | number;
    orderStatus: string; 
    deliveryStatus?: string;
    deliveryPaymentStatus?: string;

    instructions?: string | null;
    fabrics: string[]; 
    addons: AddOnDetail[];
}

// 🟢 UPDATED: Matches Backend Response for Dashboard
export interface OrderSummaryData {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number; // In backend this sums pending + processing + for delivery
    totalRevenue: number;
    
    // Backend sends 'value' for revenue in chart, frontend expects 'revenue'
    // We will map this in the fetch function below
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
        const response = await axios.get(`${API_URL}/orders/shop/${shopId}`);
        const orders: Order[] = response.data;
        // Sort: Newest first
        return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
        console.error("Failed to fetch orders:", error);
        return [];
    }
};

export const fetchOrderDetails = async (orderId: string): Promise<OrderDetail | null> => {
    try {
        const response = await axios.get(`${API_URL}/orders/${orderId}`);
        return response.data; 
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            return null;
        }
        console.error("Error in fetchOrderDetails:", error);
        return null;
    }
};

export const fetchOrderSummary = async (shopId: string, dateRange: string): Promise<OrderSummaryData | null> => {
    try {
        const response = await axios.post(`${API_URL}/orders/dashboard-summary`, { 
            shopId, 
            period: dateRange // Backend expects 'period'
        });
        
        const data = response.data;

        // 🟢 MAPPING FIX: Backend returns 'value', Frontend UI expects 'revenue'
        const mappedChartData = (data.chartData || []).map((d: any) => ({
            label: d.label,
            revenue: parseFloat(d.value || 0)
        }));

        // 🟢 MAPPING FIX: Backend returns separate counts, Frontend Dashboard expects consolidated 'pendingOrders'
        // In backend 'overview' route: pending, processing, forDelivery, completed
        // In backend 'dashboard-summary' route: totalOrders, totalRevenue, chartData
        
        // IF the backend 'dashboard-summary' does NOT return status counts (it usually doesn't),
        // we might need to fetch 'overview' as well or update backend.
        // Assuming backend 'dashboard-summary' was updated to return these, or we default to 0.
        
        // If 'pendingOrders' is missing in response, we might need to calc it or fetch from overview route
        // For now, mapping directly what is available.
        
        return {
            totalOrders: data.totalOrders || 0,
            totalRevenue: data.totalRevenue || 0,
            completedOrders: data.completedOrders || 0, // If backend sends this
            pendingOrders: data.pendingOrders || 0,     // If backend sends this
            chartData: mappedChartData,
            recentOrders: data.recentOrders || []
        };
    } catch (error) {
        console.error("Error in fetchOrderSummary:", error);
        return null;
    }
};

export const fetchProcessHistory = async (orderId: string): Promise<OrderProcessStep[]> => {
    try {
        const response = await axios.get(`${API_URL}/orders/${orderId}/process-history`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching process history:`, error);
        return [];
    }
};

// --- ACTIONS (UPDATE/POST) ---

/**
 * Updates the Laundry Status (e.g., Pending -> Processing -> Completed)
 */
export const updateOrderStatus = async (
    orderId: string, 
    newStatus: string, 
    userId?: string, 
    userRole?: string
): Promise<boolean> => {
    try {
        const response = await axios.post(`${API_URL}/orders/status`, { 
            orderId, 
            newStatus, 
            userId, 
            userRole
        });
        return response.data.success;
    } catch (error) {
        console.error("Error in updateOrderStatus:", error);
        return false;
    }
};

export const updateProcessStatus = async (
    orderId: string, 
    status: string,
    userId?: string,
    userRole?: string
): Promise<boolean> => {
    try {
        const response = await axios.post(`${API_URL}/orders/processing-status`, { 
            orderId, 
            status, 
            userId, 
            userRole 
        });
        return response.data.success;
    } catch (error) {
        console.error(error);
        return false;
    }
};

/**
 * Updates the weight of an order with proof image
 */
export const updateOrderWeightWithProof = async (
    orderId: string,
    weight: string,
    imageUri: string,
    userId: string,
    userRole: string
): Promise<boolean> => {
    try {
        const formData = new FormData();
        formData.append('orderId', orderId);
        formData.append('weight', weight);
        formData.append('userId', userId);
        formData.append('userRole', userRole);

        const filename = imageUri.split('/').pop() || "weight_proof.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        // @ts-ignore
        formData.append('weightProof', { uri: imageUri, name: filename, type });

        const response = await axios.post(`${API_URL}/orders/weight/update-proof`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.success;
    } catch (error) {
        console.error("Error updating weight with proof:", error);
        return false;
    }
};

// --- DELIVERY UPDATE FUNCTIONS ---

export const uploadBookingProof = async (
    orderId: string, 
    imageUri: string,
    userId: string,
    userRole: string
): Promise<boolean> => {
    try {
        const formData = new FormData();
        formData.append('orderId', orderId);
        formData.append('userId', userId);
        formData.append('userRole', userRole);

        const filename = imageUri.split('/').pop() || "proof.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        // @ts-ignore
        formData.append('proofImage', { uri: imageUri, name: filename, type });

        const response = await axios.post(`${API_URL}/orders/delivery/upload-booking`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data.success;
    } catch (error) {
        console.error("Error uploading booking proof:", error);
        return false;
    }
};

export const updateDeliveryWorkflow = async (
    orderId: string,
    newDlvryStatus: string,
    newOrderStatus: string,
    userId: string,
    userRole: string
): Promise<boolean> => {
    try {
        const response = await axios.post(`${API_URL}/orders/delivery/update-status`, {
            orderId,
            newDlvryStatus,
            newOrderStatus,
            userId,
            userRole
        });
        return response.data.success;
    } catch (error) {
        console.error("Error updating delivery workflow:", error);
        return false;
    }
};

export const confirmServicePayment = async (
    orderId: string, 
    userId?: string, 
    userRole?: string
): Promise<boolean> => {
    try {
        const response = await axios.post(`${API_URL}/orders/staff/confirm-service-payment`, { 
            orderId, 
            userId, 
            userRole 
        });
        return response.data.success;
    } catch (error) {
        console.error("Error in confirmServicePayment:", error);
        return false;
    }
};

export const confirmDeliveryPayment = async (
    orderId: string, 
    userId?: string, 
    userRole?: string
): Promise<boolean> => {
    try {
        const response = await axios.post(`${API_URL}/orders/staff/confirm-delivery-payment`, { 
            orderId, 
            userId, 
            userRole 
        });
        return response.data.success;
    } catch (error) {
        console.error("Error in confirmDeliveryPayment:", error);
        return false;
    }
};