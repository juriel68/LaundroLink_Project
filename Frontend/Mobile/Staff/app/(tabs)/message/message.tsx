import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { fetchConversations, ConversationPreview } from "@/lib/messages";
import { getCurrentUser } from "@/lib/auth";
import Header from "@/components/Header";

export default function MessageScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const user = getCurrentUser();
  const userId = user?.UserID;

  useFocusEffect(
    useCallback(() => {
      const loadConversations = async () => {
        if (userId) {
          setLoading(true);
          try {
            const data = await fetchConversations(userId);
            setConversations(data);
          } catch (error) {
            console.error("Failed to fetch conversations:", error);
            // Optionally set an error state here
          } finally {
            setLoading(false);
          }
        }
      };
      loadConversations();
    }, [userId])
  );

  const handleOpenChat = (convo: ConversationPreview) => {
    router.push({
      pathname: "/message/chat",
      params: {
        conversationId: convo.conversationId,
        partnerName: convo.name,
        partnerId: convo.partnerId,
      },
    });
  };
  
  // Helper to get initials from a name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 50 }} />;
    }

    if (conversations.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
          <Text style={styles.emptyStateTitle}>No Messages Yet</Text>
          <Text style={styles.emptyStateSubtitle}>
            Start a conversation and it will appear here.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.content}>
        {conversations.map((convo) => (
          <TouchableOpacity
            key={convo.conversationId}
            style={styles.card}
            onPress={() => handleOpenChat(convo)}
          >
            {/* Avatar with Initials */}
            <View style={styles.avatar}>
              <Text style={styles.initials}>{getInitials(convo.name)}</Text>
            </View>

            {/* Message Content */}
            <View style={styles.cardContent}>
              <Text style={styles.name}>{convo.name}</Text>
              <Text
                style={[styles.message, convo.unreadCount > 0 && styles.unreadMessage]}
                numberOfLines={1}
              >
                {convo.lastMessage && convo.lastMessage.trim() !== ""
                  ? convo.lastMessage
                  : convo.lastMessageImage
                  ? "📷 Photo"
                  : "No messages yet"}
              </Text>
            </View>

            {/* Time and Unread Badge */}
            <View style={styles.cardRight}>
              <Text style={[styles.time, convo.unreadCount > 0 && styles.unreadTime]}>
                {new Date(convo.time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              {convo.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCountText}>{convo.unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };
  
  return (
    <View style={styles.container}>
      <Header title="Messages" />
      {renderContent()}
    </View>
  );
}


// --- New Styles for a Modern Look ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // A clean white background
  },
  content: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    alignItems: "center",
    // Modern shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e1f5fe", // A soft, pleasing blue
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  initials: {
    color: "#0277bd", // A darker, more readable blue
    fontSize: 18,
    fontWeight: "bold",
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    fontWeight: "600",
    fontSize: 16,
    color: "#111", // Darker text for better contrast
  },
  message: {
    fontSize: 14,
    color: "#666", // Grey for secondary text
    marginTop: 4,
  },
  cardRight: {
    alignItems: "flex-end",
    marginLeft: 10,
    gap: 8,
  },
  time: {
    fontSize: 12,
    color: "#999",
  },
  // --- Unread State Styles ---
  unreadMessage: {
    fontWeight: "bold",
    color: "#333", // Make unread messages darker
  },
  unreadTime: {
    fontWeight: "bold",
    color: "#007bff", // Use a brand color for unread time
  },
  unreadBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#007bff", // A vibrant blue for the badge
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  unreadCountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  // --- Empty State Styles ---
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 15,
    color: "#888",
    marginTop: 8,
    textAlign: "center",
  },
});