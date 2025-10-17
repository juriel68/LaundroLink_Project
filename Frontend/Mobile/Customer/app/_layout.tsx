import { Stack } from "expo-router";
import { LogBox } from "react-native";

LogBox.ignoreAllLogs(true); // Ignore all log notifications

export default function RootLayout() {
  return (
    <Stack>
      {/* Authentication & Entry Screens */}
      <Stack.Screen name="index" options={{ title: "Login" }} />
      <Stack.Screen name="SignUp" options={{ title: "Sign Up" }} />
      <Stack.Screen name="Verify" options={{ title: "Verify Account" }} />
      
      {/* Password Management Screens */}
      <Stack.Screen name="ForgotPassword" options={{ title: "Forgot Password" }} />
      <Stack.Screen name="ResetPassword" options={{ title: "Reset Password" }} />

      {/* Success & Profile Screens */}
      <Stack.Screen name="profile-success" options={{ title: "Profile Created" }} />
      <Stack.Screen name="editProfile" options={{ title: "Edit Profile" }} />

      {/* Tab Navigator (Main App Content) */}
      {/* This loads the app/(tabs)/_layout.tsx file */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Not Found Screen - Handles bad URLs/routes */}
      <Stack.Screen name="+not-found" options={{}} />
    </Stack>
  );
}
