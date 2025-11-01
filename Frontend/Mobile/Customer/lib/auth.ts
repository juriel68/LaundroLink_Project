// lib/auth.ts

import { API_URL } from "./api"; // Assuming './api' exports API_URL

// =================================================================
// 1. Types for Authentication
// =================================================================

/**
 * Interface for the detailed user object returned upon successful login
 * (for direct logins and post-OTP verification).
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
  userId?: string; // Used specifically for the initial login response requiring OTP
  requiresOTP?: boolean; // Used specifically for the initial login response
}

/**
 * Interface for the response from password reset endpoints.
 */
export interface GenericAuthResponse {
  success: boolean;
  message: string;
  email?: string; // Used in forgot-password for confirmation
}

// =================================================================
// 2. Authentication Functions
// =================================================================

/**
 * Handles initial email/password login.
 * The backend determines if an OTP is required (for Customers) or if login is direct.
 * * @param email The user's email or phone number (aliased to 'email' in the frontend payload).
 * @param password The user's password.
 * @returns A promise that resolves to the LoginResponse object.
 */
export async function handleUserLogin(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // **CRITICAL FIX**: Ensuring the payload key is 'email' to match backend destructuring
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
 * Verifies the OTP sent to the Customer's email.
 * * @param userId The ID of the user who initiated the OTP process.
 * @param otp The 6-digit code entered by the user.
 * @returns A promise that resolves to the LoginResponse object with the full user details.
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
    // 400 status likely means Invalid or expired OTP.
    throw new Error(data.message || 'OTP verification failed.');
  }

  return data;
}

/**
 * Initiates the Forgot Password flow, which sends an OTP to the user's email.
 * * @param email The email address for which the password reset is requested.
 * @returns A promise that resolves to a GenericAuthResponse.
 */
export async function initiateForgotPassword(
  email: string
): Promise<GenericAuthResponse> {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email }), // Backend expects 'identifier' here
  });

  const data: GenericAuthResponse = await response.json();
  
  // The backend intentionally returns 200/success: true even if the user isn't found
  // to avoid enumerating users. We just ensure we got a response body.
  if (response.ok) {
    return data;
  }
  
  throw new Error(data.message || 'Failed to initiate password reset.');
}

/**
 * Completes the Password Reset process after OTP verification.
 * * @param email The user's email.
 * @param otp The verification code.
 * @param newPassword The new password to set.
 * @returns A promise that resolves to a GenericAuthResponse.
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
 * * @param google_id The unique ID from Google.
 * @param email The email from Google.
 * @param name The full name from Google.
 * @param picture The profile picture URL from Google.
 * @returns A promise that resolves to the LoginResponse object with full user details.
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

  const data: LoginResponse = await response.json();

  if (!response.ok && !data.success) {
    throw new Error(data.message || 'Google login failed.');
  }

  return data;
}