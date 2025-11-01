// index.tsx 
import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
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

// 🔑 NEW: Import authentication functions
import { handleUserLogin, googleLogin } from "@/lib/auth"; 

WebBrowser.maybeCompleteAuthSession();

export default function Index() {
  const [identifier, setIdentifier] = useState(""); // phone or email
  const [password, setPassword] = useState("");
  const router = useRouter();

  const redirectUri = AuthSession.makeRedirectUri({});
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "323428340651-rprfrcvs3cqtrjtrdrj4ffh8u2ikjn3d.apps.googleusercontent.com",
    webClientId: "323428340651-rprfrcvs3cqtrjtrdrj4ffh8u2ikjn3d.apps.googleusercontent.com",
    redirectUri,
  });

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
        // This catch should generally not be hit if googleLogin throws on non-success, 
        // but included for robust error handling.
        Alert.alert("Error", data.message || "Failed to verify your Google account.");
      }
    } catch (error: any) {
      console.error("Google login error:", error.message);
      Alert.alert("Error", error.message || "Failed to sign in with Google. Please try again.");
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
    
    // 🔍 CONSOLE LOGS ADDED (Simplified since the logic is now in lib/auth.ts)
    console.log("-----------------------------------------");
    console.log("Attempting Login...");
    console.log("-----------------------------------------");

    try {
      // 🔑 NEW: Call the centralized handleUserLogin function
      const data = await handleUserLogin(identifier, password); 
      
      // 🔍 CONSOLE LOGS ADDED
      console.log("Response Body (data):", data);

      if (data.success && data.requiresOTP && data.userId) {
        // Customer login flow: Redirect to OTP verification
        console.log(`Login Success! Redirecting to Verify for UserID: ${data.userId}`);
        router.push({ pathname: "/Verify", params: { userId: String(data.userId) } });
      } else if (data.success && data.user) {
        // Direct login flow (Staff, Owner, Admin): Save user and redirect to homepage
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        router.replace("/homepage/homepage");
      } else {
        // Should catch cases where success is true but something is missing, though handleUserLogin should generally handle errors
        Alert.alert("Error", data.message || "Could not complete login flow. Please try again.");
      }
    } catch (error: any) {
      // Catch network errors or errors thrown by handleUserLogin
      console.log("-----------------------------------------");
      console.error("❌ Login error:", error.message);
      console.log("-----------------------------------------");
      Alert.alert("Login Failed", error.message || "Something went wrong during login. Please check your credentials.");
    }
  };

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