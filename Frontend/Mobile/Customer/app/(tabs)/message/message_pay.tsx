// message_pay.tsx
// frontend/message/message_pay.tsx

import { Entypo, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import React, { useLayoutEffect, useRef, useState, useEffect, useCallback } from "react";
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
import { UserDetails } from "@/lib/auth"; // Assuming UserDetails is defined here

// --- TYPES ---
/**
 * Extends the ChatMessage type with the client-side 'sender' property 
 * used for UI logic ('user' or 'shop').
 */
interface MessageUI extends ChatMessage {
    sender: 'user' | 'shop';
}

// --- HELPER FUNCTIONS ---
/**
 * Helper function to format the timestamp into HH:MM am/pm.
 * Now robustly handles both Date objects and date strings.
 */
const formatTime = (timestamp: string | Date): string => {
    // Ensure we are working with a Date object
    const date = (timestamp instanceof Date) ? timestamp : new Date(timestamp);
    
    // Check for Invalid Date
    if (isNaN(date.getTime())) {
        console.error("Invalid timestamp received:", timestamp);
        return "Invalid Date"; // Display friendly error message
    }

    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
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
    
    // State to manage overall loading (including user ID retrieval)
    const [isLoading, setIsLoading] = useState(true); 
    
    // State to hold the real authenticated user ID
    const [currentUserId, setCurrentUserId] = useState<string | null>(null); 


    // --- 1. Data Fetching Effect (now depends on userId) ---
    const loadHistory = useCallback(async (userId: string) => {
        if (!conversationId) return;
        setIsLoading(true);
        try {
            const history = await fetchConversationHistory(conversationId as string);
            
            // Map and format history from backend
            const mappedHistory: MessageUI[] = history.map(msg => ({
                ...msg,
                id: msg.id,
                text: msg.text || undefined,
                image: msg.image || undefined,
                time: formatTime(msg.time),
                // Use the real userId to determine the sender bubble style
                sender: msg.senderId === userId ? 'user' : 'shop', 
            }));
            
            setMessages(mappedHistory);
        } catch (error) {
            console.error("Failed to load message history:", error);
            Alert.alert("Error", "Failed to load message history.");
        } finally {
            setIsLoading(false);
            // Ensure scroll to end after loading
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [conversationId]);


    // --- 2. User Authentication Effect ---
    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const storedUser = await AsyncStorage.getItem("user");
                if (storedUser) {
                    const userDetails: UserDetails = JSON.parse(storedUser);
                    const userId = userDetails.UserID;
                    
                    setCurrentUserId(userId);
                    // Pass the retrieved ID to start loading history
                    loadHistory(userId); 
                } else {
                    console.error("No user found in AsyncStorage. Cannot load chat.");
                    setCurrentUserId(null);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Error retrieving user ID from storage:", error);
                setIsLoading(false);
            }
        };
        
        fetchUserId();
    }, [loadHistory]); // Dependency on loadHistory ensures it runs after ID is set


    // --- 3. Set Header ---
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


    // --- 4. Send Message Handler ---
    const handleSend = async (imageUri?: string) => {
        const textToSend = inputMessage.trim();
        if (!textToSend && !imageUri) return;
        // Check for real user ID before sending
        if (!currentUserId) return alert("Error: User session not found. Please log in."); 
        if (!partnerId) return alert("Error: Partner ID not found.");

        setInputMessage("");

        const now = new Date(); // Get the current time once
        
        // Temporary message object (client-side prediction)
        const tempMsg: MessageUI = {
            id: Date.now().toString(), // Temp ID
            conversationId: conversationId as string,
            senderId: currentUserId, // ✅ Use the real user ID
            receiverId: partnerId as string,
            text: textToSend || undefined,
            image: imageUri,
            time: formatTime(now), // ✅ Pass Date object to fix 'Invalid Date'
            status: "Sending", 
            sender: 'user', 
        };

        setMessages((prev) => [...prev, tempMsg]);
        flatListRef.current?.scrollToEnd({ animated: true });

        // Send message to the backend
        const sentMessage = await sendMessage(
            currentUserId, // ✅ Use the real user ID
            partnerId as string,
            textToSend || undefined,
            imageUri
        );

        if (sentMessage) {
            // Update the temporary message with the real message data and status
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
            // Handle send failure
            setMessages((prev) => 
                prev.map(msg => msg.id === tempMsg.id ? { ...msg, status: 'Failed' } : msg)
            );
        }
    };


    // ... (handlePickImage and handleTakePhoto remain the same) ...
    const handlePickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            handleSend(result.assets[0].uri);
        }
    };

    const handleTakePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            alert("Camera permission is required to take photos");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            handleSend(result.assets[0].uri);
        }
    };


    // ... (Order/Payment Mock Handlers remain the same) ...
    const handleConfirm = () => {
        router.push({
            pathname: "/(tabs)/payment/pay",
            params: { 
                from: "message_pay", 
                shopName: partnerName, 
                totalAmount: "500.00" 
            }, 
        });
    };

    const handleCancel = () => {
        alert("Your order has been cancelled successfully.");
        router.back();
    };

    // --- 5. Render Functions ---
    const renderMessage = ({ item }: { item: MessageUI }) => {
        const isConfirmationMessage = item.text?.includes("Total Amount Due:"); 
        
        return (
            <View
                style={[
                    styles.messageBubble,
                    item.sender === "user" ? styles.userBubble : styles.shopBubble,
                ]}
            >
                {item.text && <Text style={styles.messageText}>{item.text}</Text>}
                {item.image && (
                    <Image
                        source={{ uri: item.image }}
                        style={{ width: 200, height: 200, borderRadius: 10, marginTop: 5 }}
                    />
                )}
                {isConfirmationMessage && (
                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.payBtn} onPress={handleConfirm}>
                            <Text style={styles.payBtnText}>Confirm & Pay</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                            <Text style={styles.cancelBtnText}>Cancel Order</Text>
                        </TouchableOpacity>
                    </View>
                )}
                <View style={styles.statusAndTime}>
                    {item.status === 'Sending' && <ActivityIndicator size="small" color="#555" style={{ marginRight: 5 }}/>}
                    <Text style={styles.messageTime}>{item.time}</Text>
                </View>
            </View>
        );
    };

    // Show loading indicator until user ID is found AND history is loaded
    if (isLoading || currentUserId === null) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#1E90FF" />
            </View>
        );
    }

    // --- 6. Main Render ---
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
    statusAndTime: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 }, // New style
    messageTime: {
        fontSize: 10,
        color: "#555",
        textAlign: "right",
    },
    buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
    payBtn: {
        backgroundColor: "#87CEFA",
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    payBtnText: { color: "#000", fontWeight: "bold", fontSize: 14 },
    cancelBtn: {
        backgroundColor: "#F80000",
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    cancelBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
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