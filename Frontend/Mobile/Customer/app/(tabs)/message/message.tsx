// message.tsx
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
  id: string; // Mapped from conversationId
  title: string; // Mapped from name
  message: string; // Mapped from lastMessage
  time: string; // Formatted time
  unread: boolean; 
  unreadCount: number; 
  logo: any; 
  partnerId: string; // Needed for navigation to the chat screen (Staff ID or Shop Owner ID)
}

const PLACEHOLDER_LOGO = require("@/assets/images/laundry.avif"); 

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
 * 🔑 NEW LOGIC: Strips the JSON payload and only returns the prefix.
 */
const getCleanDisplayMessage = (message: string | null, isImage: boolean): string => {
    if (!message) {
        return isImage ? '📷 Photo' : 'Start a conversation...';
    }

    // 1. Check for Cancellation (which is a clean static message from the backend now)
    if (message.toLowerCase().includes('cancelled') || message.toLowerCase().includes('rejected')) {
        // The backend should already be sending "❌ The order was cancelled"
        return message; 
    }

    // 2. Check for Invoice (needs cleaning)
    if (message.includes('{"type":"INVOICE"')) {
        const jsonStartIndex = message.indexOf('{');
        // Return only the readable prefix, if one exists
        if (jsonStartIndex > 0) {
            return message.substring(0, jsonStartIndex).trim();
        }
        // Fallback if the message is ONLY the JSON blob
        return '🧾 Please confirm your order & proceed to pay'; 
    }
    
    // 3. Return the clean text message
    return message;
};


// Maps backend ConversationPreview to frontend UI structure
const mapToUI = (data: ConversationPreview[]): ConversationUI[] => {
    console.log(`[FRONTEND-UI] Starting mapping for ${data.length} raw conversations.`);
    
    const mappedData = data.map(item => {
        // 🔑 CHANGE: Use the new cleaning logic to handle the JSON/Cancellation strings
        let displayMessage = getCleanDisplayMessage(item.lastMessage, !!item.lastMessageImage);

        return {
            id: item.conversationId,             
            title: item.name,                    
            message: displayMessage,
            time: formatTime(item.time),
            unread: item.unreadCount > 0,
            unreadCount: item.unreadCount,
            logo: PLACEHOLDER_LOGO, 
            partnerId: item.partnerId,
        };
    });

    // 🔑 CONSOLE LOG: Logging final mapped data sample
    if (mappedData.length > 0) {
        console.log(`[FRONTEND-UI] Mapping complete. First conversation title: ${mappedData[0].title}, ID: ${mappedData[0].id}`);
    } else {
        console.log("[FRONTEND-UI] Mapping complete. No conversations to display.");
    }

    return mappedData;
};


export default function Message() {
// ... (rest of the component remains the same) ...

  const router = useRouter();
  const navigation = useNavigation();
  const [conversations, setConversations] = useState<ConversationUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State to hold the authenticated user ID
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); 

  // Function to fetch the conversation list
  const loadConversations = async (userId: string) => {
    setIsLoading(true);
    try {
        // fetchConversations in messages.ts has its own log
        const rawData = await fetchConversations(userId); 
        // 🔑 CONSOLE LOG: Logging raw data count
        console.log(`[FRONTEND-UI:loadConversations] Received ${rawData.length} items for mapping.`);
        setConversations(mapToUI(rawData));
    } catch (error) {
      console.error("[FRONTEND-UI] Error fetching conversations:", error);
      Alert.alert("Error", "Failed to load messages. Please check your network.");
    } finally {
      setIsLoading(false);
    }
  };

  // Use useFocusEffect to retrieve the user ID and then fetch conversations
  useFocusEffect(
    useCallback(() => {
      const fetchUserIdAndLoad = async () => {
        try {
          const storedUser = await AsyncStorage.getItem("user");
          if (storedUser) {
            const userDetails: UserDetails = JSON.parse(storedUser);
            const userId = userDetails.UserID;
            setCurrentUserId(userId);
            
            // 🔑 CONSOLE LOG: Logging the authenticated user ID
            console.log(`[FRONTEND-UI] Authenticated User ID retrieved: ${userId}`);
            
            loadConversations(userId);
          } else {
            console.log("[FRONTEND-UI] No user found in AsyncStorage. Redirecting to login.");
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
        console.log(`[FRONTEND-UI] Marking messages as read for conversation: ${item.id}`);
        markMessagesAsRead(item.id, currentUserId); 
    }
    
    // 2. Navigation: Go to the chat screen
    router.push({
      pathname: "/message/message_pay",
      params: {
        conversationId: item.id,
        partnerName: item.title,
        partnerId: item.partnerId,
        lastMessageTime: item.time 
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
          <Image source={item.logo} style={styles.logo} />
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