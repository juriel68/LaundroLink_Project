import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, SafeAreaView, ScrollView 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from "@expo/vector-icons";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import { uploadBookingProof, updateDeliveryWorkflow, fetchOrderDetails } from "@/lib/orders";
import { fetchShopDetails } from "@/lib/shops"; 

export default function UpdateDeliveryScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [deliveryType, setDeliveryType] = useState<'app' | 'own' | null>(null);
  
  // 🔑 NEW STATE: To hold the main order status (e.g., Ready for Delivery)
  const [currentOrderStatus, setCurrentOrderStatus] = useState(''); 
  const [currentDlvryStatus, setCurrentDlvryStatus] = useState('');
  
  const [bookingImage, setBookingImage] = useState<string | null>(null);
  
  const user = getCurrentUser();

  // 1. Load Order & Shop Config to determine Logic
  useEffect(() => {
    const init = async () => {
      if (!orderId || !user?.ShopID) return;
      
      try {
        // A. Fetch Order to get current statuses
        const orderData = await fetchOrderDetails(String(orderId));
        if (orderData) {
            // 🔑 FETCH AND STORE ORDER STATUS
            setCurrentOrderStatus(orderData.orderStatus || '');
            setCurrentDlvryStatus(orderData.deliveryStatus || '');
        }

        // B. Fetch Shop Details to determine Delivery Mode (App vs Own)
        const shopData = await fetchShopDetails(user.ShopID);
        
        if (shopData) {
            if (shopData.ownDelivery && shopData.ownDelivery.ShopServiceStatus === 'Active') {
                setDeliveryType('own');
            } else if (shopData.deliveryApps && shopData.deliveryApps.length > 0) {
                setDeliveryType('app');
            } else {
                setDeliveryType('app'); // Fallback
            }
        }

      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Failed to load details.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [orderId, user?.ShopID]);

  // 2. Determine if this is an OUTGOING (Delivery to Customer) flow
  const isOutgoingFlow = currentOrderStatus === 'Ready for Delivery' || currentDlvryStatus === 'Out for Delivery';
  
  // 3. Handle Image Picker (For App Booking)
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setBookingImage(result.assets[0].uri);
    }
  };

  // 4. Logic for "Book Pick-up" (INCOMING Step 1)
  const handleBookPickup = async () => {
    if (!bookingImage) {
      Alert.alert("Required", "Please upload a screenshot of the booking.");
      return;
    }
    setLoading(true);
    const success = await uploadBookingProof(String(orderId), bookingImage, user?.UserID || 'Staff', 'Staff');
    setLoading(false);

    if (success) {
      Alert.alert("Success", "Booking proof uploaded.");
      setCurrentDlvryStatus('Rider Booked'); 
    } else {
      Alert.alert("Error", "Failed to upload proof.");
    }
  };

  // 5. Logic for "Delivered In Shop" (INCOMING Step 2)
  const handleDeliveredInShop = () => {
    Alert.alert("Confirm Arrival", "Is the laundry currently at the shop?", [
      { text: "No", style: "cancel" },
      // Update DlvryStatus to show completion of pickup, and OrderStatus back to 'To Weigh'
      { text: "Yes", onPress: () => executeUpdate('Delivered In Shop', 'To Weigh') } 
    ]);
  };

  // 6. Logic for "Arrived at Customer" (INCOMING Own Service)
  const handleArrivedAtCustomer = () => {
    Alert.alert("Confirm Arrival", "Did you arrive at the customer's house?", [
      { text: "No", style: "cancel" },
      { text: "Yes", onPress: () => executeUpdate('Arrived at Customer', 'To Weigh') } 
    ]);
  };

  // 7. Logic for "Book Delivery" (OUTGOING Step 1)
  const handleBookDelivery = async () => {
    if (!bookingImage) {
      Alert.alert("Required", "Please upload a screenshot of the booking.");
      return;
    }
    setLoading(true);
    // Note: We reuse uploadBookingProof, which sets Rider Booked status
    const success = await uploadBookingProof(String(orderId), bookingImage, user?.UserID || 'Staff', 'Staff');
    setLoading(false);

    if (success) {
      Alert.alert("Success", "Booking proof uploaded.");
      setCurrentDlvryStatus('Out for Delivery'); // Simulate next status jump for visibility
    } else {
      Alert.alert("Error", "Failed to upload proof.");
    }
  };

  // 8. Logic for "Delivered To Customer" (OUTGOING Final Step)
  const handleDeliveredToCustomer = () => {
    Alert.alert("Confirm Delivery", "Has the customer received the laundry?", [
      { text: "No", style: "cancel" },
      { text: "Yes", onPress: () => executeUpdate('Delivered To Customer', 'Completed') } 
    ]);
  };

  // 9. Shared Execution Function
  const executeUpdate = async (dlvryStatus: string, orderStatus: string) => {
    setLoading(true);
    const success = await updateDeliveryWorkflow(
        String(orderId), dlvryStatus, orderStatus, user?.UserID || 'Staff', 'Staff'
    );
    setLoading(false);

    if (success) {
      Alert.alert("Success", "Order status updated!", [{ text: "OK", onPress: () => router.back() }]);
    } else {
      Alert.alert("Error", "Failed to update status.");
    }
  };

  if (loading && !deliveryType) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#007bff"/></View>;
  }

  // 🔑 Determine which display status to use
  const displayStatus = isOutgoingFlow ? currentOrderStatus : currentDlvryStatus;

  return (
    <SafeAreaView style={styles.container}>
      <Header title={isOutgoingFlow ? "Outgoing Delivery" : "Incoming Pick-up"} showBack={true} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
            <Text style={styles.label}>Order ID</Text>
            <Text style={styles.value}>#{orderId}</Text>
            <Text style={styles.label}>Current Status</Text>
            {/* 🔑 Display the Order Status for Outgoing flow, Delivery Status for Incoming flow */}
            <Text style={styles.valueHighlight}>{displayStatus || "Awaiting Status"}</Text> 
            <Text style={styles.label}>Delivery Mode</Text>
            <Text style={styles.value}>{deliveryType === 'app' ? "3rd Party App" : "Shop's Own Fleet"}</Text>
        </View>

        {/* ============================================================ */}
        {/* 🟢 OUTGOING FLOW (Ready for Delivery / Returning to Customer) */}
        {/* ============================================================ */}
        {isOutgoingFlow && (
            <View style={styles.actionContainer}>
                <Text style={styles.sectionHeader}>Deliver to Customer</Text>
                
                {/* 3rd Party App Flow */}
                {deliveryType === 'app' && (
                    <>
                        {currentOrderStatus === 'Ready for Delivery' && (
                            <>
                                <Text style={styles.instruction}>1. Book a rider to send laundry back to customer.</Text>
                                <TouchableOpacity style={styles.uploadArea} onPress={pickImage}>
                                    {bookingImage ? (
                                        <Image source={{ uri: bookingImage }} style={styles.previewImage} />
                                    ) : (
                                        <View style={styles.placeholder}>
                                            <Ionicons name="cloud-upload-outline" size={40} color="#007bff" />
                                            <Text style={styles.uploadText}>Upload Booking Screenshot</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.btn, !bookingImage && styles.disabledBtn]} 
                                    onPress={handleBookDelivery}
                                    disabled={!bookingImage}
                                >
                                    <Text style={styles.btnText}>Book Delivery</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {currentDlvryStatus === 'Out for Delivery' && (
                             <>
                                <View style={styles.successBanner}>
                                    <Ionicons name="checkmark-circle" size={24} color="#2ecc71" />
                                    <Text style={styles.successText}>Rider is on the way.</Text>
                                </View>
                                <TouchableOpacity style={styles.btnSuccess} onPress={handleDeliveredToCustomer}>
                                    <Text style={styles.btnText}>Confirm Delivered to Customer</Text>
                                </TouchableOpacity>
                             </>
                        )}
                    </>
                )}

                {/* Own Service Flow */}
                {deliveryType === 'own' && (
                    <>
                        <Text style={styles.instruction}>Drive to the customer's location to drop off the laundry.</Text>
                        <TouchableOpacity style={styles.btnPrimary} onPress={handleDeliveredToCustomer}>
                            <Text style={styles.btnText}>Delivered to Customer</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        )}

        {/* ============================================================ */}
        {/* 🟡 INCOMING FLOW (To Pick-up / Pick-up from Customer)             */}
        {/* ============================================================ */}
        {!isOutgoingFlow && (
            <View style={styles.actionContainer}>
                <Text style={styles.sectionHeader}>Pick-up from Customer</Text>

                {/* 3rd Party App Flow */}
                {deliveryType === 'app' && (
                    <>
                        {currentDlvryStatus === 'To Pick-up' && (
                            <>
                                <Text style={styles.instruction}>1. Book the rider to collect laundry.</Text>
                                <TouchableOpacity style={styles.uploadArea} onPress={pickImage}>
                                    {bookingImage ? (
                                        <Image source={{ uri: bookingImage }} style={styles.previewImage} />
                                    ) : (
                                        <View style={styles.placeholder}>
                                            <Ionicons name="cloud-upload-outline" size={40} color="#007bff" />
                                            <Text style={styles.uploadText}>Upload Booking Screenshot</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.btn, !bookingImage && styles.disabledBtn]} 
                                    onPress={handleBookPickup}
                                    disabled={!bookingImage}
                                >
                                    <Text style={styles.btnText}>Book Pick-up</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {currentDlvryStatus === 'Rider Booked' && (
                            <>
                                <View style={styles.successBanner}>
                                    <Ionicons name="checkmark-circle" size={24} color="#2ecc71" />
                                    <Text style={styles.successText}>Rider has been booked.</Text>
                                </View>
                                <TouchableOpacity style={styles.btnSuccess} onPress={handleDeliveredInShop}>
                                    <Text style={styles.btnText}>Delivered In Shop</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </>
                )}

                {/* Own Service Flow */}
                {deliveryType === 'own' && (
                    <>
                        <Text style={styles.instruction}>Drive to customer to collect laundry.</Text>
                        <TouchableOpacity style={styles.btnPrimary} onPress={handleArrivedAtCustomer}>
                            <Text style={styles.btnText}>Arrived at Customer</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  infoCard: {
    backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 20,
    shadowColor: "#000", shadowOpacity: 0.05, elevation: 2
  },
  label: { fontSize: 14, color: '#888', marginTop: 8 },
  value: { fontSize: 16, fontWeight: '600', color: '#333' },
  valueHighlight: { fontSize: 18, fontWeight: 'bold', color: '#007bff' },
  
  actionContainer: {
    backgroundColor: '#fff', padding: 20, borderRadius: 12,
    shadowColor: "#000", shadowOpacity: 0.05, elevation: 2
  },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  instruction: { fontSize: 15, color: '#555', marginBottom: 10, lineHeight: 22 },
  
  uploadArea: {
    height: 200, backgroundColor: '#f0f4f8', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    borderWidth: 1, borderColor: '#dae1e7', borderStyle: 'dashed'
  },
  placeholder: { alignItems: 'center' },
  uploadText: { color: '#007bff', marginTop: 10, fontWeight: '500' },
  previewImage: { width: '100%', height: '100%', borderRadius: 12 },
  
  btn: { backgroundColor: '#007bff', padding: 16, borderRadius: 8, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#5c6bc0', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnSuccess: { backgroundColor: '#2ecc71', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  disabledBtn: { backgroundColor: '#b0c4de' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  successBanner: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, backgroundColor: '#e8f5e9', padding: 10, borderRadius: 8 },
  successText: { marginLeft: 10, color: '#2ecc71', fontWeight: '600' }
});