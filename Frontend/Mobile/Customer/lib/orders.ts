// lib/orders.ts
import { API_URL } from "./api";

// =================================================================
// 1. ORDER CREATION INTERFACES
// =================================================================

/**
 * Defines the structure for the payload sent to POST /api/orders.
 * This object is assembled across multiple screens.
 */
export interface CreateOrderPayload {
    // Required Identifiers
    CustID: string;
    ShopID: string; 
    SvcID: string; 
    deliveryId: string; 
    
    // Laundry Details
    weight: number; 
    instructions: string;
    
    // Arrays of IDs
    fabrics: string[]; 
    addons: string[]; 
}


/**
 * Interface for the response received after successfully creating an order.
 * Corresponds to: POST /api/orders
 */
export interface OrderCreationResponse {
    success: boolean;
    message: string;
    orderId?: string; // The ID of the newly created order
}


// =================================================================
// 2. ORDER FETCHING INTERFACES
// =================================================================

/**
 * Interface for a brief order item in the customer's history list.
 * Corresponds to: GET /api/orders/customer/:customerId
 */
export interface CustomerOrderPreview {
    id: string; // OrderID
    createdAt: string;
    shopName: string;
    serviceName: string;
    status: string; // Latest OrderStatus (e.g., 'Pending', 'Processing', 'Completed')
    totalAmount: number; // PayAmount from Invoice (can be 0.00 initially)
}

/**
 * Interface for the detailed view of a single order.
 * Corresponds to: GET /api/orders/:orderId
 */
export interface CustomerOrderDetails {
    orderId: string;
    createdAt: string;
    customerName: string;
    customerPhone: string;
    // ... other detailed fields from the backend query ...
    shopName: string;
    serviceName: string;
    servicePrice: number;
    initialWeight: number;
    finalWeight: number | null;
    instructions: string;
    deliveryType: string;
    deliveryFee: number;
    status: string; 
    // Data arrays
    fabrics: string[]; // Array of fabric names (e.g., ['Cotton', 'Wool'])
    addons: string[]; // Array of add-on names (e.g., ['Towel Drying', 'Extra Starch'])
}


// =================================================================
// 3. API Functions
// =================================================================

/**
 * Sends the final order payload to the backend to create a new order.
 * Corresponds to: POST /api/orders
 * * @param payload The complete order data object.
 * @returns A promise resolving to the OrderCreationResponse.
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
 * Corresponds to: GET /api/orders/customer/:customerId
 * * @param customerId The ID of the logged-in customer.
 * @returns A promise resolving to an array of CustomerOrderPreview objects.
 */
export async function fetchCustomerOrders(
    customerId: string
): Promise<CustomerOrderPreview[]> {
    try {
        const response = await fetch(`${API_URL}/orders/customer/${customerId}`);

        if (!response.ok) {
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
 * Corresponds to: GET /api/orders/:orderId
 * * @param orderId The ID of the specific order to fetch.
 * @returns A promise resolving to the detailed order object.
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