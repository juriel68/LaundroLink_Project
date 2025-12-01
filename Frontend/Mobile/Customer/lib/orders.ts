// lib/orders.ts
import { API_URL } from "./api";

// =================================================================
// 1. ORDER CREATION INTERFACES
// =================================================================

/**
 * Defines the structure for the payload sent to POST /api/orders.
 * 🔑 UPDATED: IDs are now numbers to match database INT columns.
 */
export interface CreateOrderPayload {
    CustID: string;   // VARCHAR
    ShopID: number;   // INT
    SvcID: number;    // INT
    deliveryTypeId: number; // INT
    weight: number; 
    instructions: string;
    fabrics: number[]; 
    addons: number[];
    finalDeliveryFee: number;
    deliveryOptionName: string;
}


/**
 * Interface for the response received after successfully creating an order.
 */
export interface OrderCreationResponse {
    success: boolean;
    message: string;
    orderId?: string; 
}


// =================================================================
// 2. ORDER FETCHING INTERFACES
// =================================================================

/**
 * Interface for a brief order item in the customer's history list.
 */
export interface CustomerOrderPreview {
    id: string;
    createdAt: string;
    shopName: string;
    serviceName: string;
    status: string;
    totalAmount: number;
    invoiceStatus?: string; // Added
    deliveryAmount?: number; // Added
    deliveryPaymentStatus?: string; // Added
    deliveryStatus?: string; // Added for Activity screen filtering
    isRated?: boolean;
    shopImage?: string;
}

/**
 * Interface for the structured Add-On details returned by the backend.
 */
export interface AddOnDetail {
    name: string;
    price: number;
}

/**
 * Interface for the detailed view of a single order.
 */
export interface CustomerOrderDetails {
    orderId: string;
    createdAt: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    shopId: number;
    shopName: string;
    shopAddress: string;
    shopPhone: string;
    invoiceId: string;
    serviceName: string;
    servicePrice: number;
    weight: number;
    isOwnService: boolean;
    deliveryProvider?: string;
    weightProofImage?: string;
    instructions: string;
    deliveryType: string;
    deliveryFee: number;
    orderStatus: string; 
    invoiceStatus: string;
    deliveryStatus?: string;
    deliveryPaymentStatus?: string;
    fabrics: string[];
    addons: AddOnDetail[];
    totalAmount: number;
    paymentMethodName?: string;
}

/**
 * Interface for a single chronological step in the Order_Processing timeline.
 */
export interface OrderProcessStep {
    status: string; 
    time: string;   
}

/**
 * Interface for raw statuses fetched for tracking timeline construction.
 * Used by GET /orders/:orderId/raw-statuses
 */
export interface StatusTimeMap {
    [status: string]: { time: string };
}

export interface RawStatuses {
    orderStatus: StatusTimeMap;
    deliveryStatus: StatusTimeMap;
    orderProcessing: StatusTimeMap;
}


// =================================================================
// 3. API Functions
// =================================================================

/**
 * Sends the final order payload to the backend to create a new order.
 */
export async function createNewOrder(
    payload: CreateOrderPayload
): Promise<OrderCreationResponse> {
    const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const data: OrderCreationResponse = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit the new order to the server.');
    }

    return data;
}

/**
 * Fetches the list of all orders placed by a specific customer.
 */
export async function fetchCustomerOrders(
    customerId: string
): Promise<CustomerOrderPreview[]> {
    try {
        const response = await fetch(`${API_URL}/orders/customer/${customerId}`);

        if (!response.ok) {
            console.error(`[API ERROR] Failed to fetch orders: ${response.status} ${response.statusText}`);
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data: CustomerOrderPreview[] = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching customer order list:", error);
        return [];
    }
}

/**
 * Fetches the detailed information for a single order.
 */
export async function fetchOrderDetails(
    orderId: string
): Promise<CustomerOrderDetails | null> {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`);

        if (response.status === 404) {
             return null;
        }

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data: CustomerOrderDetails = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching order ${orderId} details:`, error);
        return null;
    }
}

/**
 * Fetches all raw, timestamped statuses for the tracking timeline.
 */
