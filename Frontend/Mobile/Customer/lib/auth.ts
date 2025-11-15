// lib/auth.ts - REVISED for Page Load Maintenance Gating

import { API_URL } from "./api"; 

// =================================================================
// 1. Types for Authentication
// =================================================================

/**
 * Interface for the detailed user object returned upon successful login
 */
export interface UserDetails {
    UserID: string;
    UserEmail: string;
    UserRole: 'Customer' | 'Staff' | 'Shop Owner' | 'Admin';
    picture?: string;
    ShopID?: string;
    ShopName?: string;
    StaffName?: string;
    StaffPosition?: string;
}

/**
 * Interface for the response from the /login and /verify-otp endpoints.
 */
export interface LoginResponse {
    success: boolean;
    message: string;
    user?: UserDetails;
    userId?: string; 
    requiresOTP?: boolean; 
}

/**
 * Interface for the response from password reset endpoints.
 */
export interface GenericAuthResponse {
    success: boolean;
    message: string;
    email?: string; 
}

// =================================================================
// 2. Utility Functions (Maintenance Check)
// =================================================================

const MAINTENANCE_STATUS_ENDPOINT = `${API_URL}/admin/config/maintenance-status`;

/**
 * Checks the maintenance status by fetching the status from the backend.
 * This is designed to be called on page load in index.tsx to gate the app.
 * * @returns {Promise<boolean>} True if maintenance is active or status is undeterminable (network error), False otherwise.
 */
async function checkMaintenanceStatus(): Promise<boolean> {
    try {
        const response = await fetch(MAINTENANCE_STATUS_ENDPOINT);
        
        // 1. If response is NOT ok (e.g., 503, 500, 403, 404), maintenance is assumed ON (Fail-Safe).
        if (!response.ok) {
            // Maintenance is active or server is critically failing. Block access.
            return true; 
        }

        // 2. If status is 200 OK, check the JSON body for the explicit flag (Admin Style).
        try {
            const data = await response.json();
            if (typeof data.maintenanceMode === 'boolean' && data.maintenanceMode === true) {
                 return true; // Maintenance is ACTIVE (Confirmed by JSON)
            }
        } catch (e) {
            // If parsing fails but status was 200, assume OFF to be safe
        }
        
        return false; // Maintenance is INACTIVE
        
    } catch (error: any) {
        // 3. Network error (server unreachable) -> fail-safe block.
        // For a non-admin user, if we can't confirm it's ON, we treat it as ON to prevent data failure.
        return true; 
    }
}


// =================================================================
// 3. Authentication Functions
// =================================================================

/**
 * Handles initial email/password login.
 * The maintenance check is handled by index.tsx before this function is called.
 */
export async function handleUserLogin(
    email: string,
    password: string
): Promise<LoginResponse> {
    
    // NOTE: Maintenance check removed here.
    
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
 * Verifies the OTP sent to the Customer's email. (UNCHANGED)
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
 * Initiates the Forgot Password flow, which sends an OTP to the user's email. (UNCHANGED)
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
 * Completes the Password Reset process after OTP verification. (UNCHANGED)
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
 * Handles the Google OAuth login/signup flow.
 */
export async function googleLogin(
    google_id: string,
    email: string,
    name: string,
    picture: string
): Promise<LoginResponse> {
    
    // NOTE: Maintenance check removed here.

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

// Export the function so index.tsx can use it.
export { checkMaintenanceStatus };