import { Stack } from "expo-router";
import { LogBox } from "react-native";

LogBox.ignoreAllLogs(true); // Ignore all log notifications

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Login" }} />
      <Stack.Screen name="SignUp" options={{ title: "Sign-Up" }} />
      <Stack.Screen name="Verify" options={{ title: "Verify" }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{}} />
      <Stack.Screen name="maintenance" options={{ headerShown: false }} />
      <Stack.Screen name="SetupProfile" options={{ title: "Setup Profile" }} />
      <Stack.Screen name="ResetPassword" options={{ title: "Setup Profile" }} />
    </Stack>
  );
}