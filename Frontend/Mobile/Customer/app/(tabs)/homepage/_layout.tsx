import { Stack } from "expo-router";

export default function HomeStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="search_laundry" />
      <Stack.Screen name="about_laundry" />
      <Stack.Screen name="avail_services" />
      <Stack.Screen name="laundry_details" />
      <Stack.Screen name="df_payment" />
      <Stack.Screen name="order_summary" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}