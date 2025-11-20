// Customer/lib/shops.ts

import axios from "axios";
import { API_URL } from "@/lib/api";

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
    distance: number; 
}

/**
 * Interface for Service details.
 */
export interface Service {
    id: string; 
    name: string; 
    price: number; 
    minLoad: number; 
    maxLoad: number; 
}

/**
 * Interface for Add-On details.
 */
export interface AddOn {
    id: string; 
    name: string; 
    price: number; 
}

/**
 * Interface for Delivery Option details.
 */
export interface DeliveryOption {
    id: string;     
    name: string;   
    description: string; 
}

export interface FabricType {
    id: string; 
    name: string; 
}

export interface PaymentMethod {
    id: string; 
    name: string; 
}

/**
 * The complete structure returned when fetching full shop details.
 */
export interface FullShopDetails {
    shop: Shop; // Detailed info for the selected shop
    services: Service[];
    addOns: AddOn[];
    deliveryOptions: DeliveryOption[];
    fabricTypes: FabricType[];
    paymentMethods: PaymentMethod[];
}


// --- API FUNCTIONS ---

/**
 * Fetches a list of shops near the provided geographic coordinates.
 * Corresponds to: GET /api/shops/nearby
 */
export const fetchNearbyShops = async (latitude: number, longitude: number): Promise<Shop[]> => {
    try {
        const response = await axios.get(`${API_URL}/shops/nearby`, {
            params: { lat: latitude, lon: longitude }
        });

        if (response.data.success && Array.isArray(response.data.shops)) {
            // 🔑 CRITICAL FIX: Map the PascalCase keys returned by the backend SQL query 
            // to the camelCase/snake_case keys expected by the React Native interfaces.
            return response.data.shops.map((s: any): Shop => ({
                id: s.id?.toString() || s.ShopID?.toString() || '', // Use 'id' if backend alias succeeded, otherwise use fallback
                name: s.name || s.ShopName,
                address: s.address || s.ShopAddress,
                description: s.description || s.ShopDescrp,
                image_url: s.image_url || s.ShopImage_url, 
                contact: s.contact || s.ShopPhone,
                hours: s.hours || s.ShopOpeningHours,
                availability: s.availability || s.ShopStatus, // Map ShopStatus to availability
                rating: s.rating?.toString() || '0.0',
                distance: s.distance, // distance should already be correct from the backend AS clause
            }));
        }
        
        console.error("Backend reported error fetching shops:", response.data.message);
        return [];

    } catch (error) {
        console.error("Error in fetchNearbyShops (Network/Server):", error);
        return []; 
    }
};

/**
 * Fetches the full details (services, add-ons, and delivery options) for a specific shop.
 * Corresponds to: GET /api/shops/:shopId/full-details
 */
export const fetchShopDetails = async (shopId: string): Promise<FullShopDetails | null> => {
    try {
        const response = await axios.get(`${API_URL}/shops/${shopId}/full-details`);

        if (response.data.success && response.data.shop) {
            // This route's backend query uses explicit aliases, so only minimal checking is needed here.
            return {
                shop: response.data.shop as Shop,
                services: response.data.services || [],
                addOns: response.data.addOns || [],
                deliveryOptions: response.data.deliveryOptions || [], 
                fabricTypes: response.data.fabricTypes || [], 
                paymentMethods: response.data.paymentMethods || [],
            };
        }
        
        console.error(`Shop details not found or failed to load for ShopID ${shopId}:`, response.data.error);
        return null;

    } catch (error) {
        console.error(`Error in fetchShopDetails for ${shopId} (Network/Server):`, error);
        return null;
    }
};