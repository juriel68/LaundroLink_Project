import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      {/* Login screen (index.tsx) */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
