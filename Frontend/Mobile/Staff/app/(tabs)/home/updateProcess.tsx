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


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f6fb", 
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    margin: 18,
    borderRadius: 16,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginBottom: 10,
  },
  currentStatus: {
    fontSize: 15,
    color: "#007bff",
    fontWeight: "600",
    marginBottom: 22,
    fontStyle: "italic",
    textAlign: "center",
  },
  option: {
    backgroundColor: "#eef2f6",
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#dde3ea",
    alignItems: "center",
    transition: "0.2s",
  },
  selected: {
    backgroundColor: "#0D47A1",
    borderColor: "#007bff",
    shadowColor: "#007bff",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  optionText: {
    color: "#2c3e50",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  optionTextSelected: {
    color: "#fff",
  },
  saveButton: {
    backgroundColor: "#35B412",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 28,
    shadowColor: "#28a745",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  saveText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
    letterSpacing: 0.5,
  },
});
