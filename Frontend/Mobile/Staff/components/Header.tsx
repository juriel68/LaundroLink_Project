import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');
const HEADER_HEIGHT = 90; // Approximate height of the safe area header

// --- Bubble Animation Component ---
const Bubble = ({ index }: { index: number }) => {
  const duration = 5000 + Math.random() * 4000; // Slower, more gentle float
  const initialX = Math.random() * screenWidth;
  const size = 5 + Math.random() * 15; // Smaller bubbles

  const progress = useSharedValue(0);

  useEffect(() => {
    // Animate from 0 to 1 over the random duration, and loop
    progress.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1, // Loop indefinitely
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [HEADER_HEIGHT, -size]);
    const opacity = interpolate(progress.value, [0, 0.1, 0.8, 1], [0, 0.8, 0.8, 0]);
    const translateX = interpolate(progress.value, [0, 0.5, 1], [initialX, initialX + (index % 2 === 0 ? -15 : 15), initialX]);

    return {
      transform: [{ translateY }, { translateX }],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.bubble, { width: size, height: size, borderRadius: size / 2 }, animatedStyle]} />
  );
};


// --- Main Header Component ---
interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightActions?: React.ReactNode;
}

export default function Header({
  title,
  showBack = true,
  rightActions,
}: HeaderProps) {
  const router = useRouter();
  
  // More bubbles for a livelier effect
  const bubbles = Array.from({ length: 25 }).map((_, i) => <Bubble key={i} index={i} />);

  return (
    <View style={styles.headerShadow}>
      <LinearGradient
        // Lighter, fresher blue gradient
        colors={['#81D4FA', '#4FC3F7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientContainer}
      >
        <View style={styles.bubblesContainer}>{bubbles}</View>
        
        <SafeAreaView>
          <View style={styles.header}>
            <View style={styles.sideContainer}>
              {showBack && (
                <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
            <View style={styles.sideContainer}>
              {rightActions}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  headerShadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gradientContainer: {
    overflow: 'hidden', // Crucial for containing the bubbles
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  bubblesContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
  },
  bubble: {
      position: 'absolute',
      backgroundColor: 'rgba(255, 255, 255, 0.2)', // Brighter, more visible bubbles
      borderColor: 'rgba(255, 255, 255, 0.3)',
      borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'space-between',
    height: 80,
    paddingHorizontal: 10,
    paddingTop: 30,
    backgroundColor: 'transparent',
  },
  sideContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold", // Use a bolder font for better contrast
    color: "#fff",
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});