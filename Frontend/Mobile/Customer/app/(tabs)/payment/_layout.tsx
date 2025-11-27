import { Stack } from "expo-router";

export default function PaymentStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="pay" />
      <Stack.Screen name="receipt" />
      <Stack.Screen name="invoice" />
    </Stack>
  );
}