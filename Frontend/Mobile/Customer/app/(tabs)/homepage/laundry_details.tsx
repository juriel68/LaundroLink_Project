// Customer/app/(tabs)/homepage/laundry_details.tsx
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useMemo } from "react";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Alert,
} from "react-native";

import { AddOn, FabricType, Service } from "@/lib/shops";

// --- Helper Function to safely parse JSON arrays ---
function safeParseParams<T>(param: string | string[] | undefined): T[] {
    if (typeof param === 'string') {
        try {
            return JSON.parse(param) as T[];
        } catch (e) {
            console.error("Failed to parse navigation param:", e);
            return [];
        }
    }
    return [];
}


export default function LaundryDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // 1. RECEIVE PARAMS
  const shopId = params.shopId as string;
  const shopName = params.shopName as string;
  const SvcID = params.SvcID as string; 
  const distance = params.distance as string;
  
  const availableServicesChain = params.availableServices as string;
  const availableAddOnsChain = params.availableAddOns as string;
  const availableDeliveryOptionsChain = params.availableDeliveryOptions as string;
  const availableFabricTypesChain = params.availableFabricTypes as string;


  // 2. PARSE DYNAMIC LISTS
  const availableServices: Service[] = useMemo(() => {
    return safeParseParams<Service>(availableServicesChain);
  }, [availableServicesChain]);

  const availableAddOns: AddOn[] = useMemo(() => {
    return safeParseParams<AddOn>(availableAddOnsChain);
  }, [availableAddOnsChain]);

  const dynamicFabricTypes: FabricType[] = useMemo(() => {
    return safeParseParams<FabricType>(availableFabricTypesChain);
  }, [availableFabricTypesChain]);


  // 3. COLLECT INPUTS
  const [selectedFabricIDs, setSelectedFabricIDs] = useState<number[]>([]);
  const [selectedAddOnIDs, setSelectedAddOnIDs] = useState<number[]>([]); 
  const [instructions, setInstructions] = useState("");


  const toggleFabric = (fabricID: number) => {
    setSelectedFabricIDs((prev) =>
      prev.includes(fabricID) ? prev.filter((f) => f !== fabricID) : [...prev, fabricID]
    );
  };

  const toggleAddon = (addonID: number) => { 
    setSelectedAddOnIDs((prev) =>
      prev.includes(addonID) ? prev.filter((a) => a !== addonID) : [...prev, addonID]
    );
  };

  const handleConfirm = () => {
    
    if (selectedFabricIDs.length === 0) {
      Alert.alert("Required", "Please select at least one fabric type.");
      return;
    }
    
    // 4. PASS DATA TO NEXT SCREEN
    router.push({
      pathname: "/homepage/df_payment",
      params: {
        shopId: shopId,
        shopName: shopName,
        SvcID: SvcID, 
        distance: distance,
        availableServices: availableServicesChain, 
        availableAddOns: availableAddOnsChain, 
        availableDeliveryOptions: availableDeliveryOptionsChain, 
        availableFabricTypes: availableFabricTypesChain,
        fabrics: JSON.stringify(selectedFabricIDs), 
        addons: JSON.stringify(selectedAddOnIDs), 
        instructions: instructions,
      },
    } as any);
  };
    
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: "#89CFF0" },
          headerTitleAlign: "left",
          headerTintColor: "#2d2d2dff",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#000" style={{ marginLeft: 10 }} />
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <Text style={styles.headerTitle}>Laundry Details</Text>
          ),
        }}
      />

      <ScrollView style={styles.wrapper} contentContainerStyle={styles.container}>
        
        {/* 🔑 UPDATED NOTICE TEXT */}
        <View style={styles.noticeBox}>
          <Ionicons name="information-circle-outline" size={20} color="#004aad" style={{ marginRight: 8 }} />
          <Text style={styles.noticeText}>
            Your order will start at 0.0kg. The final weight and price will be updated by the shop staff after weighing your laundry.
          </Text>
        </View>

        {/* FABRIC SELECTION */}
        <Text style={styles.sectionTitle}>Select Fabric Type(s)</Text>
        {dynamicFabricTypes.length > 0 ? (
          dynamicFabricTypes.map((item) => ( 
            <Pressable
              key={item.id}
              style={[
                styles.optionRow,
                selectedFabricIDs.includes(item.id) && styles.selectedOption,
              ]}
              onPress={() => toggleFabric(item.id)}
            >
              <Ionicons
                name={ selectedFabricIDs.includes(item.id) ? "checkbox" : "square-outline" }
                size={20}
                color={selectedFabricIDs.includes(item.id) ? "#004aad" : "#0D47A1"}
              />
              <Text
                style={[
                  styles.optionText,
                  selectedFabricIDs.includes(item.id) && { fontWeight: "700", color: "#004aad" },
                ]}
              >
                {item.name}
              </Text>
            </Pressable>
          ))
        ) : (
            <Text style={styles.noDataText}>No fabric types available for this shop.</Text>
        )}


        {/* ADD-ONS SELECTION */}
        <Text style={styles.sectionTitle}>Add-ons</Text>
        {availableAddOns.length > 0 ? (
          availableAddOns.map((addon) => (
            <Pressable
              key={addon.id} 
              style={[
                styles.optionRow,
                selectedAddOnIDs.includes(addon.id) && styles.selectedOption, 
              ]}
              onPress={() => toggleAddon(addon.id)} 
            >
              <Ionicons
                name={selectedAddOnIDs.includes(addon.id) ? "checkbox" : "square-outline"} 
                size={20}
                color={selectedAddOnIDs.includes(addon.id) ? "#004aad" : "#0D47A1"} 
              />
              <Text
                style={[
                  styles.optionText,
                  selectedAddOnIDs.includes(addon.id) && { fontWeight: "700", color: "#004aad" }, 
                ]}
              >
                {addon.name} (₱{parseFloat(String(addon.price)).toFixed(2)})
              </Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.noDataText}>No add-ons available for this shop.</Text>
        )}

        {/* SPECIAL INSTRUCTIONS */}
        <Text style={styles.sectionTitle}>Special Instructions</Text>
        <TextInput
          style={styles.instructionsInput}
          placeholder="E.g., Wash separately, do not tumble dry..."
          value={instructions}
          onChangeText={setInstructions}
          multiline
          numberOfLines={4}
        />

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[ styles.confirmBtn, selectedFabricIDs.length === 0 && styles.disabledBtn ]}
          onPress={handleConfirm}
          disabled={selectedFabricIDs.length === 0}
        >
          <Text style={styles.confirmText}>Confirm Details and Choose Delivery</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  wrapper: { flex: 1 },
  container: { padding: 20, paddingBottom: 100 },
  headerTitle: { color: "#2d2d2dff", fontSize: 20, fontWeight: "600", marginLeft: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginVertical: 10, color: "#1c3d63" },
  
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  noticeText: {
    fontSize: 13,
    color: '#004aad',
    flexShrink: 1,
    lineHeight: 18, 
  },

  optionRow: { flexDirection: "row", alignItems: "center", marginVertical: 4, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  selectedOption: { backgroundColor: "#E3F2FD", borderColor: '#BBDEFB' },
  optionText: { marginLeft: 10, fontSize: 15, color: "#2d2d2dff" },
  noDataText: { fontSize: 14, color: '#888', fontStyle: 'italic', paddingVertical: 10, textAlign: 'center' },
  
  instructionsInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    textAlignVertical: "top",
    minHeight: 80,
    backgroundColor: '#f9f9f9',
  },
  
  footer: { padding: 15, backgroundColor: "#fff", borderTopWidth: 1, borderColor: '#eee' },
  confirmBtn: { backgroundColor: "#004aad", padding: 15, borderRadius: 25, alignItems: "center" },
  disabledBtn: { backgroundColor: "#ccc" },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});