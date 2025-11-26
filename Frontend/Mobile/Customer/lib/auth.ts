import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from "./api"; 

// =================================================================
// 1. Types for Authentication & User Data
// =================================================================

/**
 * Interface for the detailed user object.
 * Matches the combined response structure from backend joins.
 */
export interface UserDetails {
    UserID: string;      // VARCHAR in DB
    UserEmail: string;
    UserRole: 'Customer' | 'Staff' | 'Shop Owner' | 'Admin';
    
    // 🟢 CUSTOMER PROFILE FIELDS
    picture?: string;
    name?: string;
    phone?: string;
    address?: string;

    // 🟢 NEW: Used for Profile Setup Check (True if password exists in DB)
    hasPassword?: boolean;

    // Optional Role-Specific Fields
    ShopID?: number;     
    ShopName?: string;
    StaffName?: string;
    StaffPosition?: string;
}

/**
 * Interface for Login/OTP responses
 */
export interface LoginResponse {
    success: boolean;
    message: string;
    user?: UserDetails;
    userId?: string; 
    requiresOTP?: boolean; 
}

/**
 * Interface for generic success/fail responses
 */
export interface GenericAuthResponse {
    success: boolean;
    message: string;
    email?: string; 
}

// =================================================================
// 2. Session Management (Global State)
// =================================================================

let currentUser: UserDetails | null = null;

/**
 * Internal helper to save user session to storage and memory.
 * 🟢 EXPORTED so SetupProfile.tsx can update the session after saving details.
 */
export const saveSession = async (user: UserDetails): Promise<void> => {
    currentUser = user;
    try {
        // 🔑 NOTE: Using 'user' key for simplicity across the app
        await AsyncStorage.setItem('user', JSON.stringify(user));
        console.log("✅ Session saved for:", user.UserEmail);
    } catch (e) {
        console.error("Failed to save customer session.", e);
    }
};

/**
 * Checks storage on app start to see if a user was already logged in.
 */
export const loadUserFromStorage = async (): Promise<UserDetails | null> => {
    try {
        const userJson = await AsyncStorage.getItem('user');
        if (userJson) {
            currentUser = JSON.parse(userJson);
            return currentUser;
        }
    } catch (e) {
        console.error("Failed to load customer session.", e);
    }
    return null;
};

/**
 * Retrieves the currently logged-in user's data from memory.
 * Very efficient (0ms).
 */
export const getCurrentUser = (): UserDetails | null => {
    return currentUser;
};

/**
 * Clears the user data from memory and storage on logout.
 */
export const logout = async (): Promise<void> => {
    currentUser = null;
    try {
        await AsyncStorage.removeItem('user'); 
    } catch (e) {
        console.error("Failed to remove customer session.", e);
    }
};

// =================================================================
// 3. Utility Functions (System Gating)
// =================================================================

const MAINTENANCE_STATUS_ENDPOINT = `${API_URL}/admin/config/maintenance-status`;

export async function checkMaintenanceStatus(): Promise<boolean> {
    try {
        const response = await fetch(MAINTENANCE_STATUS_ENDPOINT);
        
        if (!response.ok) return true; 

        try {
            const data = await response.json();
            if (data.maintenanceMode === true) return true; 
        } catch (e) {
            // JSON parse error but 200 OK -> Assume active
        }
        
        return false; 
    } catch (error) {
        return true; 
    }
}

// =================================================================
// 4. Core Authentication Functions
// =================================================================

/**
 * Standard Email/Password Login (Initiates OTP for Customers if needed)
 */
export async function handleUserLogin(
    email: string,
    password: string
): Promise<LoginResponse> {
    
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }), 
    });
    
    if (response.status === 401) {
        return { success: false, message: 'Invalid credentials' };
    }

    const data: LoginResponse = await response.json();
    
    if (!response.ok && !data.success) {
        throw new Error(data.message || 'Login failed due to a server error.');
    }
    
    return data;
}

