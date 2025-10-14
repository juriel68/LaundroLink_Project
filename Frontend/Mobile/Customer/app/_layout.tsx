import { Stack } from "expo-router";
import { LogBox } from "react-native";

LogBox.ignoreAllLogs(true); // Ignore all log notifications

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Login" , headerShown: false}} />
      <Stack.Screen name="SignUp" options={{ title: "Sign-Up" }} />
      <Stack.Screen name="Verify" options={{ title: "Verify" }} />
      <Stack.Screen name="editProfile" options={{ title: "Profile" }} />
      <Stack.Screen name="ForgotPassword" options={{ title: "Forgot Password" }} />
      <Stack.Screen name="ResetPassword" options={{ title: "Reset Password" }} />

      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{}} />
    </Stack>
  );
}