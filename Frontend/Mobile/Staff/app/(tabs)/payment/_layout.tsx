import { Stack } from "expo-router";

export default function PaymentLayout() {
  return (
    <Stack>
      <Stack.Screen name="payment" options={{ headerShown: false }} />
      <Stack.Screen name="laundry_payment" options={{ headerShown: false }} />
      <Stack.Screen name="delivery_payment" options={{ headerShown: false }} />
        <Stack.Screen name="delivery_payment_details" options={{ headerShown: false }} />
    </Stack>
  );
}