/**
 * Verify OTP (Step 2 of Login) -> SAVES SESSION ON SUCCESS
 */
export async function verifyUserOTP(
    userId: string,
    otp: string
): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp }),
    });

    const data: LoginResponse = await response.json();

    if (!response.ok && !data.success) {
        throw new Error(data.message || 'OTP verification failed.');
    }

    // 🟢 SUCCESS: Save the session 
    if (data.user) {
        await saveSession(data.user);
    }

    return data;
}

/**
 * Google Login Wrapper -> SAVES SESSION ON SUCCESS
 */
export async function googleLogin(
    google_id: string,
    email: string,
    name: string,
    picture: string
): Promise<LoginResponse> {

    const response = await fetch(`${API_URL}/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ google_id, email, name, picture }),
    });

    const data = await response.json();

    if (!response.ok && !data.success) {
        throw new Error(data.message || 'Google login failed.');
    }

    // 🟢 SUCCESS: Save the session
    if (data.user) {
        await saveSession(data.user as UserDetails);
    }

    return data;
}

export async function initiateForgotPassword(
    email: string
): Promise<GenericAuthResponse> {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email }), 
    });

    const data: GenericAuthResponse = await response.json();
    
    if (response.ok) {
        return data;
    }
    
    throw new Error(data.message || 'Failed to initiate password reset.');
}

export async function resetUserPassword(
    email: string,
    otp: string,
    newPassword: string
): Promise<GenericAuthResponse> {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
    });

    const data: GenericAuthResponse = await response.json();

    if (!response.ok && !data.success) {
        throw new Error(data.message || 'Failed to reset password.');
    }
    
    return data;
}

// Helper to handle response safely
async function handleResponse(response: Response, actionName: string) {
    const text = await response.text(); 

    if (!response.ok) {
        try {
            const json = JSON.parse(text);
            throw new Error(json.message || `Server Error: ${response.status}`);
        } catch (e: any) {
            if (e.message && !e.message.includes("JSON")) throw e;
            throw new Error(`Server returned HTML/Text instead of JSON. Status: ${response.status}`);
        }
    }

    try {
        return JSON.parse(text);
    } catch (e) {
        throw new Error(`Invalid JSON response from server.`);
    }
}

/**
 * Fetch full profile details (used by profile.tsx)
 */
export async function fetchFullCustomerProfile(userId: string): Promise<UserDetails | null> {
    try {
        const response = await fetch(`${API_URL}/users/profile/${userId}`);
        
        if (response.status === 404) return null;

        if (!response.ok) throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);

        const data = await response.json();
        
        if (data.success && data.user) {
            return data.user as UserDetails;
        }
        
        return null;

    } catch (error) {
        console.error("Error fetching complete profile:", error);
        return null;
    }
}

export async function updateUserProfile(
    userId: string, 
    data: { name?: string; phone?: string | null; address?: string | null; picture?: string | null }
): Promise<any> {
    const response = await fetch(`${API_URL}/users/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response, "Update Profile");
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<any> {
    const response = await fetch(`${API_URL}/users/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword }),
    });
    return handleResponse(response, "Update Password");
}

export async function uploadUserImage(formData: FormData): Promise<any> {
    const response = await fetch(`${API_URL}/users/upload`, {
        method: 'POST',
        body: formData,
    });
    return handleResponse(response, "Upload Image");
}

// 🟢 NEW: PayPal Payment Integration
export async function initiatePayPalPayment(
    amount: number,
    orderId: string,
    isDelivery: boolean
): Promise<{ success: boolean; approvalUrl?: string; message?: string }> {
    try {
        const response = await fetch(`${API_URL}/payments/paypal/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                amount, 
                orderId,
                isDelivery
            }),
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("PayPal Init Error:", error);
        return { success: false, message: "Network error initializing PayPal." };
    }
}