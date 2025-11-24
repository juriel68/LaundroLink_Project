import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useMemo, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator
} from "react-native";

// 🔑 Import types and API functions
import { 
  DeliveryOption, 
  fetchOwnDeliverySettings, 
  fetchLinkedApps
} from "@/lib/shops"; 

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

// --- Helper for Descriptions ---
const getHardcodedDescription = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("drop-off")) return "You bring your laundry to the shop.";
    if (lowerName.includes("pick-up") && lowerName.includes("delivery")) return "We collect your dirty laundry and return it clean.";
    if (lowerName.includes("pick-up")) return "We collect your laundry; you pick it up when done.";
    if (lowerName.includes("delivery")) return "You drop off laundry; we deliver it when done.";
    return "Standard service mode.";
};

interface LogisticsRates {
    baseFare: number;
    baseKm: number;
    distanceRate: number;
    providerName: string;
}

export default function DeliveryPayment() {
  const router = useRouter();
  
  // 1. RECEIVE PARAMS
  const { 
        shopId, shopName, SvcID, 
        fabrics, addons, instructions, 
        distance: distanceParam,
        
        availableServices: availableServicesChain, 
        availableAddOns: availableAddOnsChain, 
        availableFabricTypes: availableFabricTypesChain, 
        availableDeliveryOptions: deliveryOptionsChain, 
    } = useLocalSearchParams(); 

  const [selectedDeliveryId, setSelectedDeliveryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  // USE PASSED DISTANCE
  const distance = parseFloat(distanceParam as string || '0');

  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [rates, setRates] = useState<LogisticsRates | null>(null); 

  // 2. PARSE OPTIONS
  const availableDeliveryOptions: DeliveryOption[] = useMemo(() => {
    return safeParseParams<DeliveryOption>(deliveryOptionsChain);
  }, [deliveryOptionsChain]);
  
  // 3. INITIALIZE PRICING RULES
  useEffect(() => {
    const initData = async () => {
        try {
            const ownSettings = await fetchOwnDeliverySettings(shopId as string);

            if (ownSettings && ownSettings.ShopServiceStatus === 'Active') {
                setRates({
                    baseFare: Number(ownSettings.ShopBaseFare),
                    baseKm: Number(ownSettings.ShopBaseKm),
                    distanceRate: Number(ownSettings.ShopDistanceRate),
                    providerName: "In-House"
                });
            } else {
                const apps = await fetchLinkedApps(shopId as string);
                if (apps && apps.length > 0) {
                    const app = apps[0];
                    setRates({
                        baseFare: Number(app.AppBaseFare),
                        baseKm: Number(app.AppBaseKm),
                        distanceRate: Number(app.AppDistanceRate),
                        providerName: app.DlvryAppName 
                    });
                } else {
                    setRates({ baseFare: 0, baseKm: 0, distanceRate: 0, providerName: "Unknown" });
                }
            }
            
            setLoading(false);
        } catch (e) {
            console.error("Init Error:", e);
            setLoading(false);
        }
    };
    
    initData();
  }, [shopId]);

  const selectedOption = availableDeliveryOptions.find((opt) => opt.id === selectedDeliveryId);

  // --- 4. DYNAMIC FEE CALCULATION (UPDATED) ---
  useEffect(() => {
      if (!selectedOption || !rates) return;

      const name = selectedOption.name.toLowerCase();
      
      if (name.includes("drop-off")) {
          setDeliveryFee(0);
      } else {
          // Base Calculation (One Way)
          const extraDistance = Math.max(0, distance - rates.baseKm);
          let calculatedFee = rates.baseFare + (extraDistance * rates.distanceRate);
          
          // 🔑 LOGIC UPDATE: Double fee for Pick-up & Delivery (2-way trip)
          if (name.includes("pick-up") && name.includes("delivery")) {
              calculatedFee = calculatedFee * 2;
          }

          setDeliveryFee(Math.ceil(calculatedFee)); 
      }
  }, [selectedDeliveryId, distance, rates]);


  // --- 5. DYNAMIC NOTE LOGIC (UPDATED) ---
  const getDynamicNote = (option: DeliveryOption) => {
    const name = option.name.toLowerCase();
    const provider = rates?.providerName;
    const isInHouse = provider === "In-House";

    const notes: Record<string, string> = {
        "drop-off only": "Note: Your laundry will be weighed at the shop upon arrival.",
        
        "for delivery": isInHouse
            ? "Note: Your laundry will be weighed at the shop upon arrival and delivered back to you."
            : `Note: Your laundry will be weighed at the shop upon arrival and a rider (${provider}) will deliver it back to you.`,
            
        "pick-up only": isInHouse
            ? "Note: Your laundry will be weighed during pick-up by our staff."
            : `Note: Laundry will be weighed at the shop. Rider (${provider}) will pick-up your laundry.`,
            
        "pick-up & delivery": isInHouse
            ? "Note: Fee includes 2-way trip (Pick-up & Delivery). Laundry weighed during pick-up."
            : "Note: Fee includes 2-way trip (Pick-up & Delivery). Laundry weighed at shop."
    };

    return notes[name] || "Note: Delivery option selected. Details unavailable.";
  };

  // 🔑 NEW HELPER: Get Top Description based on Service Type
  const getServiceInfoMessage = () => {
      if (!rates) return null;
      const isOwnService = rates.providerName === "In-House";
      
      if (isOwnService) {
          return (
              <View style={[styles.infoCard, { backgroundColor: '#e3f2fd', borderColor: '#2196F3' }]}>
                  <Ionicons name="information-circle" size={20} color="#2196F3" style={{ marginRight: 8 }} />
                  <Text style={[styles.infoText, { color: '#0d47a1' }]}>
                      <Text style={{fontWeight:'bold'}}>In-House Service:</Text> Our staff will handle the pick-up. Weighing will be done <Text style={{fontWeight:'bold', textDecorationLine: 'underline'}}>during pick-up</Text> at your location.
                  </Text>
              </View>
          );
      } else {
          // 3rd Party (e.g. Lalamove)
          return (
              <View style={[styles.infoCard, { backgroundColor: '#fff3e0', borderColor: '#ff9800' }]}>
                  <Ionicons name="information-circle" size={20} color="#ff9800" style={{ marginRight: 8 }} />
                  <Text style={[styles.infoText, { color: '#e65100' }]}>
                      <Text style={{fontWeight:'bold'}}>Partner Courier ({rates.providerName}):</Text> A rider will collect your laundry. Weighing will be done <Text style={{fontWeight:'bold', textDecorationLine: 'underline'}}>at the shop</Text> after arrival.
                  </Text>
              </View>
          );
      }
  };

  const handleOrder = () => {
    if (selectedDeliveryId === null) {
        Alert.alert("Selection Required", "Please select a delivery option to proceed.");
        return;
    }
    
    // Determine if it is own service for the next screen logic
    const isOwnService = rates?.providerName === "In-House";

    router.push({
      pathname: "/homepage/order_summary",
      params: {
        availableServices: availableServicesChain, 
        availableAddOns: availableAddOnsChain,
        availableFabricTypes: availableFabricTypesChain, 

        shopId: shopId,
        shopName: shopName,
        SvcID: SvcID, 
        fabrics: fabrics,
        addons: addons,
        instructions: instructions,
        
        deliveryId: selectedDeliveryId.toString(), 
        deliveryOptionName: selectedOption?.name,
        deliveryFee: deliveryFee.toString(),
        distance: distance.toString(),
        
        // 🔑 Pass this flag to the summary page
        isOwnService: isOwnService ? 'true' : 'false' 
      },
    } as any);
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#004aad" />
        <Text style={{ marginTop: 10, color: '#555' }}>Loading rates...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: "#89CFF0" },
          headerShadowVisible: false,
          headerTintColor: "#2d2d2dff",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#000" style={{ marginLeft: 10 }} />
            </TouchableOpacity>
          ),
          headerTitle: () => (
            <Text style={styles.headerTitle}>Delivery Option</Text>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* 🔑 NEW: Display the Service Info Card at the top */}
        {getServiceInfoMessage()}

        <Text style={styles.instruction}>
            Select your preferred delivery service mode.
        </Text>

        {availableDeliveryOptions.length > 0 ? (
          availableDeliveryOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.card,
                selectedDeliveryId === option.id && styles.cardSelected,
              ]}
              onPress={() => setSelectedDeliveryId(option.id)}
              activeOpacity={0.9}
            >
              <View style={styles.cardContent}>
                {/* ICONS */}
                {option.name.toLowerCase().includes("drop-off") ? <Ionicons name="storefront" size={36} color="#004aad" /> : 
                 option.name.toLowerCase().includes("delivery") && option.name.toLowerCase().includes("pick-up") ? <Ionicons name="sync-circle-outline" size={40} color="#004aad" /> :
                 option.name.toLowerCase().includes("delivery") ? <Ionicons name="bicycle" size={36} color="#004aad" /> :
                 option.name.toLowerCase().includes("pick-up") ? <FontAwesome5 name="truck" size={32} color="#004aad" /> :
                 <Ionicons name="options-outline" size={36} color="#004aad" />
                }
                
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={[
                      styles.cardTitle,
                      selectedDeliveryId === option.id && { color: "#004aad" },
                    ]}
                  >
                    {option.name}
                  </Text>
                  
                  <Text style={styles.cardDesc}>{getHardcodedDescription(option.name)}</Text>
                  
                  {/* DYNAMIC NOTE */}
                  {selectedDeliveryId === option.id && (
                      <Text style={styles.dynamicNote}>
                          {getDynamicNote(option)}
                      </Text>
                  )}
                </View>

                {selectedDeliveryId === option.id && (
                  <Ionicons name="checkmark-circle" size={22} color="#004aad" />
                )}
              </View>
              
              {/* FEE DISPLAY */}
              <Text
                style={[
                  styles.feeText,
                  selectedDeliveryId === option.id && { color: "#004aad" },
                ]}
              >
                {option.name.toLowerCase().includes("drop-off") 
                    ? "FREE" 
                    : (selectedDeliveryId === option.id ? `₱${deliveryFee.toFixed(2)}` : "Select to view fee")}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
            <Text style={styles.noDataText}>No delivery options available.</Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.paymentButton,
            selectedDeliveryId === null && { backgroundColor: "#ccc" },
          ]}
          onPress={handleOrder}
          disabled={selectedDeliveryId === null}
        >
          <Text style={styles.paymentText}>
            {selectedOption
              ? `Confirm ${selectedOption.name}`
              : "Select an option"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 20, paddingBottom: 120 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    color: "#2d2d2dff",
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 20,
  },
  
  // 🔑 NEW STYLES for Info Card
  infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 10,
  },
  infoText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
  },

  instruction: {
    textAlign: "center",
    marginVertical: 10, // Reduced slightly since we added the card above
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardSelected: {
    borderColor: "#004aad",
    borderWidth: 2,
    backgroundColor: "#E3F2FD", 
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start", 
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#000" },
  cardDesc: { fontSize: 13, color: "#555", marginTop: 2 },
  
  dynamicNote: {
      fontSize: 12,
      color: "#d9534f", 
      marginTop: 6,
      fontStyle: 'italic',
      fontWeight: '600'
  },
  
  feeText: { fontSize: 15, fontWeight: "700", color: "#444", textAlign: 'right' },
  noDataText: { fontSize: 14, color: '#888', fontStyle: 'italic', paddingVertical: 10, textAlign: 'center' },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  paymentButton: {
    backgroundColor: "#004aad",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  paymentText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});