// lib/orders.ts
import { API_URL } from "./api";

// =================================================================
// 1. ORDER CREATION INTERFACES
// =================================================================

/**
 * Defines the structure for the payload sent to POST /api/orders.
 */
export interface CreateOrderPayload {
    CustID: string;
    ShopID: string; 
    SvcID: string; 
    deliveryId: string; 
    weight: number; 
    instructions: string;
    fabrics: string[]; 
    addons: string[]; 
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
    shopName: string;
    serviceName: string;
    servicePrice: number;
    initialWeight: number; // Current weight (Kilogram column)
    instructions: string;
    deliveryType: string;
    deliveryFee: number;
    status: string; 
    fabrics: string[];
    addons: AddOnDetail[];
    totalAmount: number;
    paymentMethodName?: string;
}

/**
 * Interface for a single chronological step in the Order_Processing timeline.
 */
export interface OrderProcessStep {
    status: string; // e.g., 'Pending', 'Washed', 'Out for Delivery', 'Completed'
    time: string;   // Timestamp of the status update
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
 * Marks an existing order as 'Cancelled' via the status update route.
 */
export async function cancelCustomerOrder(
    orderId: string,
    userId: string
): Promise<boolean> {
    try {
        const response = await fetch(`${API_URL}/orders/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                orderId, 
                newStatus: 'Cancelled',
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