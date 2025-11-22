// orderdetail.tsx 

import React, { useEffect, useState } from "react";
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, 
  ScrollView, Alert, Modal, TextInput, Image 
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage"; 

import { 
  fetchOrderDetails, 
  updateOrderStatus, 
  submitDeliveryBooking, 
  OrderDetail, 
  AddOnDetail 
} from "@/lib/orders"; 
import Header from "@/components/Header";

export default function OrderDetailScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [currentUser, setCurrentUser] = useState<{ UserID: string, UserRole: string } | null>(null);

  const [deliveryStep, setDeliveryStep] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [pickupFeeInput, setPickupFeeInput] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false); 

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const userStr = await AsyncStorage.getItem('user_session');
        if (userStr) {
            const parsedUser = JSON.parse(userStr);
            setCurrentUser(parsedUser);
        }

        if (orderId) {
          const foundOrder = await fetchOrderDetails(orderId);
          setOrder(foundOrder);
          
          if (foundOrder) {
             if (foundOrder.status === "To Pick-up") setDeliveryStep(2);
             if (foundOrder.status === "Delivered In Shop") setDeliveryStep(3);
          }
        }
      } catch (e) {
         console.error("Load error", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [orderId]);

  const calculatedSummary = order ? (() => {
    const servicePrice = parseFloat(order.servicePrice?.toString() || '') || 0.00;
    const deliveryFee = parseFloat(order.deliveryFee?.toString() || '') || 0.00;
    const addOnsTotal = order.addons.reduce((sum, addon) => sum + (parseFloat(addon.price?.toString() || '') || 0.00), 0.00);
    const total = servicePrice + addOnsTotal + deliveryFee;

    return {
        servicePrice: servicePrice.toFixed(2),
        addOnsTotal: addOnsTotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        total: total.toFixed(2),
    };
  })() : null;

  const handleBookNow = () => setDeliveryStep(1);
  const handleOpenModal = () => setModalVisible(true);

  const pickProofImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets) setProofImage(result.assets[0].uri);
  };

  const submitBookingDetails = async () => {
    if (!pickupFeeInput) { Alert.alert("Missing Info", "Please enter the pick-up fee."); return; }
    if (!proofImage) { Alert.alert("Missing Info", "Please attach a screenshot of the proof."); return; }
    if (!currentUser || !order) return;

    setIsUpdatingStatus(true);

    const feeValue = parseFloat(pickupFeeInput);
    let finalDeliveryFee = feeValue;
    if (order.deliveryType === "Pick-up & Delivery") {
      finalDeliveryFee = feeValue * 2;
    }

    const servicePrice = parseFloat(order.servicePrice?.toString() || '') || 0.00;
    const addOnsTotal = order.addons.reduce((sum, addon) => sum + (parseFloat(addon.price?.toString() || '') || 0.00), 0.00);
    const grandTotal = servicePrice + addOnsTotal + finalDeliveryFee;

    try {
        const success = await submitDeliveryBooking(
            order.orderId,
            finalDeliveryFee,
            grandTotal,
            proofImage,
            currentUser.UserID,
            currentUser.UserRole
        );

        if (success) {
            setOrder({ 
                ...order, 
                deliveryFee: finalDeliveryFee.toString(), 
                status: "To Pick-up" 
            });
            setModalVisible(false);
            setDeliveryStep(2); 
            Alert.alert("Success", `Booking confirmed! Total Invoice updated to ₱${grandTotal.toFixed(2)}`);
        } else {
            Alert.alert("Error", "Failed to save booking details.");
        }
    } catch (error) {
        Alert.alert("Error", "Network error.");
    } finally {
        setIsUpdatingStatus(false);
    }
  };

  const handleArrivedAtShop = async () => {
    if (!currentUser || !order) return;
    
    setIsUpdatingStatus(true);
    try {
        const success = await updateOrderStatus(
            order.orderId, 
            "Delivered In Shop", 
            currentUser.UserID, 
            currentUser.UserRole
        );

        if (success) {
            setDeliveryStep(3);
            setOrder({...order, status: "Delivered In Shop"});
        } else {
            Alert.alert("Error", "Failed to update status.");
        }
    } catch (error) {
        Alert.alert("Error", "Network error updating status.");
    } finally {
        setIsUpdatingStatus(false);
    }
  };

  if (loading) return <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><ActivityIndicator size="large" color="#004aad"/></View>;
  if (!order) return <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><Text>Order not found</Text></View>;

  const isPickupOrder = order.deliveryType === "Pick-up Only" || order.deliveryType === "Pick-up & Delivery";
  
  // Logic to show delivery controls
  const showDeliveryControls = isPickupOrder && (order.status === "Pending" || order.status === "To Pick-up");

  return (
    <View style={styles.container}>
      <Header title={`Order #${order.orderId}`} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <Text style={styles.customer}>{order.customerName}</Text>
          <Text style={styles.subText}>📞 {order.customerPhone}</Text>
          <Text style={styles.subText}>📍 {order.customerAddress || 'Address not provided'}</Text>
        </View>
        
        {order.status === "Rejected" && (
          <View style={[styles.section, { borderLeftColor: '#c82333', borderLeftWidth: 4 }]}>
            <Text style={[styles.sectionTitle, { color: "#c82333" }]}>⚠️ Order Rejected</Text>
            <Text style={styles.normalText}><Text style={{ fontWeight: "bold" }}>Reason: </Text>{order.reason || 'N/A'}</Text>
            {order.note && (<Text style={styles.normalText}><Text style={{ fontWeight: "bold" }}>Note: </Text>{order.note}</Text>)}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order & Service</Text>
          <Text style={styles.normalText}><Text style={{ fontWeight: "bold" }}>Service:</Text> {order.serviceName}</Text>
          <Text style={styles.normalText}><Text style={{ fontWeight: "bold" }}>Placed:</Text> {new Date(order.createdAt).toLocaleDateString()}</Text>
          <Text style={styles.normalText}><Text style={{ fontWeight: "bold" }}>Current Status:</Text> <Text style={styles.statusText}>{order.status}</Text></Text>
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: 'space-between' }}>
            <Text style={styles.sectionTitle}>Laundry Weight</Text>
            {/* 🔑 UPDATED: Edit Weight Button with Text */}
            {(order.status === "Delivered In Shop") && ( 
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/home/editWeight", params: { orderId: order.orderId, prevWeight: order.weight?.toString() },})}
                style={styles.editButton}
              >
                <Ionicons name="pencil" size={16} color="#004aad" style={{marginRight: 6}} />
                <Text style={styles.editButtonText}>Edit Weight</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.normalText}>Measured Weight: <Text style={{ fontWeight: "bold" }}>{order.weight} kg</Text></Text>
          {(order as any).instructions && (
             <Text style={styles.normalText}><Text style={{ fontWeight: "bold" }}>Instructions:</Text> {(order as any).instructions}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items & Details</Text>
          <Text style={styles.subTextDetail}>Fabrics</Text>
          {order.fabrics.length > 0 ? ( order.fabrics.map((fabric, index) => ( <Text key={`fab-${index}`} style={styles.listItem}>• {fabric}</Text> ))
          ) : ( <Text style={styles.listItem}>No fabrics specified.</Text> )}

          <Text style={styles.subTextDetail}>Add-Ons</Text>
          {order.addons.length > 0 ? ( order.addons.map((addon: AddOnDetail, index) => ( <Text key={`addon-${index}`} style={styles.listItem}>• {addon.name}</Text> ))
          ) : ( <Text style={styles.listItem}>No add-ons selected.</Text> )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
             <Text style={styles.normalText}>Service Price:</Text>
             <Text style={styles.summaryValue}>₱{calculatedSummary?.servicePrice}</Text>
          </View>
          <View style={styles.summaryRow}>
             <Text style={styles.normalText}>Total AddOns Cost:</Text>
             <Text style={styles.summaryValue}>₱{calculatedSummary?.addOnsTotal}</Text>
          </View>
          <View style={styles.summaryRow}>
             <Text style={styles.normalText}>Delivery Fee:</Text>
             <Text style={[styles.summaryValue, deliveryStep >= 2 && { color: '#28a745' }]}>₱{calculatedSummary?.deliveryFee}</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 }]}>
             <Text style={styles.totalText}>FINAL ORDER TOTAL</Text>
             <Text style={[styles.totalText, { color: '#c82333' }]}>₱{calculatedSummary?.total}</Text>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          <Text style={styles.normalText}>Type: {order.deliveryType}</Text>
          <Text style={styles.normalText}>Address: {order.customerAddress}</Text>
          
          {showDeliveryControls && (
            <View style={styles.deliveryFlowContainer}>
                {/* STEP 0: Initial */}
                {deliveryStep === 0 && (
                    <>
                        <Text style={styles.deliveryMessage}>Please book pick-up now</Text>
                        <TouchableOpacity style={styles.actionButton} onPress={handleBookNow}>
                            <Text style={styles.actionButtonText}>Book Now</Text>
                        </TouchableOpacity>
                    </>
                )}

                {/* STEP 1: Booking in progress */}
                {deliveryStep === 1 && (
                    <>
                        <Text style={[styles.deliveryMessage, { color: '#e67e22' }]}>Booking pick-up.....</Text>
                        <TouchableOpacity style={styles.actionButton} onPress={handleOpenModal}>
                            <Text style={styles.actionButtonText}>Done book pick-up</Text>
                        </TouchableOpacity>
                    </>
                )}

                {/* STEP 2: Rider En Route */}
                {deliveryStep === 2 && (
                    <>
                        <Text style={[styles.deliveryMessage, { color: '#2980b9' }]}>Done booking pick-up, rider going to the destination</Text>
                        {isUpdatingStatus ? ( <ActivityIndicator color="#28a745" /> ) : (
                            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#28a745' }]} onPress={handleArrivedAtShop}>
                                <Text style={styles.actionButtonText}>Delivered in shop</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal for Fee & Screenshot */}
      <Modal animationType="slide" transparent={true} visible={isModalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Confirm Booking Details</Text>
                <Text style={styles.label}>Enter Pick-up Fee:</Text>
                <TextInput 
                    style={styles.input}
                    placeholder="Amount (e.g., 150)"
                    keyboardType="numeric"
                    value={pickupFeeInput}
                    onChangeText={setPickupFeeInput}
                />
                {order?.deliveryType === "Pick-up & Delivery" && ( <Text style={styles.hintText}>Total Delivery Fee will be doubled (x2) automatically.</Text> )}

                <Text style={styles.label}>Attach Proof (Screenshot):</Text>
                <TouchableOpacity style={styles.uploadBox} onPress={pickProofImage}>
                    {proofImage ? ( <Image source={{ uri: proofImage }} style={styles.uploadedImage} /> ) : ( <><Ionicons name="cloud-upload-outline" size={32} color="#666" /><Text style={{color:'#666'}}>Tap to Upload</Text></> )}
                </TouchableOpacity>

                <View style={styles.modalButtons}>
                    <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                        <Text style={styles.modalBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtn, styles.submitBtn]} onPress={submitBookingDetails} disabled={isUpdatingStatus}>
                        {isUpdatingStatus ? <ActivityIndicator color="#fff" /> : <Text style={[styles.modalBtnText, { color: '#fff' }]}>Submit</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fcff", },
  scrollContent: { paddingBottom: 40, paddingHorizontal: 16, paddingTop: 15, },
  section: { backgroundColor: "#ffffff", padding: 18, borderRadius: 14, marginBottom: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10, color: "#004aad", letterSpacing: 0.3, },
  customer: { fontSize: 20, fontWeight: "700", color: "#1b263b", },
  subText: { fontSize: 14, color: "#555", marginTop: 2, },
  subTextDetail: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 10, marginBottom: 4, },
  normalText: { fontSize: 15, color: "#222", marginBottom: 6, lineHeight: 22, },
  listItem: { fontSize: 14, color: "#444", marginLeft: 10, marginBottom: 2, },
  statusText: { fontWeight: "bold", color: '#0077b6' },
  totalText: { fontSize: 17, fontWeight: "700", color: "#0077b6", },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, },
  summaryValue: { fontWeight: 'bold', color: '#333' },
  
  // 🔑 UPDATED: Edit Button Style
  editButton: { 
      backgroundColor: "#eaf5ff", 
      paddingVertical: 6, 
      paddingHorizontal: 12, 
      borderRadius: 20, 
      flexDirection: 'row', 
      alignItems: 'center' 
  },
  editButtonText: { 
      color: "#004aad", 
      fontWeight: "bold", 
      fontSize: 12 
  },

  deliveryFlowContainer: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center' },
  deliveryMessage: { fontSize: 16, fontWeight: '600', color: '#d35400', marginBottom: 10, textAlign: 'center' },
  actionButton: { backgroundColor: '#004aad', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 25, elevation: 2 },
  actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%', backgroundColor: '#fff', borderRadius: 15, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#004aad', marginBottom: 15, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 16, marginBottom: 5, backgroundColor: '#f9f9f9' },
  hintText: { fontSize: 12, color: '#e67e22', marginBottom: 15, fontStyle: 'italic' },
  uploadBox: { height: 120, borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 20, backgroundColor: '#fafafa' },
  uploadedImage: { width: '100%', height: '100%', borderRadius: 10 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  cancelBtn: { backgroundColor: '#f1f1f1' },
  submitBtn: { backgroundColor: '#004aad' },
  modalBtnText: { fontWeight: '600', fontSize: 15 }
});