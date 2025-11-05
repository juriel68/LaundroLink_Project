// message_pay.tsx
// frontend/message/message_pay.tsx

import { Entypo, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
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
    type: "INVOICE";
    orderId: string;
    shopId: string;
    newWeight: string; 
    newTotal: string; 
}
interface MessageUI extends ChatMessage {
    sender: 'user' | 'shop';
    invoiceData?: InvoiceData | null;
    // Flag set locally and checked against persistent status to hide buttons
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
    
    // State to hold the most recent details fetched from the DB
    const [activeInvoiceDetails, setActiveInvoiceDetails] = useState<CustomerOrderDetails | null>(null);
    const [isFetchingOrder, setIsFetchingOrder] = useState(false);

    // 1. Hook: Fetches and stores the full order details. (Stable and Typed)
    const fetchAndSetOrderDetails = useCallback(async (orderId: string): Promise<CustomerOrderDetails | null> => {
        // We rely on the local state setter, which is stable.
        setIsFetchingOrder(true);
        try {
            const details = await fetchOrderDetails(orderId);
            if (details) {
                setActiveInvoiceDetails(details);
                return details;
            } else {
                return null;
            }
        } catch (e) {
            console.error("Fetch order details failed:", e);
            Alert.alert("Error", "Could not load order details for invoice.");
            return null;
        } finally {
            setIsFetchingOrder(false);
        }
    }, []); // 🔑 FIX: Empty dependency array ensures this function is stable.


    // 2. Hook: Send Message Handler (Stable)
    const handleSend = useCallback(async (imageUri?: string) => {
        const textToSend = inputMessage.trim();
        if (!textToSend && !imageUri) return;
        if (!currentUserId || !partnerId) return alert("Error: Session error. Please log in.");

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

        const sentMessage = await sendMessage(
            currentUserId,
            partnerId as string,
            textToSend || undefined,
            imageUri
        );

        if (sentMessage) {
            setMessages((prev) => 
                prev.map(msg => msg.id === tempMsg.id 
                    ? { 
                        ...msg, 
                        id: sentMessage.id, 
                        status: sentMessage.status, 
                        time: formatTime(sentMessage.time),
                        sender: 'user', 
                      } 
                    : msg
                )
            );
        } else {
            setMessages((prev) => 
                prev.map(msg => msg.id === tempMsg.id ? { ...msg, status: 'Failed' } : msg)
            );
        }
    }, [inputMessage, currentUserId, partnerId, conversationId]); 


