// auth.ts (Staff) - REVISED to use only 'login'

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

// Helper to save the session internally (now the core logic inside 'login')
const saveSession = async (user: UserSession): Promise<void> => {
    console.log("--- auth.ts: saveSession utility executed ---");
    currentUser = user;
    try {
        await AsyncStorage.setItem('user_session', JSON.stringify(user));
        console.log("Successfully saved user to AsyncStorage.");
    } catch (e) {
        console.error("Failed to save user session.", e);
    }
};

/**
 * 🚀 NEW BEHAVIOR: Handles the Staff login API call, saves the session, and returns UserSession data.
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
            
            // Save the session using the internal helper
            await saveSession(userData);
            
            return userData;
        } else {
            // Throw a specific error message for the component to handle
            throw new Error(data.message || "Invalid email or password.");
        }
    } catch (error) {
        // Re-throw network or parsing errors
        console.error("Staff Login API error:", error);
        throw error;
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
            // 💡 LOG: Confirm user loaded from storage
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