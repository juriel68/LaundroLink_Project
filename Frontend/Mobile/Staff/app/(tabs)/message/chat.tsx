//chat.tsx of Staff
import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import {
  fetchConversationHistory,
  sendMessage,
  markMessagesAsRead,
  ChatMessage as ApiMessage,
} from "@/lib/messages";
import { getCurrentUser } from "@/lib/auth";
import Header from "@/components/Header";
import { fetchOrderDetails, OrderDetail, AddOnDetail } from "@/lib/orders"; // Added Order imports

// --- TYPES ---

type InvoiceData = {
    orderId: string;
    newWeight: string; 
    newTotal: string; 
};

type UIMessage = {
  id: string | number;
  sender: "me" | "other";
  text?: string;
  image?: string;
  time: string;
    isInvoice?: boolean; 
    invoiceData?: InvoiceData | null;
};

export default function ChatScreen() {
  const { conversationId, partnerName, partnerId } =
    useLocalSearchParams<{
      conversationId: string;
      partnerName: string;
      partnerId: string;
    }>();

  const user = getCurrentUser();
  const userId = user?.UserID;

  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
 
    const [activeInvoiceDetails, setActiveInvoiceDetails] = useState<OrderDetail | null>(null);
    const [isFetchingOrder, setIsFetchingOrder] = useState(false);


    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
    
    // Helper to fetch details (similar to customer side, but local to staff chat)
    const fetchDetails = useCallback(async (orderId: string) => {
        setIsFetchingOrder(true);
        try {
            const details = await fetchOrderDetails(orderId);
            setActiveInvoiceDetails(details);
        } catch (e) {
            console.error("Failed to fetch invoice details for staff:", e);
        } finally {
            setIsFetchingOrder(false);
        }
    }, []); 

  const loadHistory = useCallback(async () => {
    if (userId && conversationId) {
      await markMessagesAsRead(conversationId, userId);
      const apiHistory: ApiMessage[] = await fetchConversationHistory(conversationId);

        let lastInvoiceOrderId: string | undefined;

      const uiMessages: UIMessage[] = apiHistory.map((msg) => {
            let invoiceData: any | null = null;
            let isInvoice = false;
            let text = msg.text;

            // --- Invoice Parsing Logic ---
            if (text && text.includes('{"type":"INVOICE"')) {
                const jsonStartIndex = text.indexOf('{');
                const jsonString = text.substring(jsonStartIndex);
                
                try {
                    const parsed = JSON.parse(jsonString);
                    if (parsed.type === "INVOICE") {
                        invoiceData = parsed;
                        isInvoice = true;
                        // Keep the readable prefix only
                        text = text.substring(0, jsonStartIndex).trim() || 'Order Confirmed: Final Invoice'; 
                        lastInvoiceOrderId = parsed.orderId;
                    }
                } catch (e) {
                    // Ignore malformed JSON
                }
            }
            // --- End Parsing Logic ---

            return {
                id: msg.id,
                sender: msg.senderId === userId ? "me" : "other",
                text: text,
                image: msg.image,
                time: formatTime(new Date(msg.time)),
                isInvoice: isInvoice,
                invoiceData: invoiceData,
            };
        });

      setMessages(uiMessages);
      setLoading(false);
        
        // Trigger fetch for details for the last invoice
        if (lastInvoiceOrderId) {
            fetchDetails(lastInvoiceOrderId);
        }

    }
  }, [conversationId, userId, fetchDetails]); 

  useEffect(() => {
    setLoading(true);
    loadHistory();
  }, [loadHistory]);
  
  useEffect(() => {
    if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: false }); // Use false for initial load
    }
  }, [messages]);


  const handleSend = async (text: string, imageUrl?: string) => {
    if ((!text.trim() && !imageUrl) || !userId || !partnerId) return;

    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: UIMessage = {
      id: tempId,
      sender: "me",
      text: text,
      image: imageUrl,
      time: formatTime(new Date()),
    };
    
    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    if (text) setInput("");

    const newMessage = await sendMessage(userId, partnerId, text, imageUrl);

    if (newMessage) {
      await loadHistory(); 
    } else {
      Alert.alert("Error", "Failed to send message. Please try again.");
      setMessages(prev => prev.filter(m => m.id !== tempId));
      if (text) setInput(text);
    }
  };

  const pickImage = async (useCamera: boolean) => {
    const requestPermission = useCamera
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;
      
    const { status } = await requestPermission();
    if (status !== "granted") {
      Alert.alert("Permission required", `Allow access to your ${useCamera ? 'camera' : 'photos'}.`);
      return;
    }

    const launchAction = useCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const result = await launchAction({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      handleSend("", imageUri);
    }
  };

  return (
    <View style={styles.container}>
      <Header title={partnerName as string} />

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#007bff" />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatContainer}
            contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 10 }}
          >
            {messages.map((msg, index) => {
                
                const isDetailReady = activeInvoiceDetails && activeInvoiceDetails.orderId === msg.invoiceData?.orderId;
                const details = isDetailReady ? activeInvoiceDetails : null;
                const isFetching = isFetchingOrder && msg.invoiceData?.orderId === activeInvoiceDetails?.orderId;
                
                // Safely parse numbers for display
                const displayServicePrice = details?.servicePrice 
                    ? parseFloat(details.servicePrice.toString()).toFixed(2) 
                    : '0.00';


                // 🔑 FIX RENDER LOGIC: If it's an invoice sent by 'me' (Staff), render the rich card
                if (msg.isInvoice && msg.sender === 'me') {
                    return (
                        <View key={`${msg.id}-${index}`} style={[styles.messageRow, styles.myRow]}>
                            <View style={[styles.messageBubble, styles.myMessageBubble, styles.invoiceCard]}>
                                
                                {/* 1. HEADER PREFIX */}
                                <Text style={styles.myInvoiceHeader}>
                                    {'Invoice for Order #' + msg.invoiceData!.orderId}
                                </Text>

                                {/* 2. LOADER/DETAILS */}
                                {isFetching || !details ? (
                                    <View style={styles.loaderContainer}>
                                        <ActivityIndicator size="small" color="#fff" />
                                        <Text style={styles.loadingText}>Fetching details...</Text>
                                    </View>
                                ) : (
                                    <>
                                        {/* SERVICE AND PRICE */}
                                        <View style={styles.detailRowPrice}>
                                            <Text style={styles.detailText}>Service: {details.serviceName}</Text>
                                            <Text style={styles.detailPrice}>₱{displayServicePrice}</Text>
                                        </View>

                                        {/* WEIGHT */}
                                        <Text style={styles.detailText}>Weight: {msg.invoiceData!.newWeight} kg</Text>
                                        
                                        {/* 🔑 FIX 1: DISPLAY FABRICS LIST */}
                                        {details.fabrics.length > 0 && (
                                            <>
                                                <Text style={[styles.detailText, styles.detailSectionTitle]}>Fabrics:</Text>
                                                {details.fabrics.map((fabric, idx) => (
                                                    <Text key={`fab-${idx}`} style={styles.listItem}>• {fabric}</Text>
                                                ))}
                                            </>
                                        )}

                                        {/* 🔑 FIX 2: DISPLAY ADD-ONS LIST */}
                                        {details.addons.length > 0 && (
                                            <>
                                                <Text style={[styles.detailText, styles.detailSectionTitle]}>Add-Ons:</Text>
                                                {details.addons.map((addon: AddOnDetail, idx) => {
                                                    const displayAddOnPrice = parseFloat(addon.price.toString()).toFixed(2);
                                                    return (
                                                        <View key={`add-${idx}`} style={styles.detailRowPrice}>
                                                            <Text style={styles.listItem}>• {addon.name}</Text>
                                                            <Text style={styles.detailPrice}>+ ₱{displayAddOnPrice}</Text>
                                                        </View>
                                                    );
                                                })}
                                            </>
                                        )}

                                        {/* TOTAL DUE */}
                                        <View style={[styles.totalBox]}>
                                            <Text style={styles.totalLabel}>TOTAL DUE:</Text>
                                            <Text style={styles.totalAmount}>₱{msg.invoiceData!.newTotal}</Text>
                                        </View>
                                    </>
                                )}
                                <Text style={styles.myMessageTime}>{msg.time}</Text>
                            </View>
                        </View>
                    );
                } 
                // 🔑 FALLBACK: Render standard text/image bubbles for all other messages (Customer replies or simple Staff text)
                return (
                    <View
                        key={`${msg.id}-${index}`}
                        style={[
                            styles.messageRow,
                            msg.sender === "me" ? styles.myRow : styles.otherRow,
                        ]}
                    >
                        <View
                            style={[
                                styles.messageBubble,
                                msg.sender === "me"
                                    ? styles.myMessageBubble
                                    : styles.otherMessageBubble,
                            ]}
                        >
                            <Text style={
                                msg.sender === "me"
                                    ? styles.myMessageText
                                    : styles.otherMessageText
                                }
                            >
                                {msg.text}
                            </Text>
                            {msg.image && (<Image source={{ uri: msg.image }} style={styles.chatImage} />)}
                            <Text style={msg.sender === 'me' ? styles.myMessageTime : styles.otherMessageTime}>
                                {msg.time}
                            </Text>
                        </View>
                    </View>
                );
            })}
          </ScrollView>

          {/* The input container is now INSIDE the KeyboardAvoidingView */}
          <View style={styles.inputContainer}>
            <TouchableOpacity onPress={() => pickImage(true)} style={styles.iconButton}>
              <Ionicons name="camera-outline" size={26} color="#555" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => pickImage(false)} style={styles.iconButton}>
              <Ionicons name="image-outline" size={26} color="#555" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              multiline
            />
            
            <TouchableOpacity onPress={() => handleSend(input)} style={styles.sendBtn}>
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}


