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

// 🔑 NEW: Import the OTP verification function
import { verifyUserOTP } from "@/lib/auth";

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
      // 🎯 MODIFIED: Using the centralized utility function
      const data = await verifyUserOTP(userId, otp);

      if (data.success && data.user) {
        Alert.alert("Login Successful", "OTP verified. Welcome back!");
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        router.replace("/homepage/homepage");
      } else {
        // This line catches cases where the utility didn't throw an error 
        // (which is less likely but possible if API behavior changes)
        Alert.alert("Verification Failed", data.message || "Invalid or expired OTP. Please try again.");
      }
    } catch (error: any) {
      // Catch network errors or errors thrown by verifyUserOTP
      console.error("❌ OTP verification error:", error.message);
      Alert.alert("Verification Failed", error.message || "Could not connect to the server.");
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