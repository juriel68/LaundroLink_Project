// Customer/lib/auth.ts

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
    picture?: string;
    
    // Profile Fields
    name?: string;
    phone?: string;
    address?: string;

    // Optional Role-Specific Fields
    ShopID?: number;     // 🔑 UPDATED: INT in DB, so number here
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
// 2. Utility Functions (System Gating)
// =================================================================

const MAINTENANCE_STATUS_ENDPOINT = `${API_URL}/admin/config/maintenance-status`;

/**
 * Checks if the system is in Maintenance Mode.
 * Called by index.tsx on app load.
 */
export async function checkMaintenanceStatus(): Promise<boolean> {
    try {
        const response = await fetch(MAINTENANCE_STATUS_ENDPOINT);
        
        // 1. Server Error (500, 503, 404) -> Assume Maintenance ON (Fail-Safe)
        if (!response.ok) {
            return true; 
        }

        // 2. Check explicit flag from valid JSON response
        try {
            const data = await response.json();
            if (data.maintenanceMode === true) {
                 return true; 
            }
        } catch (e) {
            // JSON parse failed but status was 200 -> Assume OFF
        }
        
        return false; // Maintenance is INACTIVE
        
    } catch (error) {
        // 3. Network Unreachable -> Assume Maintenance ON
        return true; 
    }
}

// =================================================================
// 3. Core Authentication Functions
// =================================================================

/**
 * Standard Email/Password Login
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
 * Verify OTP (Step 2 of Login)
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

    return data;
}

/**
 * Initiate Forgot Password (Send Email)
 */
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

/**
 * Complete Password Reset (Verify & Change)
 */
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

/**
 * Google Login Wrapper
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

    return data;
}


// Helper to handle response safely
async function handleResponse(response: Response, actionName: string) {
    const text = await response.text(); 
    
    // console.log(`[${actionName}] Status:`, response.status);
    // console.log(`[${actionName}] Response:`, text.substring(0, 500)); 

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

// --- UPDATED FUNCTIONS (Strict Typing: userId is string) ---

export async function updateUserProfile(
    userId: string, // 🔑 FIX: Enforce string to match DB VARCHAR
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

export { };