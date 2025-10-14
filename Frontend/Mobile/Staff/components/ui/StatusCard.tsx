import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

type Props = {
  icon: keyof typeof Ionicons.glyphMap; // ✅ strong typing
  label: string;
  count: number;
  color: string;
};

export default function StatusCard({ icon, label, count, color }: Props) {
  return (
    <View style={[styles.card, { borderColor: color }]}>
      <Ionicons name={icon} size={32} color={color} style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.count, { color }]}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
  backgroundColor: "#fff",
  paddingVertical: 10, // reduced padding
  paddingHorizontal: 6,
  borderRadius: 10,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 2,
  minHeight: 110, // smaller height so 4 fit nicely
},
icon: {
  marginBottom: 4,
},
label: {
  fontSize: 11,  // smaller text
  fontWeight: "600",
  marginBottom: 2,
  textAlign: "center",
},
count: {
  fontSize: 14,
  fontWeight: "bold",
},
});