export async function fetchRawStatuses(
    orderId: string
): Promise<RawStatuses | null> {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/raw-statuses`);

        if (!response.ok) {
            console.error(`[API ERROR] Failed to fetch raw statuses: ${response.status} ${response.statusText}`);
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data: RawStatuses = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching raw statuses for order ${orderId}:`, error);
        return null;
    }
}


/**
 * Confirms payment (Service/Laundry)
 * 🟢 UPDATED: Now accepts optional proofUri
 */
export const submitPayment = async (
    orderId: string, 
    methodId: number, 
    amount: number,
    proofUri?: string | null 
): Promise<boolean> => {
    try {
        // If proof exists, use FormData (Multipart). If not, use JSON.
        if (proofUri) {
            const formData = new FormData();
            formData.append('orderId', orderId);
            formData.append('methodId', methodId.toString());
            formData.append('amount', amount.toString());

            // Append image
            const filename = proofUri.split('/').pop() || 'proof.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;

            formData.append('proofImage', { uri: proofUri, name: filename, type } as any);

            const response = await fetch(`${API_URL}/orders/customer/payment-submission`, {
                method: 'POST',
                // Note: Content-Type header is NOT set manually for FormData; fetch does it automatically
                body: formData,
            });

            if (!response.ok) throw new Error('Failed to upload payment proof');
            const data = await response.json();
            return data.success;

        } else {
            // Standard JSON (Cash)
            const response = await fetch(`${API_URL}/orders/customer/payment-submission`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, methodId, amount }),
            });

            if (!response.ok) throw new Error('Failed to confirm payment');
            const data = await response.json();
            return data.success;
        }
    } catch (error) {
        console.error("Error in submitPayment:", error);
        return false;
    }
};

/**
 * Confirms payment (Delivery)
 * 🟢 UPDATED: Now accepts optional proofUri
 */
export const submitDeliveryPayment = async (
    orderId: string, 
    methodId: number, 
    amount: number,
    proofUri?: string | null
): Promise<boolean> => {
    try {
        if (proofUri) {
            const formData = new FormData();
            formData.append('orderId', orderId);
            formData.append('methodId', methodId.toString());
            formData.append('amount', amount.toString());

            const filename = proofUri.split('/').pop() || 'delivery_proof.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;

            formData.append('proofImage', { uri: proofUri, name: filename, type } as any);

            const response = await fetch(`${API_URL}/orders/customer/delivery-payment-submission`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Failed to upload delivery proof');
            const data = await response.json();
            return data.success;

        } else {
            // Standard JSON (Cash)
            const response = await fetch(`${API_URL}/orders/customer/delivery-payment-submission`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, methodId, amount }),
            });

            if (!response.ok) throw new Error('Failed to confirm delivery payment');
            const data = await response.json();
            return data.success;
        }
    } catch (error) {
        console.error("Error in submitDeliveryPayment:", error);
        return false;
    }
};


// 🟢 NEW: Cancel Order Function
export async function cancelCustomerOrder(
    orderId: string,
    userId: string
): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/orders/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                orderId, 
                userId, 
                userRole: 'Customer' 
            }), 
        });

        if (!response.ok) throw new Error('Failed to send cancellation request.');
        
        const data = await response.json();
        return data.success === true;

    } catch (error) {
        console.error("Error cancelling order:", error);
        return false;
    }
}

/**
 * Fetches the chronological process history for a specific order.
 */
export async function fetchProcessHistory(
    orderId: string
): Promise<OrderProcessStep[]> {
    // This function is still needed by the legacy /process-history route, but it's 
    // recommended to use fetchRawStatuses for building the new timeline.
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/process-history`);

        if (!response.ok) {
            console.error(`[API ERROR] Failed to fetch process history: ${response.status} ${response.statusText}`);
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }

        const data: OrderProcessStep[] = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching process history for order ${orderId}:`, error);
        return [];
    }
}

export const submitOrderRating = async (
    orderId: string,
    rating: number,
    comment: string
): Promise<boolean> => {
    try {
        const response = await fetch(`${API_URL}/orders/rate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, rating, comment }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to rate.");
        return data.success;
    } catch (error) {
        console.error("Error submitting rating:", error);
        return false;
    }
};