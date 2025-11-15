// auth.ts (Staff) - REVISED for Page Load Gating

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from "@/lib/api"; 

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

// Helper to save the session internally (omitted for brevity, assume unchanged)
const saveSession = async (user: UserSession): Promise<void> => {
    // ... (implementation)
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
        const response = await fetch(MAINTENANCE_STATUS_ENDPOINT);
        
        // 1. If response is NOT ok (e.g., 503, 500, 403, 404), maintenance is assumed ON (Fail-Safe).
        if (!response.ok) {
            return true; 
        }

        // 2. If status is 200 OK, check the JSON body for the explicit flag.
        try {
            const data = await response.json();
            if (typeof data.maintenanceMode === 'boolean' && data.maintenanceMode === true) {
                 return true; // Maintenance is ACTIVE (Confirmed by JSON)
            }
        } catch (e) {
            // Ignore parsing errors; fall through to return false.
        }
        
        return false; // Maintenance is INACTIVE
        
    } catch (error: any) {
        // 3. Network error (server unreachable) -> fail-safe block.
        // Assume maintenance is ON for non-admins if we can't confirm status.
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
        const res = await fetch(loginUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        console.log("Response Status:", res.status);
        console.log("Response Data:", data);

        if (res.ok && data.success) {
            const userData = data.user as UserSession; 

            if (!userData) {
                 throw new Error(data.message || "Login success but user data is missing.");
            }
            
            await saveSession(userData);
            
            return userData;
        } else {
            // Throw a specific error message for the component to handle (e.g., invalid credentials)
            throw new Error(data.message || "Invalid email or password.");
        }
    } catch (error: any) {
        // Re-throw network or parsing errors, or invalid credential errors
        console.error("Staff Login API error:", error.message);
        throw error;
    }
};

// ... (getCurrentUser, loadUserFromStorage, and logout functions remain unchanged in practice)

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