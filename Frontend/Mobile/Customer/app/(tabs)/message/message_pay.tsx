// frontend/message/message_pay.tsx

import { Entypo, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useNavigation, useRouter, useFocusEffect } from "expo-router"; 
import React, { useLayoutEffect, useRef, useState, useCallback, useEffect } from "react"; 
import {
    FlatList,
    Image,
    KeyboardAvoidingView,
    Linking,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage"; 
import {
    fetchConversationHistory,
    sendMessage,
    ChatMessage,
} from "@/lib/messages"; 
import { fetchOrderDetails, CustomerOrderDetails, AddOnDetail, cancelCustomerOrder } from "@/lib/orders"; 
import { UserDetails } from "@/lib/auth"; 

// --- TYPES ---
interface InvoiceData {
    type: "INVOICE" | "INVOICE_FINALIZED"; 
    orderId: string;
    shopId: string;
    newWeight: string; 
    deliveryFee: string; // 🔑 Mandatory as per your request
    finalTotal: string;   
}

interface MessageUI extends ChatMessage {
    sender: 'user' | 'shop';
    invoiceData?: InvoiceData | null;
    isFinalized?: boolean; 
}

// --- HELPER FUNCTIONS ---
const formatTime = (timestamp: string | Date): string => {
    const date = (timestamp instanceof Date) ? timestamp : new Date(timestamp);
    if (isNaN(date.getTime())) { return "Invalid Date"; }
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true,
    }).replace('AM', 'am').replace('PM', 'pm');
};