// Styles remain largely the same, just ensure the container has flex: 1
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" }, 
  chatContainer: { flex: 1 }, 
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  // Alignment (Staff=Right, Customer=Left)
  myRow: {
    justifyContent: 'flex-end',
  },
  otherRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    maxWidth: "80%",
  },
  myMessageBubble: {
    backgroundColor: "#45b2f1ff", // Staff Blue
    borderTopRightRadius: 6,
  },
  otherMessageBubble: {
    backgroundColor: "#fff", // Customer White/Gray
    borderTopLeftRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  myMessageText: { color: "#fff", fontSize: 15, lineHeight: 22 },
  otherMessageText: { color: "#222", fontSize: 15, lineHeight: 22 },
  myMessageTime: {
    fontSize: 11,
    color: "#e0e0e0",
    marginTop: 4,
    textAlign: "right",
  },
  otherMessageTime: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
    textAlign: "right",
  },
  chatImage: {
    width: 200,
    height: 200,
    borderRadius: 15,
    marginTop: 5,
  },
  // --- Invoice Card Styles (Staff Side) ---
  invoiceCard: {
      padding: 12,
      maxWidth: "90%",
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.4)',
  },
  myInvoiceHeader: {
      color: '#fff',
      fontWeight: 'bold',
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.3)',
      paddingBottom: 5,
  },
  detailRowPrice: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
  },
  detailText: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: 14,
      fontWeight: '500',
  },
  detailPrice: {
      color: '#fff',
      fontWeight: '600',
  },
  listItem: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 14,
      marginLeft: 5,
  },
  // 🔑 Added style for section headers
  detailSectionTitle: {
      fontWeight: 'bold',
      marginTop: 8, 
      marginBottom: 2,
  },
  totalBox: {
      backgroundColor: 'rgba(0,0,0,0.1)',
      padding: 6,
      borderRadius: 8,
      marginTop: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
  },
  totalLabel: {
      color: '#fff',
      fontWeight: 'bold',
  },
  totalAmount: {
      color: '#fff',
      fontWeight: 'bold',
  },
  // Container for stuck loader display
  loaderContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
  },
  loadingText: {
      color: '#fff',
      marginLeft: 10,
      fontSize: 14,
  },
  // --- Input Styles ---
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    borderTopColor: "#e0e0e0",
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    color: '#222',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 15,
    maxHeight: 100,
  },
  iconButton: {
    padding: 8,
  },
  sendBtn: {
    backgroundColor: "#45b2f1ff",
    padding: 12,
    borderRadius: 50,
    marginLeft: 10,
  },
});