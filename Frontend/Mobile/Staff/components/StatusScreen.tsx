import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { fetchOrders, Order } from "@/lib/orders";
import Header from "@/components/Header";

interface StatusScreenProps {
  title: string;
  statusKey: string | string[];
  showUpdate?: boolean;
}

export default function StatusScreen({
  title,
  statusKey,
  showUpdate = true,
}: StatusScreenProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const router = useRouter();
  const { shopId } = useLocalSearchParams();

  useFocusEffect(
    useCallback(() => {
      const loadOrders = async () => {
        if (typeof shopId === "string") {
          setLoading(true);
          const allOrders = await fetchOrders(shopId);
          const filtered = Array.isArray(statusKey)
            ? allOrders.filter((o) => statusKey.includes(o.status))
            : allOrders.filter((o) => o.status === statusKey);
          setOrders(filtered);
          setLoading(false);
        }
      };
      loadOrders();
    }, [statusKey, shopId])
  );

  // 🔎 Filter + Search logic
  const displayedOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());

    // ✅ FIXED LOGIC HERE: Removed the check against order.status
    const matchesFilter =
      filter === "All" || order.latestProcessStatus === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <View style={styles.container}>
      <Header title={title} />

      {/* 🔎 Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔎 Search Order ID / Name"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#888"
        />
      </View>

      {/* 📌 Filter Dropdown */}
      <View style={styles.filterContainer}>
        <View style={styles.filterButton}>
          <Picker
            selectedValue={filter}
            style={styles.picker}
            onValueChange={(itemValue) => setFilter(itemValue)}
            dropdownIconColor="#fff" 
          >
            <Picker.Item label="All" value="All" />
            <Picker.Item label="Washed" value="Washed" />
            <Picker.Item label="Dry" value="Dry" />
            <Picker.Item label="Steam Pressed/Ironed" value="Steam Pressed/Ironed" />
            <Picker.Item label="Folded" value="Folded" />
          </Picker>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#00aaff" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {displayedOrders.length > 0 ? (
            displayedOrders.map((order) => {
              let statusToDisplay = order.latestProcessStatus || order.status;
              if (order.status === "Rejected") {
                statusToDisplay = order.reason || "Rejected";
              }

              return (
                <View key={order.orderId} style={styles.card}>
                  <View style={styles.cardRow}>
                    {/* Left side */}
                    <View style={styles.cardLeft}>
                      <Text style={styles.orderId}>#{order.orderId}</Text>
                      <Text style={styles.customer}>{order.customerName}</Text>
                      <TouchableOpacity
                        onPress={() =>
                          router.push({
                            pathname: "/home/orderDetail",
                            params: { orderId: order.orderId },
                          })
                        }
                      >
                        <Text style={styles.viewDetails}>View Details</Text>
                      </TouchableOpacity>
                      {showUpdate && (
                        <TouchableOpacity
                          style={styles.updateBtn}
                          onPress={() =>
                            router.push({
                              pathname: "/home/updateProcess",
                              params: {
                                orderId: order.orderId,
                                customer: order.customerName,
                                currentStatus: order.latestProcessStatus,
                              },
                            })
                          }
                        >
                          <Text style={styles.updateText}>Update Laundry</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Right side (badge) */}
                    <View style={styles.cardRight}>
                      <View
                        style={[
                          styles.statusBadge,
                          order.status === "Rejected" && styles.rejectedBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            order.status === "Rejected" && styles.rejectedText,
                          ]}
                        >
                          {statusToDisplay}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.noOrders}>
              No {title.toLowerCase()} orders found.
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },

  // 🔎 Search Styling
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
  },
  searchInput: {
    height: 48,
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 18,
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },

  // 📌 Filter Styling
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },

  filterButton: {
    width: "100%",
    height: 48,
    borderRadius: 25,
    backgroundColor: "#0277bd",
    justifyContent: "center",
    paddingHorizontal: 10,
    
  },

  picker: {
    width: "100%",
    color: "#fff", // white text for contrast
    fontSize: 15,
    fontWeight: "600",
  },

  // 📝 Order Cards
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: {
    flex: 2,
  },
  cardRight: {
    flex: 1,
    alignItems: "center",
  },
  orderId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  customer: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 6,
    color: "#222",
  },
  viewDetails: {
    color: "#007bff",
    fontSize: 15,
    marginBottom: 8,
    fontWeight: "500",
  },
  updateBtn: {
    backgroundColor: "#007bff",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 6,
    width: 150,
  },
  updateText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 15,
    textAlign: "center",
  },

  // 🏷 Status Badge
  statusBadge: {
    backgroundColor: "#e1f5fe",
    minWidth: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0277bd",
    textAlign: "center",
  },
  rejectedBadge: {
    backgroundColor: "#f8d7da",
  },
  rejectedText: {
    color: "#b71c1c",
  },
  noOrders: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    fontWeight: "500",
    color: "#6c757d",
  },
});