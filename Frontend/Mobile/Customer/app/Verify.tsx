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
import { verifyUserOTP } from "@/lib/auth";

export default function Verify() {
  // 1. Get UserID from navigation params
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();

  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    // 2. Validate userId existence
    if (!userId) {
      Alert.alert("Error", "Missing User ID. Please go back and log in again.");
      router.replace("/");
      return;
    }

    if (!otp || otp.length !== 6) {
      Alert.alert("Missing OTP", "Please enter the 6-digit OTP.");
      return;
    }
    
    setIsLoading(true);
    try {
      // 3. Call Backend to Verify
      const data = await verifyUserOTP(userId, otp);

      if (data.success && data.user) {
        // 4. Save Session
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        
        // 5. CHECK PROFILE COMPLETENESS
        // If Phone OR Address is missing, OR Password is not set (for Google users)
        if (!data.user.phone || !data.user.address || data.user.hasPassword === false) {
             console.log("Profile incomplete. Redirecting to SetupProfile...");
             router.replace({ 
                 pathname: "/SetupProfile", 
                 params: { userId: data.user.UserID } 
             });
        } else {
             console.log("Profile complete. Redirecting to Homepage...");
             router.replace("/homepage/homepage");
        }

      } else {
        Alert.alert("Verification Failed", data.message || "Invalid OTP.");
      }
    } catch (error: any) {
      console.error("OTP Error:", error.message);
      Alert.alert("Error", error.message || "Connection failed.");
    } finally {
      setIsLoading(false);
    }
  };

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
      <Text style={styles.subtitle}>Enter the 6-digit code sent to your email.</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter 6-digit OTP"
        placeholderTextColor="#aaa"
        keyboardType="number-pad"
        value={otp}
        onChangeText={setOtp}
        maxLength={6}
        editable={!isLoading} 
      />

      <TouchableOpacity 
        style={[styles.button, isLoading && styles.buttonDisabled]} 
        onPress={handleVerify}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>VERIFY</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#89CFF0", alignItems: "center", justifyContent: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#003366", marginBottom: 10 },
  subtitle: { color: "#003366", fontSize: 16, marginBottom: 30, textAlign: 'center' },
  input: { width: "100%", backgroundColor: "#fff", borderRadius: 6, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: "#ddd", textAlign: "center", fontSize: 24, letterSpacing: 8, fontWeight: 'bold'},
  button: { width: "100%", backgroundColor: "#004080", padding: 15, borderRadius: 6, alignItems: "center", marginVertical: 10 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  loadingText: { color: '#fff', marginTop: 10, fontSize: 16 }
});