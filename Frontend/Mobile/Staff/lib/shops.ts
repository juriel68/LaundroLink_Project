import axios from "axios";
// 🔑 UPDATED: Using relative path to ensure build consistency
import { API_URL } from "./api";

// --- INTERFACES ---

export interface Shop {
    id: string; 
    name: string; 
    address: string; 
    description: string; 
    image_url: string; 
    contact: string; 
    hours: string; 
    availability: string; 
    rating: string; 
    distance?: number; 
}

export interface Service {
    id: string; 
    name: string; 
    price: number; 
    minWeight: number; // 🔑 Matches backend 'MinWeight'
}

export interface AddOn {
    id: string; 
    name: string; 
    price: number; 
}

export interface DeliveryOption {
    id: string;     
    name: string;   
    // 🔑 Removed 'description' as it was dropped from DB schema
}

export interface FabricType {
    id: string; 
    name: string; 
}

export interface PaymentMethod {
    id: string; 
    name: string; 
}

// 🟢 NEW: Interface for Shop_Own_Service
export interface OwnDeliverySettings {
    ShopBaseFare: number;
    ShopBaseKm: number;
    ShopDistanceRate: number;
    ShopServiceStatus: string;
}

// 🟢 NEW: Interface for Shop_Delivery_App
export interface LinkedDeliveryApp {
    DlvryAppName: string;
}

/**
 * The complete structure returned when fetching full shop details.
 */
export interface FullShopDetails {
    shop: Shop; 
    services: Service[];
    addOns: AddOn[];
    deliveryOptions: DeliveryOption[];
    fabricTypes: FabricType[];
    paymentMethods: PaymentMethod[];
    // 🟢 NEW: Delivery Configurations
    ownDelivery: OwnDeliverySettings | null;
    deliveryApps: LinkedDeliveryApp[];
}

// --- API FUNCTIONS ---

/**
 * Fetches the full details (services, add-ons, payment methods, etc.) for a specific shop.
 * Corresponds to: GET /api/shops/:shopId/full-details
 */
export const fetchShopDetails = async (shopId: string): Promise<FullShopDetails | null> => {
    try {
        const response = await axios.get(`${API_URL}/shops/${shopId}/full-details`);

        if (response.data.success && response.data.shop) {
            return {
                shop: response.data.shop as Shop,
                services: response.data.services || [],
                addOns: response.data.addOns || [],
                deliveryOptions: response.data.deliveryOptions || [], 
                fabricTypes: response.data.fabricTypes || [], 
                paymentMethods: response.data.paymentMethods || [],
                // 🟢 UPDATED: Parse new delivery config data
                ownDelivery: response.data.ownDelivery || null,
                deliveryApps: response.data.deliveryApps || []
            };
        }
        
        console.error(`Shop details not found for ShopID ${shopId}`);
        return null;

    } catch (error) {
        console.error(`Error in fetchShopDetails for ${shopId}:`, error);
        return null;
    }
};