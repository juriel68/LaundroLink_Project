import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="orderDetail" options={{ headerShown: false }} />
      <Stack.Screen name="status" options={{ headerShown: false }} />
      <Stack.Screen name="updateDelivery" options={{ headerShown: false }} />
      <Stack.Screen name="updateProcess" options={{ headerShown: false }} />
      <Stack.Screen name="editWeight" options={{ headerShown: false }} />
    </Stack>
  );
}
