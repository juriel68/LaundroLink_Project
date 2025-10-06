import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, SafeAreaView, TextInput, TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { login } from "@/lib/auth";
import { API_URL } from "@/lib/api";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// --- Bubble Animation Component (same as Header) ---
const Bubble = ({ index }: { index: number }) => {
  const duration = 6000 + Math.random() * 5000;
  const initialX = Math.random() * screenWidth;
  const size = 10 + Math.random() * 25;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1, false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [screenHeight, -size]);
    const opacity = interpolate(progress.value, [0, 0.1, 0.8, 1], [0, 0.7, 0.7, 0]);
    const translateX = interpolate(progress.value, [0, 0.5, 1], [initialX, initialX + (index % 2 === 0 ? -40 : 40), initialX]);
    return { transform: [{ translateY }, { translateX }], opacity };
  });

  return (
    <Animated.View style={[styles.bubble, { width: size, height: size, borderRadius: size / 2 }, animatedStyle]} />
  );
};

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  
  // Create an array of bubbles to render
  const bubbles = Array.from({ length: 30 }).map((_, i) => <Bubble key={i} index={i} />);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    // ✅ If user types 'marites', it becomes 'marites@gmail.com'
    // If user types 'marites@gmail.com', it stays the same.
    const finalEmail = email.includes('@') ? email : `${email}@gmail.com`;

    try {
      const res = await fetch(`${API_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: finalEmail, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        await login(data.user);
        // Navigate to the home tab after successful login
        router.replace("/home/home"); 
      } else {
        Alert.alert("Login Failed", data.message || "Invalid email or password.");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Unable to connect to the server.");
    }
  };

  return (
    <LinearGradient
      colors={['#81D4FA', '#4FC3F7']}
      style={styles.background}
    >
      <View style={styles.bubblesContainer}>{bubbles}</View>
      <SafeAreaView style={styles.safeArea}>
        {/* Use KeyboardAvoidingView to prevent keyboard from covering inputs */}
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.contentContainer}
        >
            <View style={styles.titleContainer}>
                <Ionicons name="sparkles" size={40} color="#fff" />
                <Text style={styles.title}>LaundroLink</Text>
            </View>
            <Text style={styles.subtitle}>Welcome Staff! Sign in to continue.</Text>

            <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={22} color="rgba(255, 255, 255, 0.9)" style={styles.inputIcon} />
                <TextInput
                    style={styles.inputField}
                    placeholder="Email or Username"
                    placeholderTextColor="rgba(255, 255, 255, 0.9)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                />
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={22} color="rgba(255, 255, 255, 0.9)" style={styles.inputIcon} />
                <TextInput
                    style={styles.inputField}
                    placeholder="Password"
                    placeholderTextColor="rgba(255, 255, 255, 0.9)"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>Log In</Text>
                <Ionicons name="arrow-forward" size={20} color="#004d7a" />
            </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  bubblesContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
  },
  safeArea: {
      flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  inputIcon: {
      marginRight: 10,
  },
  inputField: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#616161ff',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 6,
  },
  loginButtonText: {
    color: '#004d7a',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});
