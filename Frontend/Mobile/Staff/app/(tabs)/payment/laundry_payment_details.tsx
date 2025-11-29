import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";
import Header from "@/components/Header";
import { confirmServicePayment, fetchOrderDetails, OrderDetail } from "@/lib/orders";
import { getCurrentUser } from "@/lib/auth";

const parseAmount = (value: string | number | undefined | string[]): number => {
  const numericValue = parseFloat(String(value));
  return !isNaN(numericValue) ? numericValue : 0;
};

export default function LaundryPaymentDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { orderId, proofImage } = params; // Get image passed from previous screen if available

  const [loading, setLoading] = useState(false);
  const [fetchedDetails, setFetchedDetails] = useState<OrderDetail | null>(null);
  const [imageLoading, setImageLoading] = useState(true); // For smoother image loading

  const user = getCurrentUser();
  const userId = user?.UserID || "Staff";

  // Optional: Fetch fresh details if needed, otherwise rely on params
  useEffect(() => {
      const loadFreshDetails = async () => {
          // If proofImage wasn't passed correctly, try fetching full details
          if (!proofImage || proofImage === 'undefined') {
             try {
                 const data = await fetchOrderDetails(String(orderId));
                 setFetchedDetails(data);
             } catch(e) { console.error(e); }
          }
      };
      if(orderId) loadFreshDetails();
  }, [orderId, proofImage]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const success = await confirmServicePayment(String(orderId), userId, "Cashier");
      if (success) {
        Alert.alert("Success", "Laundry service payment confirmed!", [
          { text: "OK", onPress: () => router.back() }
        ]);
      } else {
        Alert.alert("Error", "Failed to confirm payment.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Determine values to display (Prioritize fetched data -> Params)
  const displayAmount = fetchedDetails?.totalAmount || params.totalAmount;
  const displayCustomer = fetchedDetails?.customerName || params.customerName;
  const displayMethod = fetchedDetails?.paymentMethodName || params.paymentMethodName;
  const displayStatus = fetchedDetails?.invoiceStatus || params.paymentStatus;
  
  // Handle Proof Image Logic
  // 1. Use param if valid
  // 2. Use fetched detail if valid
  // 3. Fallback to null
  let finalProofImage = null;
  if (proofImage && proofImage !== 'null' && proofImage !== 'undefined') {
      finalProofImage = String(proofImage);
  } else if (fetchedDetails?.invoiceProofImage) {
      finalProofImage = fetchedDetails.invoiceProofImage;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Review Service Payment" showBack={true} />
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Proof Image Section */}
        <Text style={styles.sectionLabel}>Payment Proof</Text>
        <View style={styles.imageContainer}>
          {finalProofImage ? (
            <Image 
              source={{ uri: finalProofImage }} 
              style={styles.proofImage} 
              resizeMode="contain"
              onLoadEnd={() => setImageLoading(false)}
            />
          ) : (
            <View style={styles.noImagePlaceholder}>
              <Ionicons name="image-outline" size={48} color="#ccc" />
              <Text style={styles.noImageText}>No Proof Image Uploaded</Text>
            </View>
          )}
          {/* Activity Indicator for Image */}
          {finalProofImage && imageLoading && (
             <View style={styles.loadingOverlay}>
                 <ActivityIndicator color="#004aad" />
             </View>
          )}
        </View>

        {/* Details Section */}
        <View style={styles.card}>
          <DetailRow label="Order ID" value={`#${orderId}`} />
          <DetailRow label="Customer" value={String(displayCustomer)} />
          <DetailRow label="Payment Method" value={displayMethod ? String(displayMethod) : "N/A"} />
          <DetailRow label="Status" value={String(displayStatus)} />
          
          <View style={styles.divider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Amount Received</Text>
            <Text style={styles.totalValue}>₱{parseAmount(displayAmount).toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons (Fixed at bottom) */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.confirmButton} 
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm Payment</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const DetailRow = ({ label, value }: { label: string, value: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 20, paddingBottom: 100 },
  sectionLabel: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, marginLeft: 4 },
  
  imageContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    height: 400, // Made simpler/taller for better view
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    position: 'relative'
  },
  proofImage: { width: '100%', height: '100%' },
  noImagePlaceholder: { alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', backgroundColor: '#f0f0f0' },
  noImageText: { color: '#999', marginTop: 8, fontSize: 14 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.5)' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: { fontSize: 14, color: '#666' },
  value: { fontSize: 14, color: '#333', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  totalValue: { fontSize: 24, fontWeight: 'bold', color: '#004aad' },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f3f5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: { color: '#495057', fontWeight: 'bold', fontSize: 16 },
  confirmButton: {
    flex: 2,
    backgroundColor: '#004aad',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});