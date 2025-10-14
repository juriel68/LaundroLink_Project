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


import { API_URL } from "@/lib/api"; 

WebBrowser.maybeCompleteAuthSession();

// Define the custom scheme based on app.json (scheme: "laundrolink")
const CUSTOM_SCHEME = "laundrolink"; 

export default function Index() {
  const [identifier, setIdentifier] = useState(""); // phone or email
  const [password, setPassword] = useState("");
  const router = useRouter();
  
  // --- Google Login Configuration (KEPT FOR REFERENCE, BUT NOT USED IN UI) ---
  const redirectUri = AuthSession.makeRedirectUri({
      scheme: CUSTOM_SCHEME,
  });
  
  const NEW_CLIENT_ID = "1081740803907-vvm4k23h45jvpdi2rmvk01po4671e7g.apps.googleusercontent.com"; 
  
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: NEW_CLIENT_ID, 
    webClientId: NEW_CLIENT_ID,
    redirectUri: redirectUri, 
  });
  
  // Note: useEffect and getUserInfo are kept for completeness but won't trigger 
  // as the promptAsync function (used by the button) is commented out below.
  const getUserInfo = async (token: string) => { /* ... Google logic ... */ };
  useEffect(() => { /* ... response handler ... */ }, [response]);
  // --- END Google Login Configuration ---

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert("Missing Fields", "Please enter your phone/email and password.");
      return;
    }
    try {
      // Use API_URL for Standard Login
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Login Failed", data.message || "Invalid credentials");
        return;
      }
      
      // Assuming your backend returns 'success' and 'userId' on successful login
      // and handles any necessary session/token creation.
      if (data.success && data.userId) {
        // If your backend also returns a user object or token, you should store it here:
        // await AsyncStorage.setItem('user', JSON.stringify(data.user)); 
        
        // The original code routes to /Verify, so we keep that path.
        router.push({ pathname: "/Verify", params: { userId: String(data.userId) } });
      } else {
        Alert.alert("Error", "Could not initiate login. Please try again.");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      Alert.alert("Error", "Something went wrong during login. Check your API_URL and server connection.");
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
      
      {/*         COMMENTED OUT THE GOOGLE LOGIN SECTION TO BYPASS CURRENT ISSUES
        To re-enable, uncomment all lines below (including the <Text> and the <TouchableOpacity>)
      */}
      {/* <Text style={styles.orText}>────────  or  ────────</Text>
      <TouchableOpacity
        style={styles.socialButton}
        disabled={!request}
        onPress={() => promptAsync()}
      >
        <AntDesign name="google" size={20} color="#DB4437" style={{ marginRight: 8 }} />
        <Text style={styles.socialText}>Continue with Google</Text>
      </TouchableOpacity> */}
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