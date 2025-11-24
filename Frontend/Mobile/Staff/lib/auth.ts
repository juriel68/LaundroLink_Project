// Staff/lib/auth.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from "./api"; 

// Define the shape of the user object
export interface UserSession { 
    UserID: string;
    UserEmail: string;
    UserRole: string;
    ShopID: string;
    ShopName: string;
}

let currentUser: UserSession | null = null;

// --- UPDATED ENDPOINT ---
const MAINTENANCE_STATUS_ENDPOINT = `${API_URL}/admin/config/maintenance-status`; 
// ------------------------

// Helper to save the session internally
const saveSession = async (user: UserSession): Promise<void> => {
    currentUser = user;
    try {
        await AsyncStorage.setItem('user_session', JSON.stringify(user));
    } catch (e) {
        console.error("Failed to save user session.", e);
    }
};

/**
 * Checks the maintenance status by calling the Admin endpoint.
 * Returns true if maintenance is active or status is undeterminable (network error), False otherwise.
 * * This is the robust check used to gate the login screen.
 * @returns {Promise<boolean>} True if maintenance is active, False otherwise.
 */
async function checkMaintenanceStatus(): Promise<boolean> {
    try {
        // Axios throws an error automatically for non-2xx responses (404, 500, etc.)
        const response = await axios.get(MAINTENANCE_STATUS_ENDPOINT);
        
        // If we reach here, status is 200 OK. Check the JSON body.
        const data = response.data;
        
        if (typeof data.maintenanceMode === 'boolean' && data.maintenanceMode === true) {
             return true; // Maintenance is ACTIVE (Confirmed by JSON)
        }
        
        return false; // Maintenance is INACTIVE

    } catch (error: any) {
        // 1. Network error (server unreachable)
        // 2. HTTP Error (404, 500, 503)
        // -> Fail-safe block: Assume maintenance is ON for non-admins if we can't confirm status.
        return true; 
    }
}


/**
 * 🚀 Handles the Staff login API call.
 * * NOTE: The maintenance check is REMOVED from here and placed in index.tsx.
 */
export const login = async (email: string, password: string): Promise<UserSession | null> => {
    const loginUrl = `${API_URL}/auth/login`; 
    
    console.log("--- auth.ts: Attempting Staff Login (via 'login' function) ---");
    
    try {
        const response = await axios.post(loginUrl, { email, password });
        const data = response.data;

        console.log("Response Status:", response.status);
        console.log("Response Data:", data);

        if (data.success) {
            const userData = data.user as UserSession; 

            if (!userData) {
                 throw new Error(data.message || "Login success but user data is missing.");
            }
            
            await saveSession(userData);
            return userData;
        } else {
            // Logic handled by backend returning success: false
            throw new Error(data.message || "Invalid email or password.");
        }
    } catch (error: any) {
        // Handle Axios specific error structures if needed
        let errorMessage = error.message;

        if (error.response) {
            // Server responded with a status code other than 2xx
            console.error("Staff Login API error (Server):", error.response.data);
            errorMessage = error.response.data.message || "Invalid credentials or server error.";
        } else if (error.request) {
            // Request was made but no response received
            console.error("Staff Login API error (Network):", error.request);
            errorMessage = "Network error. Please check your connection.";
        }

        console.error("Staff Login API error:", errorMessage);
        throw new Error(errorMessage);
    }
};

/**
 * Retrieves the currently logged-in user's data.
 */
export const getCurrentUser = (): UserSession | null => {
    return currentUser;
};

/**
 * Checks storage on app start to see if a user was already logged in.
 */
export const loadUserFromStorage = async (): Promise<UserSession | null> => {
    try {
        const userJson = await AsyncStorage.getItem('user_session');
        if (userJson) {
            currentUser = JSON.parse(userJson);
            console.log("User loaded from storage:", currentUser);
            return currentUser;
        }
    } catch (e) {
        console.error("Failed to load user session.", e);
    }
    return null;
};

/**
 * Clears the user data from memory and storage on logout.
 */
export const logout = async (): Promise<void> => {
    currentUser = null;
    try {
        await AsyncStorage.removeItem('user_session');
    } catch (e) {
        console.error("Failed to remove user session.", e);
    }
};

// Export the check function so index.tsx can use it.
export { checkMaintenanceStatus };