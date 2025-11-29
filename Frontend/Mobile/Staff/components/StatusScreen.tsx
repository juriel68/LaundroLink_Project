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
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";

// Libs
import { fetchOrders, Order } from "@/lib/orders";
import { getCurrentUser } from "@/lib/auth";
import Header from "@/components/Header";

export default function StatusScreen() {
  const { status, title, type } = useLocalSearchParams(); 
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("All");
  
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      setFilter("All");

      const loadOrders = async () => {
        const user = getCurrentUser();
        if (user?.ShopID) {
          setLoading(true);
          const allOrders = await fetchOrders(user.ShopID);
          
          const filtered = allOrders.filter((o) => {
              // 🔑 FIXED: Filtering logic matches Home Screen (No Mutation)
              if (type === 'delivery') {
                  const dStatus = o.deliveryStatus || '';

                  // Group: For Delivery
                  if (status === "For Delivery") {
                      return dStatus === "For Delivery" || 
                             dStatus === "Rider Booked For Delivery";
                  }

                  // Group: To Pick-up
                  if (status === "To Pick-up") {
                      return dStatus === "To Pick-up" || 
                             dStatus === "Rider Booked To Pick-up"; 
                  }
                  
                  return dStatus === status;
              }
              return o.laundryStatus === status;
          });

          setOrders(filtered);
          setLoading(false);
        }
      };
      loadOrders();
    }, [status, type])
  );

  const displayedOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filter === "All" || order.latestProcessStatus === filter;

    return matchesSearch && matchesFilter;
  });

  const displayTitle = Array.isArray(title) ? title[0] : title || "Orders";

  return (
    <View style={styles.container}>
      <Header title={displayTitle} />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔎 Search Order ID / Name"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#888"
        />
      </View>

      {status === "Processing" && (
        <View style={styles.filterContainer}>
          <View style={styles.filterButton}>
            <Picker
              selectedValue={filter}
              style={styles.picker}
              onValueChange={(itemValue) => setFilter(itemValue)}
              dropdownIconColor="#fff" 
            >
              <Picker.Item label="All Stages" value="All" />
              <Picker.Item label="Washed" value="Washed" />
              <Picker.Item label="Dry" value="Dry" />
              <Picker.Item label="Steam Pressed/Ironed" value="Steam Pressed/Ironed" />
              <Picker.Item label="Folded" value="Folded" />
            </Picker>
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#00aaff" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {displayedOrders.length > 0 ? (
            displayedOrders.map((order) => {
              
              let statusToDisplay = type === 'delivery' 
                ? order.deliveryStatus 
                : (status === "Processing" ? (order.latestProcessStatus || "Processing") : order.laundryStatus);

              if (order.laundryStatus === "Cancelled") {
                statusToDisplay = "Cancelled";
              }

              return (
                <View key={order.orderId} style={styles.card}>
                  <View style={styles.cardRow}>
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

                      {/* 1. Update Laundry Button (Processing) */}
                      {order.laundryStatus === "Processing" && (
                        <TouchableOpacity
                          style={styles.updateBtn}
                          onPress={() =>
                            router.push({
                              pathname: "/home/updateProcess",
                              params: {
                                orderId: order.orderId,
                                customer: order.customerName,
                                currentStatus: order.latestProcessStatus || "Processing",
                              },
                            })
                          }
                        >
                          <Text style={styles.updateText}>Update Laundry</Text>
                        </TouchableOpacity>
                      )}

                      {/* 2. Update Weight Button (To Weigh) */}
                      {order.laundryStatus === "To Weigh" && (
                        <TouchableOpacity
                          style={[styles.updateBtn, { backgroundColor: '#7b1fa2', marginTop: 8 }]}
                          onPress={() =>
                            router.push({
                              pathname: "/home/updateWeight",
                              params: {
                                orderId: order.orderId,
                              },
                            })
                          }
                        >
                          <Text style={styles.updateText}>Update Weight</Text>
                        </TouchableOpacity>
                      )}

                      {/* 3. Manage Delivery Button (Delivery Flows) */}
                      {/* Checks if the current status allows for delivery updates */}
                      {type === 'delivery' && 
                        ['To Pick-up', 'Rider Booked To Pick-up', 'For Delivery', 'Rider Booked For Delivery', 'Outgoing Rider Booked'].includes(order.deliveryStatus || '') && (
                        <TouchableOpacity
                          style={[styles.updateBtn, { backgroundColor: '#ff9800', marginTop: 8 }]}
                          onPress={() =>
                            router.push({
                              pathname: "/home/updateDelivery",
                              params: {
                                orderId: order.orderId,
                              },
                            })
                          }
                        >
                          <Text style={styles.updateText}>Manage Delivery</Text>
                        </TouchableOpacity>
                      )}

                    </View>

                    <View style={styles.cardRight}>
                      <View
                        style={[
                          styles.statusBadge,
                          order.laundryStatus === "Cancelled" && styles.cancelledBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            order.laundryStatus === "Cancelled" && styles.cancelledText,
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
              No {displayTitle.toLowerCase()} orders found.
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
    color: "#fff", 
    fontSize: 15,
    fontWeight: "600",
  },
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
  cancelledBadge: {
    backgroundColor: "#f8d7da",
  },
  cancelledText: {
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