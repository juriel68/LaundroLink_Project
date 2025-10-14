// editWeight.tsx
import { updateOrderWeight } from "@/lib/orders";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, } from "react-native"; // ✅ Import Alert for error messages

import Header from "@/components/Header";

export default function EditWeight() {
  const router = useRouter();
  const { orderId, prevWeight } = useLocalSearchParams();

  const [weight, setWeight] = useState(prevWeight ? String(prevWeight) : "");
  const [successMsg, setSuccessMsg] = useState("");

  const handleUpdate = async () => {
    if (!orderId || !weight) return;

    // ✅ Call the API and check if it was successful
    const success = await updateOrderWeight(String(orderId), parseFloat(weight));

    if (success) {
      setSuccessMsg(`Laundry weight has been updated to ${weight} kg.`);
      // Go back after a short delay
      setTimeout(() => router.back(), 1500);
    } else {
      // ✅ Show an error message if the update failed
      Alert.alert("Error", "Failed to update weight. Please try again.");
    }
  };
  
  return (
    <View style={styles.container}>
      <Header title="Edit Laundry Weight" />

      <View style={styles.centerWrapper}>
        <View style={styles.card}>
          {/* Old Weight */}
          <Text style={styles.oldLabel}>Previous Weight</Text>
          <Text style={styles.oldValue}>{prevWeight} kg</Text>

          {/* Input */}
          <Text style={styles.inputLabel}>New Weight</Text>
          <View style={styles.inputBox}>
            <TextInput
              style={styles.input}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholder="Enter new weight"
            />
            <Text style={styles.unit}>kg</Text>
          </View>

          {/* Update button */}
          <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate}>
            <Text style={styles.updateText}>Update</Text>
          </TouchableOpacity>

          {/* Success message */}
          {successMsg ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fb" },

  centerWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  card: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },

  oldLabel: {
    fontSize: 14,
    color: "#777",
    marginBottom: 6,
  },
  oldValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#888",
    marginBottom: 20,
  },

  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#ccc",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 28,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    textAlign: "center",
  },
  unit: { fontSize: 20, fontWeight: "700", marginLeft: 6, color: "#555" },

  updateBtn: {
    backgroundColor: "#4da6ff",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  updateText: { color: "#fff", fontWeight: "700", fontSize: 18 },

  successBox: {
    backgroundColor: "#e6f9f0",
    borderRadius: 10,
    padding: 14,
  },
  successText: {
    color: "#2e7d32",
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
});
