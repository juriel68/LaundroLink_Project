// Customer/lib/shops.ts (FINALIZED CODE)

import axios from "axios";
import { API_URL } from "@/lib/api";

// --- SHOP INTERFACES (Matching the shops.js backend response) ---

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
  rating: string; // Corresponds to COALESCE(AVG(CR.CustRating), 0.0)
  distance: number; // Calculated distance (from the nearby route)
}

/**
 * Interface for Service details.
 * CRITICAL FIX: Includes 'id' (SvcID) needed for the final payload.
 */
export interface Service {
  id: string; // 🔑 SvcID (Required for Payload)
  name: string; // SvcName
  price: number; // SvcPrice
  minLoad: number; // MinLoad
  maxLoad: number; // MaxLoad
}

/**
 * Interface for Add-On details.
 * CRITICAL FIX: Includes 'id' (AddOnID) needed for the final payload.
 */
export interface AddOn {
  id: string; // 🔑 AddOnID (Required for Payload)
  name: string; // AddOnName
  price: number; // AddOnPrice
}

/**
 * Interface for Delivery Option details.
 */
export interface DeliveryOption {
  id: string;      // DlvryID (e.g., 'DV01')
  name: string;    // DlvryName
  description: string; // DlvryDescription
}

export interface FabricType {
    id: string; // FabTypeID (e.g., 'FT01')
    name: string; // FabricType (e.g., 'Regular Clothes')
}

/**
 * The complete structure returned when fetching full shop details.
 */
export interface FullShopDetails {
  shop: Shop; // Detailed info for the selected shop
  services: Service[];
  addOns: AddOn[];
  deliveryOptions: DeliveryOption[]; // NEW: Added to match updated shops.js
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

    if (response.data.success) {
      return response.data.shops || []; 
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
      return {
        shop: response.data.shop,
        services: response.data.services || [],
        addOns: response.data.addOns || [],
        deliveryOptions: response.data.deliveryOptions || [], 
        // 🔑 NEW: Retrieve fabric types
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