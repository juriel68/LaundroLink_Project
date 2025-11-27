import { Stack } from "expo-router";
import { LogBox } from "react-native";

LogBox.ignoreAllLogs(true); // Ignore all log notifications

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index"/>
      <Stack.Screen name="SignUp" />
      <Stack.Screen name="Verify" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" options={{}} />
      <Stack.Screen name="maintenance" />
      <Stack.Screen name="SetupProfile" />
      <Stack.Screen name="ResetPassword" />
    </Stack>
  );
}