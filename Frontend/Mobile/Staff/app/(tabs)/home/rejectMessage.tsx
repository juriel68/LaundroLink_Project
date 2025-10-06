// rejectMessage.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { updateOrderStatus } from "@/lib/orders";
import Header from "@/components/Header";

export default function RejectOrderScreen() {
  const { orderId, customer, shopId } = useLocalSearchParams<{ orderId: string; customer: string; shopId: string}>();
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert("Error", "Please provide a reason for rejection.");
      return;
    }

    const success = await updateOrderStatus(orderId, "Rejected", reason, note);

    if (success) {
      router.replace({
        pathname: "/home/home",
        params: { shopId },
      });
    } else {
      Alert.alert("Error", "Failed to reject order.");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Header title="Reject Order" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* 🔴 Warning Banner */}
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ Rejecting this order cannot be undone. Please provide a valid reason.
          </Text>
        </View>

        <Text style={styles.orderId}>Order #{orderId}</Text>
        <Text style={styles.customer}>Customer: {customer}</Text>

        <Text style={styles.label}>Reason*</Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="e.g., Out of service area, Items damaged"
          style={styles.input}
        />

        <Text style={styles.label}>Additional Note (optional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Add details..."
          multiline
          style={[styles.input, styles.textArea]}
        />

        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>Reject Order</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
        >
          <Text style={[styles.buttonText, { color: "#333" }]}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9" },
  content: { padding: 20, flexGrow: 1 },

  warningBox: {
    backgroundColor: "#ffe5e5",
    padding: 12,
    marginBottom: 20,
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: "#d9534f",
  },
  warningText: { color: "#b52b27", fontSize: 14, fontWeight: "500" },

  orderId: { fontSize: 22, fontWeight: "bold", marginBottom: 5 },
  customer: { fontSize: 15, fontWeight: "600", marginBottom: 20 },

  label: { fontWeight: "600", marginTop: 15, marginBottom: 6, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
  },
  textArea: { height: 90, textAlignVertical: "top" },

  button: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  rejectButton: { backgroundColor: "#d9534f" },
  cancelButton: { backgroundColor: "#e5e5e5" },
  buttonText: { fontWeight: "bold", color: "#fff", fontSize: 16 },
});
