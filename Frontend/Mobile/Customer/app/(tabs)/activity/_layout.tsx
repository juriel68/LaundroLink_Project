import { Stack } from "expo-router";

export default function ActivityStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="order_details" /> 
      <Stack.Screen name="receipt" />
      <Stack.Screen name="track_order"/>
    </Stack>
  );
}