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
    ActivityIndicator
} from "react-native";

import { handleUserLogin, googleLogin, checkMaintenanceStatus, UserDetails } from "@/lib/auth"; 

WebBrowser.maybeCompleteAuthSession();

// --- Utility function to handle error alerting ---
const alertError = (error: any, defaultMessage: string, router: Router) => {
    let message = error?.message || defaultMessage;
    if (message.startsWith('MAINTENANCE_ACTIVE:')) {
        message = message.replace(/^MAINTENANCE_ACTIVE:\s*/, '');
        Alert.alert("Maintenance Mode", message, [
            { text: "View Status", onPress: () => router.replace("/maintenance") },
            { text: "Close", style: 'cancel' }
        ]);
    } else {
        Alert.alert("Login Failed", message);
    }
};

export default function Index() {
    const [identifier, setIdentifier] = useState(""); 
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(true); 
    const router = useRouter(); 

    const redirectUri = AuthSession.makeRedirectUri({});
    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: "323428340651-rprfrcvs3cqtrjtrdrj4ffh8u2ikjn3d.apps.googleusercontent.com",
        webClientId: "323428340651-rprfrcvs3cqtrjtrdrj4ffh8u2ikjn3d.apps.googleusercontent.com",
        redirectUri,
    });

    // 1. Page Load: Check Maintenance & Existing Session
    useEffect(() => {
        const initializeApp = async () => {
            const isMaintenanceActive = await checkMaintenanceStatus();
            if (isMaintenanceActive) {
                router.replace("/maintenance");
                return;
            }

            // Check for existing, valid session
            const userJson = await AsyncStorage.getItem('user');
            if (userJson) {
                try {
                    const user = JSON.parse(userJson);
                    // If session exists and profile is complete, go home.
                    if (user.phone && user.address && user.hasPassword !== false) {
                        router.replace("/homepage/homepage");
                    } else {
                        // If incomplete, clear session and show login (so they can go through verification again)
                        await AsyncStorage.removeItem('user');
                        setIsLoading(false);
                    }
                } catch (e) {
                    await AsyncStorage.removeItem('user');
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };

        initializeApp();
    }, []); 

    // 2. Google Login Handler
    const getUserInfo = async (token: string) => {
        setIsLoading(true);
        try {
            const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const user = await res.json();
            
            // Call Backend
            const data = await googleLogin(
                user.sub,
                user.email,
                user.name,
                user.picture
            );

            // 🟢 GOOGLE FLOW -> VERIFY
            if (data.success && data.requiresOTP && data.userId) {
                console.log(`Google Login Valid. Redirecting to Verify for UserID: ${data.userId}`);
                router.push({ 
                    pathname: "/Verify", 
                    params: { userId: String(data.userId) } 
                });
            } 
            // Fallback for existing users if backend decides no OTP needed (optional safety)
            else if (data.success && data.user) {
                await AsyncStorage.setItem('user', JSON.stringify(data.user));
                router.replace("/homepage/homepage");
            } else {
                Alert.alert("Error", data.message || "Failed to verify your Google account.");
            }
        } catch (error: any) {
            console.error("Google login error:", error.message);
            alertError(error, "Failed to sign in with Google.", router);
        } finally {
            setIsLoading(false);
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

    // 3. Manual Login Handler
    const handleLogin = async () => {
        if (!identifier) {
            Alert.alert("Missing Field", "Please enter your phone or email.");
            return;
        }
        
        // Allow empty password if it's a Google Account logging in manually
        
        setIsLoading(true);

        try {
            const data = await handleUserLogin(identifier, password); 
            
            // 🟢 MANUAL FLOW -> VERIFY
            if (data.success && data.requiresOTP && data.userId) {
                console.log(`Manual Login Valid. Redirecting to Verify for UserID: ${data.userId}`);
                router.push({ 
                    pathname: "/Verify", 
                    params: { userId: String(data.userId) } 
                });
            } 
            // Standard Password Login (Direct)
            else if (data.success && data.user) {
                await AsyncStorage.setItem('user', JSON.stringify(data.user));
                
                // Check profile completeness for standard users
                if (!data.user.phone || !data.user.address) {
                    router.replace({ pathname: "/SetupProfile", params: { userId: data.user.UserID } });
                } else {
                    router.replace("/homepage/homepage");
                }
            } else {
                Alert.alert("Error", data.message || "Could not complete login flow.");
            }
        } catch (error: any) {
            console.error("❌ Login error:", error.message);
            alertError(error, "Something went wrong during login.", router);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isLoading) {
        return (
            <View style={[styles.container, {backgroundColor: '#89CFF0'}]}>
                <ActivityIndicator size="large" color="#003366" />
                <Text style={{color: '#003366', marginTop: 10}}>Loading...</Text>
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
            <Text style={styles.orText}>────────  or  ────────</Text>
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