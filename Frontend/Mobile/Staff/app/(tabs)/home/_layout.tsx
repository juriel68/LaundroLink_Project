import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="orderDetail" options={{ headerShown: false }} />
      <Stack.Screen name="pending" options={{ headerShown: false }} />
      <Stack.Screen name="processing" options={{ headerShown: false }} />
      <Stack.Screen name="completed" options={{ headerShown: false }} />
      <Stack.Screen name="forDelivery" options={{ headerShown: false }} />
      <Stack.Screen name="rejected" options={{ headerShown: false }} />
      <Stack.Screen name="rejectMessage" options={{ headerShown: false }} />
      <Stack.Screen name="updateProcess" options={{ headerShown: false }} />
      <Stack.Screen name="editWeight" options={{ headerShown: false }} />
      <Stack.Screen name="confirm_payment" options={{ headerShown: false }} />
    </Stack>
  );
}
