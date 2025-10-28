import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// 💡 Import API_URL from the shared configuration
import { API_URL } from "@/lib/api"; 

export default function Verify() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  
  // ✅ Log to confirm ID receipt
  console.log("USER ID RECEIVED ON VERIFY SCREEN:", userId);

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // =================================================================
  // HANDLER: OTP Verification
  // =================================================================

  const handleVerify = async () => {
    if (!userId) {
      Alert.alert("Error", "Missing User ID. Please log in again.");
      router.replace("/"); 
      return;
    }
    if (!otp || otp.length !== 6) {
      Alert.alert("Missing OTP", "Please enter the 6-digit OTP from your email.");
      return;
    }
    
    setIsLoading(true);
    try {
      // 🎯 API Call to verify OTP
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert("Login Successful", "OTP verified. Welcome back!");
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        router.replace("/homepage/homepage");
      } else {
        Alert.alert("Verification Failed", data.message || "Invalid or expired OTP. Please try again.");
      }
    } catch (error) {
      console.error("❌ OTP verification error:", error);
      Alert.alert("Network Error", "Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  // =================================================================
  // RENDER
  // =================================================================

  return (
    <View style={styles.container}>
      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Verifying...</Text>
        </View>
      )}
      
      <Text style={styles.title}>Two-Step Verification</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to your email to complete your login.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter 6-digit OTP"
        placeholderTextColor="#aaa"
        keyboardType="number-pad"
        value={otp}
        onChangeText={setOtp}
        maxLength={6}
        editable={!isLoading} // Disable input while loading
      />

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleVerify}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>VERIFY</Text>
      </TouchableOpacity>
      
      {/* ❌ REMOVED: Resend OTP TouchableOpacity */}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#89CFF0", 
    alignItems: "center", 
    justifyContent: "center", 
    padding: 20 
  },
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    color: "#003366", 
    marginBottom: 10 
  },
  subtitle: { 
    color: "#003366", 
    fontSize: 16, 
    marginBottom: 30, 
    textAlign: 'center' 
  },
  input: { 
    width: "100%", 
    backgroundColor: "#fff", 
    borderRadius: 6, 
    padding: 12, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: "#ddd", 
    textAlign: "center", 
    fontSize: 24, 
    letterSpacing: 8, 
    fontWeight: 'bold',
  },
  button: { 
    width: "100%", 
    backgroundColor: "#004080", 
    padding: 15, 
    borderRadius: 6, 
    alignItems: "center", 
    marginVertical: 10 
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold" 
  },
  // ❌ REMOVED: resendText style
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  }
});