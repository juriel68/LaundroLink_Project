// updateProcess.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { updateProcessStatus } from "@/lib/orders";
import Header from "@/components/Header";

const statusOptions = ["Washed", "Dry", "Steam Pressed/Ironed", "Folded", "Out for Delivery"];

const statusFlow: Record<string, string | null> = {
  Washed: null,
  Dry: "Washed",
  "Steam Pressed/Ironed": "Dry",
  Folded: "Steam Pressed/Ironed",
  "Out for Delivery": "Folded",
};

export default function UpdateProcess() {
  const { orderId, customer, currentStatus } = useLocalSearchParams<{
    orderId: string;
    customer: string;
    currentStatus?: string;
  }>();

  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const router = useRouter();

  const handleSave = async () => {
    if (!selectedStatus) {
      Alert.alert("Please select a status");
      return;
    }

    if (selectedStatus === currentStatus) {
      Alert.alert("Already Updated", `This order is already marked as "${currentStatus}".`);
      return;
    }
    
    const requiredPrev = statusFlow[selectedStatus];
    const latestStatus = currentStatus || null;
    if (requiredPrev && latestStatus !== requiredPrev) {
      Alert.alert(
        "Invalid Step",
        `You must mark the order as "${requiredPrev}" before moving to "${selectedStatus}".`
      );
      return;
    }

    const success = await updateProcessStatus(orderId, selectedStatus);
    if (success) {
      router.back();
    } else {
      Alert.alert("Error", "Failed to update status.");
    }
  };
  
  return (
    <View style={styles.container}>
      <Header title="Update Laundry Process" />
      <View style={styles.card}>
        <Text style={styles.title}>Order #{orderId}</Text>
        <Text style={styles.subtitle}>Customer: {customer}</Text>
        <Text style={styles.currentStatus}>
          Current Step: {currentStatus || "Not Started"}
        </Text>

        {statusOptions.map((status) => (
          // This component now doesn't need the complex disabling logic,
          // as the save button's logic handles the validation.
          <TouchableOpacity
            key={status}
            style={[styles.option, selectedStatus === status && styles.selected]}
            onPress={() => setSelectedStatus(status)}
          >
            <Text
              style={[
                styles.optionText,
                selectedStatus === status && styles.optionTextSelected,
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Your existing styles for this component
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa" },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#555", marginBottom: 12 },
  currentStatus: { fontSize: 15, color: "blue", fontWeight: "600", marginBottom: 20, fontStyle: 'italic' },
  option: {
    backgroundColor: "#e9ecef",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  selected: { backgroundColor: "#007bff" },
  optionText: { color: "#333", fontSize: 16, fontWeight: "600" },
  optionTextSelected: { color: "#fff" },
  saveButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  saveText: { color: "#fff", fontWeight: "bold" },
});