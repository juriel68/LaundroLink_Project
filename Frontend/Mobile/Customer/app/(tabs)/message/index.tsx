// frontend/message.tsx
import AsyncStorage from "@react-native-async-storage/async-storage"; 
import { useNavigation, useFocusEffect, useRouter } from "expo-router";
import React, { useLayoutEffect, useState, useCallback } from "react";
import { 
    Image, 
    Pressable, 
    ScrollView, 
    StyleSheet, 
    Text, 
    View,
    ActivityIndicator, 
    Alert, 
} from "react-native";

// Import utility functions and types
import { fetchConversations, markMessagesAsRead, ConversationPreview } from "@/lib/messages"; 
import { UserDetails } from "@/lib/auth"; // For type checking the stored user details

// --- Corrected Interface for UI data ---
interface ConversationUI {
    id: number; // Mapped from conversationId
    title: string; // Mapped from name
    message: string; // Mapped from lastMessage
    time: string; // Formatted time
    unread: boolean; 
    unreadCount: number; 
    logoUrl?: string; // Holds the fetched partnerPicture URL
    partnerId: string; // Needed for navigation to the chat screen (Staff ID or Shop Owner ID)
}

// Helper function to format the time
const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    }).replace('AM', 'am').replace('PM', 'pm');
};

/**
 * Strips the JSON payload and only returns the prefix.
 */
const getCleanDisplayMessage = (message: string | null, isImage: boolean): string => {
    if (!message) {
        return isImage ? '📷 Photo' : 'Start a conversation...';
    }

    if (message.toLowerCase().includes('cancelled') || message.toLowerCase().includes('rejected')) {
        return message; 
    }

    if (message.includes('{"type":"INVOICE"')) {
        const jsonStartIndex = message.indexOf('{');
        if (jsonStartIndex > 0) {
            return message.substring(0, jsonStartIndex).trim();
        }
        return '🧾 Please confirm your order & proceed to pay'; 
    }
    
    return message;
};


// Maps backend ConversationPreview to frontend UI structure
const mapToUI = (data: ConversationPreview[]): ConversationUI[] => {
    const mappedData = data.map(item => {
        let displayMessage = getCleanDisplayMessage(item.lastMessage, !!item.lastMessageImage);
        
        let logoUrl = item.partnerPicture;
        if (logoUrl && logoUrl.startsWith('http://')) {
            // Fix insecure URLs if necessary for iOS compatibility
            logoUrl = logoUrl.replace('http://', 'https://');
        }

        return {
            id: item.conversationId, 
            title: item.name, 
            message: displayMessage,
            time: formatTime(item.time),
            unread: item.unreadCount > 0,
            unreadCount: item.unreadCount,
            logoUrl: logoUrl, // Use the fetched URL
            partnerId: item.partnerId,
        } as ConversationUI; // Cast to ensure correct number type for ID
    });

    return mappedData.sort((a, b) => {
        // Sort newest first based on the original time string (item.time)
        return new Date(b.time).getTime() - new Date(a.time).getTime();
    });
};


export default function Message() {
    const router = useRouter();
    const navigation = useNavigation();
    const [conversations, setConversations] = useState<ConversationUI[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null); 

    const loadConversations = async (userId: string) => {
        setIsLoading(true);
        try {
            const rawData = await fetchConversations(userId); 
            setConversations(mapToUI(rawData));
        } catch (error) {
            console.error("[FRONTEND-UI] Error fetching conversations:", error);
            Alert.alert("Error", "Failed to load messages. Please check your network.");
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            const fetchUserIdAndLoad = async () => {
                try {
                    // Check local storage for authenticated user
                    const storedUser = await AsyncStorage.getItem("user");
                    if (storedUser) {
                        const userDetails: UserDetails = JSON.parse(storedUser);
                        const userId = userDetails.UserID;
                        setCurrentUserId(userId);
                        loadConversations(userId);
                    } else {
                        // If no user found, redirect to login
                        Alert.alert("Session Expired", "Please log in again.");
                        router.replace("/");
                    }
                } catch (error) {
                    console.error("[FRONTEND-UI] Error retrieving user ID from storage:", error);
                    setIsLoading(false);
                }
            };
            
            fetchUserIdAndLoad();
        }, [])
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            headerStyle: {
                backgroundColor: "#89CFF0",
                borderBottomWidth: 1.5,
                borderBottomColor: "#5EC1EF",
            },
            headerTintColor: "#2d2d2dff",
            headerShadowVisible: false,
            headerTitle: () => <Text style={styles.headerTitle}>Messages</Text>,
        });
    }, [navigation]);

    const handlePress = async (item: ConversationUI) => {
        if (!currentUserId) return; 
         
        // 1. Backend Update: Mark messages as read
        if (item.unread) {
            markMessagesAsRead(item.id, currentUserId); 
        }
        
        // 2. Navigation: Go to the chat screen
        router.push({
            pathname: "/message/chat",
            params: {
                conversationId: item.id.toString(),
                partnerName: item.title,
                partnerId: item.partnerId,
                logoUrl: item.logoUrl || '',
            },
        });
    };
    
    // --- Loading and Empty State ---
    if (isLoading || currentUserId === null) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#1E90FF" />
                <Text style={{ marginTop: 10, color: '#666' }}>Loading conversations...</Text>
            </View>
        );
    }

    if (conversations.length === 0) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <Text style={styles.emptyText}>You have no active conversations yet.</Text>
            </View>
        );
    }

    // --- Display Conversations ---
    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
            {conversations.map((item) => (
                <Pressable
                    key={item.id}
                    style={[styles.card, item.unread && styles.unreadCard]}
                    onPress={() => handlePress(item)}
                >
                    <Image 
                        // Use the dynamic logoUrl
                        source={{ uri: item.logoUrl }} 
                        style={styles.logo} 
                        onError={(e) => console.log('Image failed to load:', e.nativeEvent.error)}
                    />
                    <View style={styles.messageContent}>
                        <View style={styles.headerRow}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.time}>{item.time}</Text>
                        </View>
                        <Text style={styles.message} numberOfLines={1}>{item.message}</Text>
                    </View>
                    {item.unread && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{item.unreadCount}</Text>
                        </View>
                    )}
                </Pressable>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f6f6f6" },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 16, color: '#666' },
    headerTitle: { color: "#2d2d2dff", fontSize: 20, fontWeight: "600" },
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 14,
        borderRadius: 12,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 6,
        elevation: 4,
        position: "relative",
    },
    unreadCard: { borderLeftWidth: 4, borderLeftColor: "#1E90FF" },
    logo: {
        width: 54,
        height: 54,
        borderRadius: 27,
        marginRight: 14,
        borderWidth: 1,
        borderColor: "#ddd",
        backgroundColor: '#e0e0e0', // Placeholder background
    },
    messageContent: { flex: 1 },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: { fontSize: 16, fontWeight: "700", color: "#000" },
    time: { fontSize: 12, color: "#888" },
    message: { fontSize: 14, color: "#555", marginTop: 4 },
    unreadBadge: {
        backgroundColor: "#1E90FF",
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 8,
        alignSelf: "flex-start",
    },
    unreadText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});