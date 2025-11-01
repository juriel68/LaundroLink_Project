// laundry_details.tsx (UPDATED: Corrected chain data management)
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

// 🔑 Import necessary interfaces: AddOn and FabricType
import { AddOn, FabricType, Service } from "@/lib/shops"; // Added Service for robust internal parsing

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

  // 1. RECEIVE ALL NECESSARY PARAMS (For Payload and Chaining)
  const shopId = params.shopId as string;
  const shopName = params.shopName as string;
  // Critical incoming data to be passed forward (stored as raw strings):
  const SvcID = params.SvcID as string;
  
  // 🔑 CRITICAL FIX 1: Store all incoming lists as raw strings for perfect re-passing
  const availableServicesChain = params.availableServices as string;
  const availableAddOnsChain = params.availableAddOns as string;
  const availableDeliveryOptionsChain = params.availableDeliveryOptions as string;
  const availableFabricTypesChain = params.availableFabricTypes as string;


  // 2. PARSE DYNAMIC LISTS (For on-screen use only)
  
  // Parse the list of available services (Used only for debug/checking here)
  const availableServices: Service[] = useMemo(() => {
    return safeParseParams<Service>(availableServicesChain);
  }, [availableServicesChain]);

  // Parse the list of available Add-Ons (Used for rendering selection)
  const availableAddOns: AddOn[] = useMemo(() => {
    return safeParseParams<AddOn>(availableAddOnsChain);
  }, [availableAddOnsChain]);

  // Parse Fabric Types for selection (Used for rendering selection)
  const dynamicFabricTypes: FabricType[] = useMemo(() => {
    return safeParseParams<FabricType>(availableFabricTypesChain);
  }, [availableFabricTypesChain]);


  // 3. COLLECT INPUTS 
  const [selectedFabricIDs, setSelectedFabricIDs] = useState<string[]>([]);
  const [selectedAddOnIDs, setSelectedAddOnIDs] = useState<string[]>([]); 
  const [instructions, setInstructions] = useState("");


  const toggleFabric = (fabricID: string) => {
    setSelectedFabricIDs((prev) =>
      prev.includes(fabricID) ? prev.filter((f) => f !== fabricID) : [...prev, fabricID]
    );
  };

  const toggleAddon = (addonID: string) => { 
    setSelectedAddOnIDs((prev) =>
      prev.includes(addonID) ? prev.filter((a) => a !== addonID) : [...prev, addonID]
    );
  };

  const handleConfirm = () => {
    
    if (selectedFabricIDs.length === 0) {
      Alert.alert("Required", "Please select at least one fabric type.");
      return;
    }
    
    // 4. PASS ALL COLLECTED DATA (AND PREVIOUS CHAIN DATA) TO NEXT SCREEN
    router.push({
      pathname: "/homepage/df_payment",
      params: {
        // Previous Data Chain (CRITICAL to re-pass the original RAW STRINGS)
        shopId: shopId,
        shopName: shopName,
        SvcID: SvcID, 
        
        // 🔑 CRITICAL FIX 2: Pass the raw, unchanged incoming JSON strings forward.
        availableServices: availableServicesChain, 
        availableAddOns: availableAddOnsChain, 
        availableDeliveryOptions: availableDeliveryOptionsChain, 
        availableFabricTypes: availableFabricTypesChain,

        // New Collected Data (CRITICAL for payload)
        fabrics: JSON.stringify(selectedFabricIDs), // Array of Fabric IDs
        addons: JSON.stringify(selectedAddOnIDs), // Array of AddOn IDs
        instructions: instructions,
      },
    });
  };
    
    // 🔑 DEBUG: Assemble data for display (now checking against the parsed Services list)
    const debugData = {
        SvcID_IN: SvcID,
        Fabrics_OUT: selectedFabricIDs,
        AddOns_OUT: selectedAddOnIDs,
        Instructions: instructions,
        // Using a reliable check against the internal parsed arrays
        Lists_Status: `Svc:${availableServices.length > 0}, AddOns:${availableAddOns.length > 0}, Fabrics:${dynamicFabricTypes.length > 0}`,
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
        
        {/* WEIGHT ASSUMPTION NOTICE */}
        <View style={styles.noticeBox}>
          <Ionicons name="information-circle-outline" size={20} color="#004aad" style={{ marginRight: 8 }} />
          <Text style={styles.noticeText}>Initial weight will be set by the system as an estimate for booking. Staff will weigh your laundry for final pricing.</Text>
        </View>

        {/* FABRIC SELECTION (Now dynamic) */}
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
              >{item.name}
              </Text>
            </Pressable>
          ))
        ) : (
            <Text style={styles.noDataText}>No fabric types available for this shop.</Text>
        )}


        {/* ADD-ONS SELECTION (Using dynamic AddOn list) */}
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
              >{addon.name} (₱{parseFloat(String(addon.price)).toFixed(2)})
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
        
        {/* 🔑 DEBUG DISPLAY */}
        <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>DEBUG DATA (Handover Payload)</Text>
            <Text style={styles.debugText}>
                {JSON.stringify(debugData, null, 2)}
            </Text>
            <Text style={styles.debugNote}>
                Note: Raw list strings are passed forward, ensuring data integrity for the summary screen.
            </Text>
        </View>

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
  
  // NEW: Notice box styles
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
  },

  // Selection Rows
  optionRow: { flexDirection: "row", alignItems: "center", marginVertical: 4, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  selectedOption: { backgroundColor: "#E3F2FD", borderColor: '#BBDEFB' },
  optionText: { marginLeft: 10, fontSize: 15, color: "#2d2d2dff" },
  noDataText: { fontSize: 14, color: '#888', fontStyle: 'italic', paddingVertical: 10, textAlign: 'center' },
  
  // Instructions Input
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
  
  // Footer and Button
  footer: { padding: 15, backgroundColor: "#fff", borderTopWidth: 1, borderColor: '#eee' },
  confirmBtn: { backgroundColor: "#004aad", padding: 15, borderRadius: 25, alignItems: "center" },
  disabledBtn: { backgroundColor: "#ccc" },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    
    // 🔑 NEW DEBUG STYLES
    debugContainer: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
    },
    debugTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#444'
    },
    debugText: {
        fontSize: 12,
        color: '#222',
        fontFamily: 'monospace',
    },
    debugNote: {
        fontSize: 10,
        marginTop: 5,
        color: '#888'
    }
});