// --- MAIN COMPONENT ---
export default function MessagePay() {
    const { conversationId, partnerName, partnerId } = useLocalSearchParams();
    const router = useRouter();
    const navigation = useNavigation();
    const flatListRef = useRef<FlatList<MessageUI>>(null); 
    
    const [messages, setMessages] = useState<MessageUI[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true); 
    const [currentUserId, setCurrentUserId] = useState<string | null>(null); 
    
    const [activeInvoiceDetails, setActiveInvoiceDetails] = useState<CustomerOrderDetails | null>(null);
    const [isFetchingOrder, setIsFetchingOrder] = useState(false);

    // 1. Hook: Load History
    const loadHistory = useCallback(async (userId: string, silent: boolean = false) => {
        if (!conversationId) return;
        if (!silent) setIsLoading(true); 

        try {
            const history = await fetchConversationHistory(conversationId as string);
            let lastInvoiceOrderId: string | undefined;

            const mappedHistory: MessageUI[] = history.map(msg => {
                let invoiceData: InvoiceData | null = null;
                let text = msg.text || undefined;
                
                if (text && (text.includes('"type":"INVOICE"') || text.includes('"type":"INVOICE_FINALIZED"'))) { 
                    const jsonStartIndex = text.indexOf('{');
                    const jsonString = text.substring(jsonStartIndex);
                    try {
                        const parsed = JSON.parse(jsonString);
                        if (parsed.type === "INVOICE" || parsed.type === "INVOICE_FINALIZED") {
                            invoiceData = parsed as InvoiceData;
                            text = text.substring(0, jsonStartIndex).trim(); 
                            lastInvoiceOrderId = parsed.orderId;
                        }
                    } catch (e) {
                        console.warn("Message JSON parse error:", text);
                    }
                }

                return {
                    ...msg,
                    id: msg.id,
                    text: text || undefined, 
                    image: msg.image || undefined,
                    time: formatTime(msg.time),
                    sender: msg.senderId === userId ? 'user' : 'shop',
                    invoiceData: invoiceData,
                } as MessageUI;
            });
            
            // Fetch persistent status
            let currentOrderDetails: CustomerOrderDetails | null = null;
            if (lastInvoiceOrderId) {
                currentOrderDetails = await fetchOrderDetails(lastInvoiceOrderId); 
                setActiveInvoiceDetails(currentOrderDetails);
            }
            
            // Apply Finalization Logic
            const finalMappedHistory = mappedHistory.map(msg => {
                let updatedMsg: MessageUI = { ...msg };

                if (currentOrderDetails) {
                    if (msg.invoiceData && msg.invoiceData.orderId === currentOrderDetails.orderId) {
                        if (currentOrderDetails.status === 'Cancelled' || 
                            currentOrderDetails.status === 'Rejected' || 
                            currentOrderDetails.status === 'Processing' || 
                            currentOrderDetails.status === 'Completed') {
                            updatedMsg.isFinalized = true; 
                        } 
                    }
                    if (msg.text && (msg.text.includes('cancelled') || msg.text.includes('rejected'))) {
                         updatedMsg.sender = msg.senderId === userId ? 'user' : 'shop';
                    }
                }
                return updatedMsg;
            });
            
            setMessages(finalMappedHistory);

        } catch (error) {
            console.error("Failed to load message history:", error);
        } finally {
            if (!silent) {
                setIsLoading(false);
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            }
        }
    }, [conversationId]);

    // 2. Hook: Auto-Polling
    useFocusEffect(
        useCallback(() => {
            if (!currentUserId) return;
            loadHistory(currentUserId, false);
            const intervalId = setInterval(() => {
                loadHistory(currentUserId, true); 
            }, 3000);
            return () => clearInterval(intervalId);
        }, [currentUserId, loadHistory])
    );

    // 3. Hook: Initial User Load
    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const storedUser = await AsyncStorage.getItem("user");
                if (storedUser) {
                    setCurrentUserId(JSON.parse(storedUser).UserID);
                } else {
                    setIsLoading(false);
                }
            } catch (error) {
                setIsLoading(false);
            }
        };
        fetchUserId();
    }, []); 

    // 4. Send Message
    const handleSend = useCallback(async (imageUri?: string) => {
        const textToSend = inputMessage.trim();
        if (!textToSend && !imageUri) return;
        if (!currentUserId || !partnerId) return alert("Error: Session error.");

        setInputMessage("");
        const now = new Date();
        const tempMsg: MessageUI = {
            id: Date.now().toString(),
            conversationId: conversationId as string,
            senderId: currentUserId,
            receiverId: partnerId as string,
            text: textToSend || undefined,
            image: imageUri,
            time: formatTime(now),
            status: "Sending", 
            sender: 'user', 
        };

        setMessages((prev) => [...prev, tempMsg]);
        flatListRef.current?.scrollToEnd({ animated: true });

        const sentMessage = await sendMessage(currentUserId, partnerId as string, textToSend, imageUri);
        if (sentMessage) loadHistory(currentUserId, true);
        else setMessages((prev) => prev.map(msg => msg.id === tempMsg.id ? { ...msg, status: 'Failed' } : msg));
    }, [inputMessage, currentUserId, partnerId, conversationId, loadHistory]); 

    // Image Pickers
    const handlePickImage = useCallback(async () => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.7 });
        if (!result.canceled) handleSend(result.assets[0].uri);
    }, [handleSend]);

    const handleTakePhoto = useCallback(async () => {
        const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
        if (!result.canceled) handleSend(result.assets[0].uri);
    }, [handleSend]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerStyle: { backgroundColor: "#87CEFA" },
            headerTintColor: "#000",
            headerTitle: () => <Text style={styles.headerTitle}>{partnerName}</Text>, 
            headerLeft: () => <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#000" /></TouchableOpacity>,
            headerRight: () => <TouchableOpacity onPress={() => Linking.openURL("tel:09123456789")}><Ionicons name="call" size={22} color="#000" style={{ marginRight: 15 }} /></TouchableOpacity>,
        });
    }, [navigation, partnerName]);

    const handleConfirm = (invoice: InvoiceData) => {
        router.push({ pathname: "/(tabs)/payment/invoice", params: { from: "message_pay", orderId: invoice.orderId, shopName: partnerName, totalAmount: invoice.finalTotal } });
    };

    const handleCancel = (invoice: InvoiceData) => {
        if (!currentUserId || !invoice.orderId) return;
        Alert.alert("Cancel Order", "Are you sure?", [
            { text: "No", style: "cancel" },
            { text: "Yes", style: "destructive", onPress: async () => {
                    const success = await cancelCustomerOrder(invoice.orderId, currentUserId);
                    if (success) { loadHistory(currentUserId); alert("Order cancelled."); }
                    else Alert.alert("Error", "Could not cancel order.");
                }
            }
        ]);
    };

    // --- 🎨 RENDER ITEM (Clean & Aligned) ---
    const renderMessage = ({ item }: { item: MessageUI }) => {
        const showInteractiveCard = item.invoiceData; 
        
        if (showInteractiveCard) {
            const isCurrentInvoice = item.invoiceData!.orderId === activeInvoiceDetails?.orderId;
            const details = isCurrentInvoice ? activeInvoiceDetails : null;

            // 🔑 LOGIC: Fetch Service Price from DB details
            const displayServicePrice = details?.servicePrice 
                ? parseFloat(details.servicePrice.toString()) 
                : 0.00;

            // 🔑 LOGIC: Fetch Delivery Fee from DB details (as requested)
            const displayDlvryFee = details?.deliveryFee 
                ? parseFloat(details.deliveryFee.toString()).toFixed(2) 
                : '0.00';

            return (
                <View style={[styles.invoiceCard, { alignSelf: 'flex-start' }]}> 
                    
                    {/* Header Section */}
                    <View style={styles.cardHeader}>
                        <View style={{flexDirection:'row', alignItems:'center'}}>
                            <Ionicons name="receipt-outline" size={18} color="#004aad" style={{marginRight:6}}/>
                            <Text style={styles.headerTitleText}>Final Invoice</Text>
                        </View>
                        <Text style={styles.orderIdText}>#{item.invoiceData!.orderId}</Text>
                    </View>

                    <View style={styles.cardBody}>
                        {isFetchingOrder || !details ? (
                            <View style={styles.loaderContainer}>
                                <ActivityIndicator size="small" color="#004aad" />
                                <Text style={styles.loadingText}>Fetching details...</Text>
                            </View>
                        ) : (
                            <>
                                {/* Service Row */}
                                <View style={styles.row}>
                                    <View style={{flex:1}}>
                                        <Text style={styles.labelMain}>Service</Text>
                                        <Text style={styles.subLabel}>{details.serviceName}</Text>
                                    </View>
                                    <Text style={styles.price}>₱{displayServicePrice.toFixed(2)}</Text>
                                </View>

                                {/* Weight Row */}
                                <View style={styles.row}>
                                    <Text style={styles.label}>Final Weight</Text>
                                    <Text style={styles.value}>{item.invoiceData!.newWeight} kg</Text>
                                </View>

                                {/* Add-ons Section */}
                                {details.addons.length > 0 && (
                                    <View style={styles.addonsContainer}>
                                        <Text style={styles.sectionHeader}>Add-ons</Text>
                                        {details.addons.map((addon, index) => (
                                            <View key={index} style={styles.rowSmall}>
                                                <Text style={styles.labelSmall}>• {addon.name}</Text>
                                                <Text style={styles.priceSmall}>+₱{parseFloat(addon.price.toString()).toFixed(2)}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* 🔑 Delivery Fee Row (Cleanly Aligned) */}
                                <View style={styles.row}>
                                    <Text style={styles.label}>Delivery Fee</Text>
                                    <Text style={styles.price}>₱{displayDlvryFee}</Text>
                                </View>

                                {/* Divider Line */}
                                <View style={styles.divider} />

                                {/* Total Row */}
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
                                    <Text style={styles.totalAmount}>₱{item.invoiceData!.finalTotal}</Text> 
                                </View>

                                {/* Buttons */}
                                {!item.isFinalized && (
                                    <View style={styles.buttonRow}>
                                        <TouchableOpacity style={styles.payBtn} onPress={() => handleConfirm(item.invoiceData!)}>
                                            <Text style={styles.payBtnText}>Pay Now</Text>
                                            <Ionicons name="arrow-forward" size={16} color="#fff" style={{marginLeft:4}}/>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.invoiceData!)}>
                                            <Text style={styles.cancelBtnText}>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                
                                {item.isFinalized && (
                                    <View style={styles.finalizedContainer}>
                                        <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
                                        <Text style={styles.finalizedText}>Order Paid / Finalized</Text>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                    <View style={styles.footer}>
                        <Text style={styles.messageTime}>{item.time}</Text>
                    </View>
                </View>
            );
        }
        
        // Standard Message Bubble
        return (
            <View style={[styles.messageBubble, item.sender === "user" ? styles.userBubble : styles.shopBubble]}>
                {item.text && <Text style={styles.messageText}>{item.text}</Text>}
                {item.image && <Image source={{ uri: item.image }} style={{ width: 200, height: 200, borderRadius: 10, marginTop: 5 }} />}
                <View style={styles.statusAndTime}>
                    {item.status === 'Sending' && <ActivityIndicator size="small" color="#555" style={{ marginRight: 5 }}/>}
                    <Text style={styles.messageTime}>{item.time}</Text>
                </View>
            </View>
        );
    };

    if (isLoading || currentUserId === null) return <View style={[styles.container, styles.loadingContainer]}><ActivityIndicator size="large" color="#1E90FF" /></View>;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    style={{ flex: 1, padding: 15 }}
                    contentContainerStyle={{ paddingBottom: 90 }}
                    renderItem={renderMessage}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
                <View style={styles.inputBar}>
                    <TouchableOpacity onPress={handlePickImage}><Ionicons name="image-outline" size={24} color="#555" /></TouchableOpacity>
                    <TouchableOpacity onPress={handleTakePhoto}><Ionicons name="camera-outline" size={24} color="#555" style={{ marginLeft: 10 }} /></TouchableOpacity>
                    <TextInput placeholder="Type a message" value={inputMessage} onChangeText={setInputMessage} style={styles.textInput} placeholderTextColor="#888" />
                    <TouchableOpacity onPress={() => handleSend()}><Ionicons name="send" size={24} color="#1E90FF" style={{ marginLeft: 10 }} /></TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// --- UPDATED CLEAN STYLES ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f2f4f7" },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    loaderContainer: { padding: 20, alignItems: 'center', justifyContent: 'center' },
    loadingText: { marginTop: 10, color: '#888', fontSize: 12 },
    
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#000", marginLeft: 10 },

    // Bubble Styles
    messageBubble: { padding: 12, borderRadius: 16, marginVertical: 4, maxWidth: "80%", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    shopBubble: { backgroundColor: "#fff", alignSelf: "flex-start", borderTopLeftRadius: 4 },
    userBubble: { backgroundColor: "#004aad", alignSelf: "flex-end", borderTopRightRadius: 4 },
    messageText: { fontSize: 15, color: "#333", lineHeight: 22 },
    statusAndTime: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }, 
    messageTime: { fontSize: 10, color: "#999", textAlign: "right" },

    // --- 🧾 INVOICE CARD STYLES ---
    invoiceCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        marginVertical: 10,
        width: "85%", 
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eef2f5'
    },
    cardHeader: {
        backgroundColor: "#f0f8ff", 
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e6f0fa'
    },
    headerTitleText: { fontSize: 14, fontWeight: "700", color: "#004aad" },
    orderIdText: { fontSize: 14, fontWeight: "600", color: "#555" },
    
    cardBody: { padding: 16 },

    // Rows
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    rowSmall: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    
    labelMain: { fontSize: 14, fontWeight: '600', color: '#333' },
    label: { fontSize: 14, color: '#555' },
    subLabel: { fontSize: 12, color: '#777', marginTop: 2 },
    value: { fontSize: 14, fontWeight: '600', color: '#222' },
    price: { fontSize: 15, fontWeight: '700', color: '#222' },
    
    // Addons
    addonsContainer: { backgroundColor: '#f9fafb', padding: 10, borderRadius: 8, marginBottom: 10 },
    sectionHeader: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 6, textTransform: 'uppercase' },
    labelSmall: { fontSize: 13, color: '#444', flex: 1 },
    priceSmall: { fontSize: 13, fontWeight: '600', color: '#27ae60' },

    // Totals
    divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
    totalLabel: { fontSize: 16, fontWeight: '800', color: '#222' },
    totalAmount: { fontSize: 20, fontWeight: '900', color: "#004aad" },

    // Buttons
    buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, gap: 10 },
    payBtn: { backgroundColor: "#004aad", paddingVertical: 12, borderRadius: 10, flex: 2, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    payBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    cancelBtn: { backgroundColor: "#fff", paddingVertical: 12, borderRadius: 10, flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
    cancelBtnText: { color: "#e74c3c", fontWeight: "700", fontSize: 14 },

    // Finalized State
    finalizedContainer: { marginTop: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, backgroundColor: '#eafaf1', borderRadius: 8 },
    finalizedText: { marginLeft: 6, color: '#27ae60', fontWeight: '600', fontSize: 14 },

    footer: { paddingHorizontal: 16, paddingBottom: 12 },

    // Input Bar
    inputBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 10, paddingHorizontal: 15, borderTopWidth: 1, borderTopColor: '#eee' },
    textInput: { flex: 1, marginHorizontal: 10, fontSize: 16, paddingVertical: 8, color: "#000", backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 15 },
});