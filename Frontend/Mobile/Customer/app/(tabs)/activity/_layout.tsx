import { Stack } from "expo-router";

export default function ActivityStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="activity" options={{ headerShown: false}}/>
      <Stack.Screen name="order_details" options={{ headerShown: false}}/> 
      <Stack.Screen name="receipt" options={{ headerShown: false}}/>
      <Stack.Screen name="track_order" options={{ headerShown: false}}/>

    </Stack>
  );
}