import { Stack } from "expo-router";

export default function MessageLayout() {
  return (
    <Stack>
      <Stack.Screen name="message" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
    </Stack>
  );
}
