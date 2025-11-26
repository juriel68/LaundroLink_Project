// Customer/lib/shops.ts

import axios from "axios";
import { API_URL } from "./api";

// =================================================================
// 1. DOMAIN ENTITIES (INTERFACES)
// =================================================================

export interface Shop {
    id: number; 
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

export interface Service {
    id: number; 
    name: string; 
    price: number; 
    minWeight: number; 
}

export interface AddOn {
    id: number; 
    name: string; 
    price: number; 
}

export interface DeliveryOption {
    id: number;     
    name: string;   
}

export interface FabricType {
    id: number; 
    name: string; 
}

export interface PaymentMethod {
    id: number; 
    name: string; 
}

// Interface for In-House Delivery Settings
export interface OwnDeliverySettings {
    ShopBaseFare: number;
    ShopBaseKm: number;
    ShopDistanceRate: number;
    ShopServiceStatus: 'Active' | 'Inactive';
}

// Interface for Linked 3rd Party Apps
export interface LinkedApp {
    DlvryAppName: string;
    AppBaseFare: number;
    AppBaseKm: number;
    AppDistanceRate: number;
}

export interface FullShopDetails {
    shop: Shop; 
    services: Service[];
    addOns: AddOn[];
    deliveryOptions: DeliveryOption[];
    fabricTypes: FabricType[];
    paymentMethods: PaymentMethod[];
    // 🟢 NEW: Include Delivery Configs here for easy access
    ownDelivery: OwnDeliverySettings | null;
    deliveryApps: LinkedApp[];
}

// =================================================================
// 2. API FUNCTIONS
// =================================================================

export const fetchNearbyShops = async (latitude: number, longitude: number): Promise<Shop[]> => {
    try {
        const response = await axios.get(`${API_URL}/shops/nearby`, {
            params: { lat: latitude, lon: longitude }
        });

        if (response.data.success && Array.isArray(response.data.shops)) {
            return response.data.shops.map((s: any): Shop => ({
                id: parseInt(s.id || s.ShopID, 10),
                name: s.name,
                address: s.address,
                description: s.description,
                image_url: s.image_url, 
                contact: s.contact,
                hours: s.hours,
                availability: s.availability,
                rating: s.rating?.toString() || '0.0',
                distance: typeof s.distance === 'number' ? s.distance : parseFloat(s.distance || '0'), 
            }));
        }
        return [];
    } catch (error) {
        console.error("Error in fetchNearbyShops:", error);
        return []; 
    }
};

export const fetchShopDetails = async (shopId: string | number): Promise<FullShopDetails | null> => {
    try {
        const response = await axios.get(`${API_URL}/shops/${shopId}/full-details`);

        if (response.data.success && response.data.shop) {
            const toInt = (val: any) => parseInt(val, 10);
            const shopData = response.data.shop;
            
            const shop: Shop = {
                ...shopData,
                id: toInt(shopData.id),
                rating: shopData.rating?.toString() || '0.0',
                distance: typeof shopData.distance === 'number' ? shopData.distance : parseFloat(shopData.distance || '0')
            };

            const mappedServices: Service[] = (response.data.services || []).map((s: any) => ({
                id: toInt(s.id),
                name: s.name,
                price: parseFloat(s.price),
                minWeight: s.minWeight || s.minLoad || 1 
            }));

            const mappedAddOns: AddOn[] = (response.data.addOns || []).map((a: any) => ({
                id: toInt(a.id),
                name: a.name,
                price: parseFloat(a.price)
            }));
            
            const mappedDelivery: DeliveryOption[] = (response.data.deliveryOptions || []).map((d: any) => ({
                id: toInt(d.id),
                name: d.name,
            }));

            const mappedFabrics: FabricType[] = (response.data.fabricTypes || []).map((f: any) => ({
                id: toInt(f.id),
                name: f.name
            }));

            const mappedPayments: PaymentMethod[] = (response.data.paymentMethods || []).map((p: any) => ({
                id: toInt(p.id),
                name: p.name
            }));

            // 🟢 NEW: Map the delivery settings included in the response
            const ownDelivery = response.data.ownDelivery ? {
                ShopBaseFare: parseFloat(response.data.ownDelivery.ShopBaseFare),
                ShopBaseKm: parseInt(response.data.ownDelivery.ShopBaseKm, 10),
                ShopDistanceRate: parseFloat(response.data.ownDelivery.ShopDistanceRate),
                ShopServiceStatus: response.data.ownDelivery.ShopServiceStatus
            } : null;

            return {
                shop,
                services: mappedServices,
                addOns: mappedAddOns,
                deliveryOptions: mappedDelivery,
                fabricTypes: mappedFabrics,
                paymentMethods: mappedPayments,
                ownDelivery: ownDelivery,
                deliveryApps: response.data.deliveryApps || []
            };
        }
        return null;
    } catch (error) {
        console.error(`Error in fetchShopDetails for ${shopId}:`, error);
        return null;
    }
};

// Independent fetchers kept for flexibility if needed elsewhere
export const fetchOwnDeliverySettings = async (shopId: string | number): Promise<OwnDeliverySettings | null> => {
    try {
        const response = await axios.get(`${API_URL}/shops/${shopId}/own-delivery`);
        if (response.data.success && response.data.settings) {
            const s = response.data.settings;
            return {
                ShopBaseFare: parseFloat(s.ShopBaseFare),
                ShopBaseKm: parseInt(s.ShopBaseKm, 10),
                ShopDistanceRate: parseFloat(s.ShopDistanceRate),
                ShopServiceStatus: s.ShopServiceStatus
            };
        }
        return null;
    } catch (error) {
        console.error("Error fetching own delivery settings:", error);
        return null;
    }
};

export const fetchLinkedApps = async (shopId: string | number): Promise<LinkedApp[]> => {
    try {
        const response = await axios.get(`${API_URL}/shops/${shopId}/delivery-apps`);
        if (response.data.success && Array.isArray(response.data.apps)) {
            return response.data.apps.map((app: any) => ({
                DlvryAppID: parseInt(app.DlvryAppID, 10),
                DlvryAppName: app.DlvryAppName,
                AppBaseFare: parseFloat(app.AppBaseFare),
                AppBaseKm: parseInt(app.AppBaseKm, 10),
                AppDistanceRate: parseFloat(app.AppDistanceRate)
            }));
        }
        return [];
    } catch (error) {
        console.error("Error fetching linked apps:", error);
        return [];
    }
};