import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Tabs, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

// Custom Tab Bar Button with a press animation
const AnimatedTabBarButton = (props: BottomTabBarButtonProps) => {
  // ✅ FIX: Destructure only the props needed by Pressable
  // Avoid spreading {...rest} which causes the type conflict.
  const { children, onPress, style, accessibilityState } = props;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    // ✅ FIX: Apply the navigator's style and accessibility state directly
    <Pressable
      accessibilityState={accessibilityState}
      onPressIn={() => (scale.value = withTiming(0.9, { duration: 150 }))}
      onPressOut={() => (scale.value = withTiming(1, { duration: 150 }))}
      onPress={onPress}
      // Combine styles from the navigator and the component
      style={[styles.tabBarButton, style]}
    >
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
};


export default function TabLayout() {
  const { shopId, userId } = useLocalSearchParams();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#4FC3F7", // A bright, lively blue to match the header
        tabBarInactiveTintColor: "#9E9E9E", // A neutral gray
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0, // Remove the default border for a cleaner look
          height: 65,
          paddingBottom: 10,
          paddingTop: 5,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.05,
          shadowRadius: 3.84,
          elevation: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        initialParams={{ shopId, userId }} 
        options={{
          title: "Home",
          tabBarButton: AnimatedTabBarButton, // Use custom animated button
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="order"
        initialParams={{ shopId, userId }} 
        options={{
          title: "Order",
          tabBarButton: AnimatedTabBarButton, // Use custom animated button
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "list-sharp" : "list-outline"} size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="message"
        initialParams={{ shopId, userId }}
        options={{
          title: "Messages",
          tabBarButton: AnimatedTabBarButton, // Use custom animated button
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "chatbubbles" : "chatbubbles-outline"} size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
    tabBarButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
