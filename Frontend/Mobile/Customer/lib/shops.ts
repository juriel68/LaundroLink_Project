// Customer/lib/shops.ts (FINALIZED CODE WITH CRITICAL MAPPING)

import axios from "axios";
import { API_URL } from "@/lib/api";

// --- SHOP INTERFACES (Matching the required frontend keys) ---

/**
 * Interface for a Shop item returned by the /api/shops/nearby route.
 */
export interface Shop {
    id: string; // Corresponds to ShopID
    name: string; // Corresponds to ShopName
    address: string; // Corresponds to ShopAddress
    description: string; // Corresponds to ShopDescrp
    image_url: string; // Corresponds to ShopImage_url
    contact: string; // Corresponds to ShopPhone
    hours: string; // Corresponds to ShopOpeningHours
    availability: string; // Corresponds to ShopStatus
    rating: string; // Corresponds to the single ShopRating value
    distance: number; // Calculated distance (from the nearby route)
}

/**
 * Interface for Service details.
 */
export interface Service {
    id: string; // SvcID
    name: string; // SvcName
    price: number; // SvcPrice
    minLoad: number; // MinLoad
    maxLoad: number; // MaxLoad
}

/**
 * Interface for Add-On details.
 */
export interface AddOn {
    id: string; // AddOnID
    name: string; // AddOnName
    price: number; // AddOnPrice
}

/**
 * Interface for Delivery Option details.
 */
export interface DeliveryOption {
    id: string;      // DlvryID 
    name: string;    // DlvryTypeName
    description: string; // DlvryDescription (Shop-specific override)
}

export interface FabricType {
    id: string; // FabID
    name: string; // FabName
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
            };
        }
        
        console.error(`Shop details not found or failed to load for ShopID ${shopId}:`, response.data.error);
        return null;

    } catch (error) {
        console.error(`Error in fetchShopDetails for ${shopId} (Network/Server):`, error);
        return null;
    }
};