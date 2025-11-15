// index.tsx (Customer) - FULL CODE WITH PAGE LOAD MAINTENANCE CHECK

import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { useRouter, Router } from "expo-router"; 
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// 🔑 Import authentication functions AND the checkMaintenanceStatus function
import { handleUserLogin, googleLogin, checkMaintenanceStatus } from "@/lib/auth"; 

WebBrowser.maybeCompleteAuthSession();

// --- Utility function to handle error alerting and maintenance redirection ---
/**
 * Handles errors, checks for the MAINTENANCE_ACTIVE prefix, and redirects if necessary.
 * Note: This function primarily handles errors caught during the login attempt.
 * The page load check (useEffect) handles the initial redirect.
 */
const alertError = (error: any, defaultMessage: string, router: Router) => {
    // Safely access error message
    let message = error?.message || defaultMessage;
    
    // Check for the error thrown by auth.ts if maintenance is active
    if (message.startsWith('MAINTENANCE_ACTIVE:')) {
        // strip the prefix
        message = message.replace(/^MAINTENANCE_ACTIVE:\s*/, '');
        
        Alert.alert("Maintenance Mode", message, [
            {
                text: "View Status",
                onPress: () => {
                    // Navigate to maintenance screen
                    router.replace("/maintenance"); 
                }
            },
            {
                text: "Close App",
                onPress: () => { /* Add logic to close the app if necessary */ },
                style: 'cancel',
            }
        ]);
    } else {
        // Handle normal errors (e.g., invalid password)
        Alert.alert("Login Failed", message);
    }
};
// --- End Utility Function ---


export default function Index() {
    const [identifier, setIdentifier] = useState(""); 
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(true); // State to gate render during status check
    const router = useRouter(); 

    const redirectUri = AuthSession.makeRedirectUri({});
    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: "323428340651-rprfrcvs3cqtrjtrdrj4ffh8u2ikjn3d.apps.googleusercontent.com",
        webClientId: "323428340651-rprfrcvs3cqtrjtrdrj4ffh8u2ikjn3d.apps.googleusercontent.com",
        redirectUri,
    });

    // 🚀 CRITICAL FIX: Page Load Maintenance Gating Check
    useEffect(() => {
        const checkStatusAndRedirect = async () => {
            // checkMaintenanceStatus returns true if maintenance is ON or unconfirmable
            const isMaintenanceActive = await checkMaintenanceStatus();
            
            if (isMaintenanceActive) {
                // If maintenance is active, immediately redirect to the maintenance page
                router.replace("/maintenance");
            } else {
                // System is operational, allow form rendering
                setIsLoading(false);
            }
        };

        checkStatusAndRedirect();
    }, []); 
    // --- End Page Load Gating Check ---


    const getUserInfo = async (token: string) => {
        try {
            // 1. Get user info from Google
            const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const user = await res.json();
            
            // 2. Use googleLogin utility function
            const data = await googleLogin(
                user.sub,
                user.email,
                user.name,
                user.picture
            );

            if (data.success && data.user) {
                await AsyncStorage.setItem('user', JSON.stringify(data.user));
                router.replace("/homepage/homepage");
            } else {
                Alert.alert("Error", data.message || "Failed to verify your Google account.");
            }
        } catch (error: any) {
            console.error("Google login error:", error.message);
            alertError(error, "Failed to sign in with Google. Please try again.", router);
        }
    };

    useEffect(() => {
        if (response?.type === "success") {
            const { authentication } = response;
            if (authentication?.accessToken) {
                getUserInfo(authentication.accessToken);
            }
        }
    }, [response]);

    const handleLogin = async () => {
        if (!identifier || !password) {
            Alert.alert("Missing Fields", "Please enter your phone/email and password.");
            return;
        }
        
        console.log("-----------------------------------------");
        console.log("Attempting Login...");
        console.log("-----------------------------------------");

        try {
            // Call the centralized handleUserLogin function 
            const data = await handleUserLogin(identifier, password); 
            
            console.log("Response Body (data):", data);

            if (data.success && data.requiresOTP && data.userId) {
                // Customer login flow: Redirect to OTP verification
                console.log(`Login Success! Redirecting to Verify for UserID: ${data.userId}`);
                router.push({ pathname: "/Verify", params: { userId: String(data.userId) } });
            } else if (data.success && data.user) {
                // Direct login flow: Save user and redirect to homepage
                await AsyncStorage.setItem('user', JSON.stringify(data.user));
                router.replace("/homepage/homepage");
            } else {
                Alert.alert("Error", data.message || "Could not complete login flow. Please try again.");
            }
        } catch (error: any) {
            console.log("-----------------------------------------");
            console.error("❌ Login error:", error.message);
            console.log("-----------------------------------------");
            alertError(error, "Something went wrong during login. Please check your credentials.", router);
        }
    };
    
    // Show loading spinner or blank screen while checking maintenance status
    if (isLoading) {
        return (
            <View style={[styles.container, {backgroundColor: '#fff'}]}>
                <Text style={{color: '#003366', fontSize: 20}}>Checking App Status...</Text>
            </View>
        );
    }


    return (
        <View style={styles.container}>
            <Text style={styles.title}>LaundroLink</Text>
            <TextInput
                style={styles.input}
                placeholder="Phone or Email"
                placeholderTextColor="#aaa"
                keyboardType="default"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#aaa"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.forgotButton}
                onPress={() => router.push("/ResetPassword")}
            >
                <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
            <Text style={styles.orText}>────────  or  ────────</Text>
            <TouchableOpacity
                style={styles.socialButton}
                disabled={!request}
                onPress={() => promptAsync()}
            >
                <AntDesign name="google" size={20} color="#DB4437" style={{ marginRight: 8 }} />
                <Text style={styles.socialText}>Continue with Google</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#89CFF0", alignItems: "center", justifyContent: "center", padding: 20 },
    title: { fontSize: 28, fontWeight: "bold", color: "#003366", marginBottom: 30 },
    input: { width: "100%", backgroundColor: "#fff", borderRadius: 6, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: "#ddd" },
    button: { width: "100%", backgroundColor: "#004080", padding: 15, borderRadius: 6, alignItems: "center", marginVertical: 10 },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
    forgotButton: { alignSelf: "flex-end", marginBottom: 20 },
    forgotText: { color: "#003366", fontSize: 14, textDecorationLine: "underline" },
    orText: { marginVertical: 20, color: "#7f8c8d", fontSize: 14 },
    socialButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", width: "100%", height: 50, borderRadius: 12, borderWidth: 1, borderColor: "#ddd", backgroundColor: "#fff", marginBottom: 15 },
    socialText: { fontSize: 16, fontWeight: "500", color: "#2c3e50" },
});