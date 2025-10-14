import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";
import StatusCard from "@/components/ui/StatusCard";
import { LineChart } from "react-native-chart-kit";
import Ionicons from "@expo/vector-icons/Ionicons";
import Header from "@/components/Header";
import { fetchOrderSummary, OrderSummaryData } from "@/lib/orders";
import { getCurrentUser } from "@/lib/auth"; 

const screenWidth = Dimensions.get("window").width;

const defaultChartData = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
};

export default function OrderScreen() {
  const user = getCurrentUser();
  const shopId = user?.ShopID;

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedRange, setSelectedRange] = useState("This Week");
  const [summary, setSummary] = useState<OrderSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDateDisplay, setCurrentDateDisplay] = useState("");

  const options = ["Today", "This Week", "This Month"];
  
  useEffect(() => {
    const date = new Date();
    const formattedDate = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    setCurrentDateDisplay(formattedDate);
  }, []);

  const loadSummary = useCallback(async () => {
    if (shopId) {
      setLoading(true);
      const data = await fetchOrderSummary(shopId, selectedRange);
      setSummary(data);
      setLoading(false);
    }
  }, [shopId, selectedRange]);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary])
  );

  const handleSelect = (option: string) => {
    setSelectedRange(option);
    setMenuVisible(false);
  };

  const chartData = summary?.chartData?.length
    ? {
        labels: summary.chartData.map(d => d.label),
        datasets: [{ data: summary.chartData.map(d => d.revenue) }]
      }
    : defaultChartData;

  return (
    <View style={styles.container}>
      <Header title="Orders" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Date Row */}
        <View style={styles.dateRow}>
          <View style={styles.dateTitleContainer}>
            <Text style={styles.sectionTitle}>Date: </Text>
            <Text style={styles.dateText}>{currentDateDisplay}</Text>
          </View>

          <View style={{ position: "relative" }}>
            <TouchableOpacity style={styles.dropdownBtn} onPress={() => setMenuVisible(!menuVisible)}>
              <View style={styles.dropdownContent}>
                <Text style={styles.dropdownText}>{selectedRange}</Text>
                <Ionicons name="chevron-down" size={18} color="#0077b6" />
              </View>
            </TouchableOpacity>
            {menuVisible && (
              <View style={styles.menu}>
                {options.map((option) => (
                  <TouchableOpacity key={option} style={styles.menuItem} onPress={() => handleSelect(option)}>
                    <Text style={styles.menuText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Status Summary */}
        <View style={styles.statusCardRow}> 
          <View style={styles.statusCardWrapper}>
            <StatusCard icon="document-text-outline" label="Total" count={summary?.totalOrders ?? 0} color="#3498DB" />
          </View>
          <View style={styles.statusCardWrapper}>
            <StatusCard icon="checkmark-circle-outline" label="Completed" count={summary?.completedOrders ?? 0} color="#2ECC71" />
          </View>
          <View style={styles.statusCardWrapper}>
            <StatusCard icon="time-outline" label="In Progress" count={summary?.pendingOrders ?? 0} color="#F8C471" />
          </View>
          <View style={styles.statusCardWrapper}>
            <StatusCard icon="bar-chart-outline" label="Revenue" count={summary?.totalRevenue ?? 0} color="#17a2b8" />
          </View>
        </View>

        {/* Revenue Chart */}
        <Text style={styles.sectionTitle}>Revenue</Text>
        <View style={styles.chartBox}>
          {loading ? <ActivityIndicator /> : (
            <LineChart
              data={chartData}
              width={screenWidth - 40}
              height={180}
              yAxisLabel="₱"
              chartConfig={chartConfig}
              bezier
              style={{ borderRadius: 10 }}
            />
          )}
        </View>

        {/* Recent Orders Table */}
        <View style={styles.tableBox}>
          <Text style={styles.tableTitle}>📋 Recent Orders</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.headerCell]}>Order ID</Text>
            <Text style={[styles.tableCell, styles.headerCell]}>Customer</Text>
            <Text style={[styles.tableCell, styles.headerCell]}>Status</Text>
            <Text style={[styles.tableCell, styles.headerCell]}>Amount</Text>
          </View>
          {summary?.recentOrders.map((order, index) => (
            <View key={order.id} style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
              <Text style={styles.tableCell}>{order.id}</Text>
              <Text style={styles.tableCell}>{order.customer}</Text>
              <Text
                style={[
                  styles.tableCell,
                  { 
                    color: order.status === "Completed" ? "#2ecc71" :
                           order.status === "Pending" || order.status === "In Progress" ? "#f39c12" : "#e74c3c",
                    fontWeight: "600"
                  }
                ]}
              >
                {order.status}
              </Text>
              <Text style={styles.tableCell}>₱{order.amount?.toFixed(2) ?? "N/A"}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const chartConfig = {
  backgroundColor: "#fff",
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  propsForDots: { r: "5", strokeWidth: "2", stroke: "#0077b6" },
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f9fafb" 
  },

  content: { 
    padding: 16 
  },

  dateRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 5, 
    zIndex: 10 
  },

  dateTitleContainer: { 
    flexDirection: "row", 
    alignItems: "baseline" 
  },

  dateText: { 
    fontSize: 16, 
    fontWeight: "500", 
    color: "#555", 
    marginBottom: 10 
  },

  sectionTitle: { 
    fontSize: 16, 
    fontWeight: "600", 
    marginBottom: 10 
  },

  dropdownBtn: { 
    backgroundColor: "#e6f7ff", 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 8 
  },

  dropdownContent: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center" 
  },

  dropdownText: { 
    fontSize: 14, 
    fontWeight: "500", 
    color: "#0077b6", 
    marginRight: 4 
  },

  menu: { 
    position: "absolute", 
    top: "100%", 
    right: 0, 
    backgroundColor: "#fff", 
    borderRadius: 8, 
    marginTop: 4, 
    paddingVertical: 6, 
    shadowColor: "#000", 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3, 
    zIndex: 20 
  },

  menuItem: { 
    paddingVertical: 8, 
    paddingHorizontal: 12 
  },

  menuText: { 
    fontSize: 14, 
    color: "#333" 
  },

  statusCardRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginHorizontal: -4, 
    paddingVertical: 12, 
    marginBottom: 10 
  },

  statusCardWrapper: { 
    flex: 1, 
    marginHorizontal: 4 
  },

  chartBox: { 
    backgroundColor: "#fff", 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: "#ddd", 
    alignItems: "center", 
    justifyContent: "center", 
    marginBottom: 20, 
    paddingVertical: 10 
  },

  tableBox: { 
    backgroundColor: "#fff", 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: "#ddd", 
    padding: 12, 
    marginBottom: 30 
  },

  tableTitle: { 
    fontWeight: "600", 
    fontSize: 16, 
    marginBottom: 8, 
    color: "#000" 
  },

  tableHeader: { 
    flexDirection: "row", 
    backgroundColor: "#e6f7ff", 
    borderRadius: 6, 
    marginBottom: 4, 
    paddingVertical: 8, 
    paddingHorizontal: 4 
  },

  tableRow: { 
    flexDirection: "row", 
    paddingVertical: 8, 
    paddingHorizontal: 4, 
    borderRadius: 4, 
    borderBottomWidth: 1, 
    borderBottomColor: "#f0f0f0" 
  },

  rowEven: { 
    backgroundColor: "#f9f9f9" 
  },

  rowOdd: { 
    backgroundColor: "#fff" 
  },

  tableCell: { 
    flex: 1, 
    fontSize: 13, 
    color: "#333", 
    textAlign: "center" 
  },

  headerCell: { 
    fontWeight: "700", 
    color: "#0077b6" 
  },

});