    // 3. Hook: Image Picker Handlers (Stable)
    const handlePickImage = useCallback(async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });
        if (!result.canceled) { handleSend(result.assets[0].uri); }
    }, [handleSend]);


    const handleTakePhoto = useCallback(async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) { alert("Camera permission is required to take photos"); return; }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.7,
        });
        if (!result.canceled) { handleSend(result.assets[0].uri); }
    }, [handleSend]);


    // 4. Hook: Data Fetching Effect (Stable)
    const loadHistory = useCallback(async (userId: string) => {
        if (!conversationId) return;
        setIsLoading(true);
        try {
            const history = await fetchConversationHistory(conversationId as string);
            
            let lastInvoiceOrderId: string | undefined;

            // Step 1: Map history and find the last Invoice ID
            const mappedHistory: MessageUI[] = history.map(msg => {
                let invoiceData: InvoiceData | null = null;
                let text = msg.text || undefined;
                
                if (text && text.includes('{"type":"INVOICE"')) { 
                    const jsonStartIndex = text.indexOf('{');
                    const jsonString = text.substring(jsonStartIndex);
                    
                    try {
                        const parsed = JSON.parse(jsonString) as { type: string, orderId: string };
                        if (parsed.type === "INVOICE") {
                            invoiceData = parsed as InvoiceData;
                            // Preserve the readable prefix in the 'text' property
                            text = text.substring(0, jsonStartIndex).trim(); 
                            lastInvoiceOrderId = parsed.orderId;
                        }
                    } catch (e) {
                        console.warn("Message text contains JSON but couldn't be parsed:", text);
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
            
            // Step 2: Fetch the persistent status data for the most recent order
            let currentOrderDetails: CustomerOrderDetails | null = null;
            if (lastInvoiceOrderId) {
                currentOrderDetails = await fetchOrderDetails(lastInvoiceOrderId); 
                setActiveInvoiceDetails(currentOrderDetails);
            }
            
            // Step 3: Loop through messages *again* to override based on persistent status
            const finalMappedHistory = mappedHistory.map(msg => {
                // Use a temporary object for mutation to ensure type safety on return
                let updatedMsg: MessageUI = { ...msg };

                if (currentOrderDetails) {
                    // Check if this message is the invoice card
                    if (msg.invoiceData && msg.invoiceData.orderId === currentOrderDetails.orderId) {
                        
                        // If status is Cancelled/Rejected, set isFinalized=true to hide buttons
                        if (currentOrderDetails.status === 'Cancelled' || currentOrderDetails.status === 'Rejected') {
                            updatedMsg.isFinalized = true; 
                        } 
                    }
                    
                    // Check if the message is the final static cancellation message inserted by the backend
                    if (msg.text && (msg.text.includes('cancelled') || msg.text.includes('rejected'))) {
                         // Ensure the message bubble is styled as the customer if the customer sent it
                         updatedMsg.sender = msg.senderId === userId ? 'user' : 'shop';
                    }
                }
                return updatedMsg;
            });
            
            setMessages(finalMappedHistory);

        } catch (error) {
            console.error("Failed to load message history:", error);
            Alert.alert("Error", "Failed to load message history.");
        } finally {
            setIsLoading(false);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [conversationId, fetchAndSetOrderDetails]);


    // 5. Hook: User Authentication
    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const storedUser = await AsyncStorage.getItem("user");
                if (storedUser) {
                    const userDetails: UserDetails = JSON.parse(storedUser);
                    const userId = userDetails.UserID;
                    setCurrentUserId(userId);
                    loadHistory(userId); 
                } else {
                    setCurrentUserId(null);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Error retrieving user ID from storage:", error);
                setIsLoading(false);
            }
        };
        fetchUserId();
    }, [loadHistory]); 


    // 6. Hook: Set Header
    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerStyle: { backgroundColor: "#87CEFA" },
            headerTintColor: "#000",
            headerTitle: () => <Text style={styles.headerTitle}>{partnerName}</Text>, 
            headerLeft: () => (
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
            ),
            headerRight: () => (
                <TouchableOpacity onPress={() => Linking.openURL("tel:09123456789")}>
                    <Ionicons name="call" size={22} color="#000" style={{ marginRight: 15 }} />
                </TouchableOpacity>
            ),
        });
    }, [navigation, partnerName]);


    // Handlers
    const handleConfirm = (invoice: InvoiceData) => {
        router.push({
            pathname: "/(tabs)/payment/pay",
            params: { 
                from: "message_pay", 
                orderId: invoice.orderId,
                shopName: partnerName, 
                totalAmount: invoice.newTotal
            }, 
        });
    };

    // FIXED: handleCancel now uses simplified Yes/No buttons and updates state instantly
    const handleCancel = (invoice: InvoiceData) => {
        
        if (!currentUserId || !invoice.orderId) {
            Alert.alert("Error", "Cannot cancel: Missing user or order details.");
            return;
        }
        
        const orderToCancel = invoice.orderId;
        const userId = currentUserId;

        Alert.alert(
            "Cancel Order", 
            "Are you sure you want to cancel this order? This action cannot be undone.",
            [
                { 
                    text: "No", 
                    style: "cancel" 
                },
                { 
                    text: "Yes", 
                    style: "destructive", 
                    onPress: async () => {
                        const success = await cancelCustomerOrder(orderToCancel, userId);
    
                        if (success) {
                            const now = new Date();
                            const newTime = formatTime(now);
                            
                            // 1. Update the local state to hide buttons on the card
                            setMessages(prevMessages => 
                                prevMessages.map(msg => {
                                    if (msg.invoiceData?.orderId === orderToCancel) {
                                        // Set isFinalized: true to hide buttons on the card
                                        return {
                                            ...msg,
                                            isFinalized: true, 
                                            time: newTime,
                                        };
                                    }
                                    return msg;
                                })
                            );
                            
                            // 2. Trigger the fetch again to load the *new* static cancellation message from the backend
                            await loadHistory(currentUserId);

                            alert("Your order has been successfully cancelled.");
                        } else {
                            Alert.alert("Cancellation Failed", "Could not cancel order. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    // 7. Render Functions
    const renderMessage = ({ item }: { item: MessageUI }) => {
        
        const showInteractiveCard = item.invoiceData; 
        
        if (showInteractiveCard) {
            
            const isCurrentInvoice = item.invoiceData!.orderId === activeInvoiceDetails?.orderId;
            const details = isCurrentInvoice ? activeInvoiceDetails : null;

            // Safely parse servicePrice
            const displayServicePrice = details?.servicePrice 
                ? parseFloat(details.servicePrice.toString()).toFixed(2) 
                : '0.00';


            return (
                <View style={[styles.invoiceCard, styles.shopBubble, { alignSelf: 'flex-start' }]}> 
                    
                    <Text style={styles.invoiceHeader}>✅ Order Confirmed: Final Invoice</Text>
                    
                    {isFetchingOrder || !details ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="small" color="#1E90FF" />
                            <Text style={styles.loadingText}>{isFetchingOrder ? 'Loading order details...' : 'Fetching details...'}</Text>
                        </View>
                    ) : (
                        <>
                            {/* Service Name and Price (FIXED) */}
                            <View style={styles.detailRowPrice}>
                                <Text style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Service:</Text> {details.serviceName}
                                </Text>
                                <Text style={styles.detailPrice}>
                                    ₱{displayServicePrice}
                                </Text>
                            </View>

                            <Text style={styles.detailRow}><Text style={styles.detailLabel}>Final Weight:</Text> {item.invoiceData!.newWeight} kg</Text>
                            <Text style={styles.detailRow}><Text style={styles.detailLabel}>Fabric(s):</Text> {details.fabrics.join(', ') || 'N/A'}</Text>
                            
                            {/* Display Add-Ons with Prices (FIXED) */}
                            {details.addons.length > 0 ? (
                                <>
                                    <Text style={[styles.detailLabel]}>Add-ons:</Text>
                                    {details.addons.map((addon: AddOnDetail, index: number) => {
                                        // Safely parse addon.price
                                        const displayAddOnPrice = addon.price 
                                            ? parseFloat(addon.price.toString()).toFixed(2) 
                                            : '0.00'; 
                                            
                                        return (
                                            <View key={index} style={styles.detailRowPrice}>
                                                <Text style={styles.listItem}>• {addon.name}</Text>
                                                <Text style={styles.detailPrice}>+ ₱{displayAddOnPrice}</Text>
                                            </View>
                                        );
                                    })}
                                </>
                            ) : (
                                <Text style={styles.detailRow}><Text style={styles.detailLabel}>Add-on(s):</Text> None</Text>
                            )}

                            <Text style={styles.detailRow}><Text style={styles.detailLabel}>Instructions:</Text> {details.instructions || 'None'}</Text>

                            <View style={styles.totalBox}>
                                <Text style={styles.totalLabel}>TOTAL AMOUNT DUE:</Text>
                                <Text style={styles.totalAmount}>₱{item.invoiceData!.newTotal}</Text>
                            </View>

                            {/* Conditionally render buttons based on isFinalized flag */}
                            {!item.isFinalized && (
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity 
                                        style={styles.payBtn} 
                                        onPress={() => handleConfirm(item.invoiceData!)}
                                    >
                                        <Text style={styles.payBtnText}>Proceed to Pay</Text>
                                    </TouchableOpacity>
                                    {/* FIX: Pass item.invoiceData to handleCancel */}
                                    <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.invoiceData!)}>
                                        <Text style={styles.cancelBtnText}>Cancel Order</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            
                            {/* NEW: Display static status if finalized */}
                            {item.isFinalized && (
                                <View style={styles.cancelledBox}>
                                    <Text style={styles.cancelledText}>
                                        Order Finalized: No Action Required.
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                    <View style={styles.statusAndTime}><Text style={styles.messageTime}>{item.time}</Text></View>
                </View>
            );
        }
        
        // Fallback to regular message bubble rendering (handles the static "❌ The order was cancelled" message)
        return (
            <View
                style={[
                    styles.messageBubble,
                    item.sender === "user" ? styles.userBubble : styles.shopBubble,
                ]}
            >
                {/* This renders the static "Order was cancelled" message or any other plain text */}
                {item.text && <Text style={styles.messageText}>{item.text}</Text>}
                {item.image && (
                    <Image
                        source={{ uri: item.image }}
                        style={{ width: 200, height: 200, borderRadius: 10, marginTop: 5 }}
                    />
                )}
                <View style={styles.statusAndTime}>
                    {item.status === 'Sending' && <ActivityIndicator size="small" color="#555" style={{ marginRight: 5 }}/>}
                    <Text style={styles.messageTime}>{item.time}</Text>
                </View>
            </View>
        );
    };

    // 8. Loading/Error States
    if (isLoading || currentUserId === null) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#1E90FF" />
            </View>
        );
    }

    // 9. Main Render
    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    style={{ flex: 1, padding: 15 }}
                    contentContainerStyle={{ paddingBottom: 90 }}
                    renderItem={renderMessage}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Input Bar Code */}
                <View style={styles.inputBar}>
                    <TouchableOpacity onPress={handlePickImage}>
                        <Ionicons name="image-outline" size={24} color="#555" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleTakePhoto}>
                        <Ionicons name="camera-outline" size={24} color="#555" style={{ marginLeft: 10 }} />
                    </TouchableOpacity>
                    <Entypo name="plus" size={24} color="#555" style={{ marginLeft: 10 }} />

                    <TextInput
                        placeholder="Type a message"
                        value={inputMessage}
                        onChangeText={setInputMessage}
                        style={styles.textInput}
                        placeholderTextColor="#888"
                    />
                    <Ionicons name="happy-outline" size={24} color="#555" />
                    <Ionicons name="mic-outline" size={24} color="#555" style={{ marginLeft: 10 }} />
                    <TouchableOpacity onPress={() => handleSend()}>
                        <Ionicons name="send" size={24} color="#1E90FF" style={{ marginLeft: 10 }} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f9f9f9" },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: "bold", color: "#000", marginLeft: 10 },
    
    // --- Message Bubbles ---
    messageBubble: {
        padding: 12,
        borderRadius: 15,
        marginVertical: 5,
        maxWidth: "80%",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    shopBubble: { backgroundColor: "#eee", alignSelf: "flex-start" },
    userBubble: { backgroundColor: "#87CEFA", alignSelf: "flex-end" },
    messageText: { fontSize: 16, color: "#000" },
    // 🔑 NEW STYLE: For the prefix text
    messageTextPrefix: { fontSize: 15, color: '#000', marginBottom: 10, alignSelf: 'flex-start' },
    statusAndTime: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }, 
    messageTime: {
        fontSize: 10,
        color: "#555",
        textAlign: "right",
    },
    
    // --- NEW INVOICE CARD STYLES ---
    invoiceCard: {
        backgroundColor: "#E0F7FA", 
        padding: 15,
        borderRadius: 15,
        marginVertical: 10,
        maxWidth: "90%",
        borderWidth: 1,
        borderColor: "#87CEFA",
    },
    invoiceHeader: {
        fontSize: 15,
        fontWeight: "bold",
        marginBottom: 8,
        color: "#000080",
        borderBottomWidth: 1,
        borderBottomColor: "#ADD8E6",
        paddingBottom: 5,
    },
    detailRow: {
        fontSize: 14,
        color: "#333",
        marginBottom: 3,
    },
    detailLabel: {
        fontWeight: "600",
        color: "#1E90FF",
    },
    // Added new style for price display row
    detailRowPrice: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 3, 
    },
    detailPrice: {
        fontSize: 14,
        fontWeight: '600',
        color: '#228B22', 
    },
    listItem: {
        fontSize: 14, 
        color: "#444", 
        marginLeft: 10,
    },
    totalBox: {
        backgroundColor: "#FFFFFF",
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#FFD700',
    },
    totalLabel: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#555",
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: "900",
        color: "#228B22", 
    },
    loaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    loadingText: {
        marginLeft: 10,
        color: '#666',
    },
    // 🔑 NEW STYLE: Box for cancelled status inside the card
    cancelledBox: {
        backgroundColor: '#fbebeb', 
        padding: 8, 
        borderRadius: 8, 
        marginTop: 10, 
        borderLeftWidth: 3, 
        borderLeftColor: '#dc3545',
        alignItems: 'center',
    },
    cancelledText: {
        color: '#dc3545',
        fontWeight: '600',
        fontSize: 15,
    },
    // --- Buttons ---
    buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 15 },
    payBtn: {
        backgroundColor: "#1E90FF",
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 8,
        flex: 1,
        alignItems: 'center',
    },
    payBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
    cancelBtn: {
        backgroundColor: "#F80000",
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        flex: 1,
        alignItems: 'center',
    },
    cancelBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
    // --- Input Bar ---
    inputBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#e6e6e6",
        padding: 8,
        borderRadius: 25,
        margin: 10,
    },
    textInput: {
        flex: 1,
        marginHorizontal: 10,
        fontSize: 16,
        paddingVertical: 5,
        color: "#000",
    },
});