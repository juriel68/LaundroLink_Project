import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { updateOrderStatus } from "@/lib/orders";
import Header from "@/components/Header";

export default function RejectOrderScreen() {
  const { orderId, customer, shopId } = useLocalSearchParams<{ orderId: string; customer: string; shopId: string }>();
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 🔴 Warning Banner */}
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ Rejecting this order cannot be undone. Please provide a valid reason.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.orderId}>Order #{orderId}</Text>
          <Text style={styles.customer}>Customer: {customer}</Text>

          <Text style={styles.label}>Reason*</Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="e.g., Out of service area, Items damaged"
            style={[styles.input, { fontStyle: "italic", color: "#333" }]}
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Additional Note (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add details..."
            multiline
            style={[styles.input, styles.textArea, { fontStyle: "italic", color: "#333" }]}
            placeholderTextColor="#999"
          />

          <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Reject Order</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
            <Text style={[styles.buttonText, { color: "#333" }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#eef3f7" },

  content: {
    padding: 20,
    flexGrow: 1,
  },

  warningBox: {
    backgroundColor: "#fdecea",
    padding: 14,
    marginBottom: 25,
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: "#d9534f",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  warningText: { color: "#a83b2f", fontSize: 14, fontWeight: "600", lineHeight: 20 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 4,
  },

  orderId: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#2c3e50",
  },
  customer: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 16,
    color: "#34495e",
  },

  label: {
    fontWeight: "600",
    marginTop: 18,
    marginBottom: 8,
    color: "#2c3e50",
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#dcdde1",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fafafa",
    fontSize: 15,
    color: "#333",
  },
  textArea: { height: 100, textAlignVertical: "top" },

  button: {
    marginTop: 22,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  rejectButton: {
    backgroundColor: "#A10D0D",
    shadowColor: "#e74c3c",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  cancelButton: {
    backgroundColor: "#ecf0f1",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  buttonText: { fontWeight: "bold", color: "#fff", fontSize: 16, letterSpacing: 0.3 },
});
