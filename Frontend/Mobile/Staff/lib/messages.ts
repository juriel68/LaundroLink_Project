import { API_URL } from "./api";

// Type for the conversation list view
export interface ConversationPreview {
  conversationId: string;
  partnerId: string;
  name: string;
  time: string;
  lastMessage: string | null;
  lastMessageImage?: string | null;
  unreadCount: number;
}

// Type for a single message in a chat
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text?: string;
  image?: string;
  time: string;
  status: string;
}

/**
 * Fetches all conversation previews for a user.
 */
export const fetchConversations = async (userId: string): Promise<ConversationPreview[]> => {
  try {
    const response = await fetch(`${API_URL}/messages/conversations/${userId}`);
    if (!response.ok) throw new Error("Failed to fetch conversations");
    return await response.json();
  } catch (error) {
    console.error("Error in fetchConversations:", error);
    return [];
  }
};

/**
 * Fetches the full chat history for a single conversation.
 */
export const fetchConversationHistory = async (conversationId: string): Promise<ChatMessage[]> => {
  try {
    // This is now simpler and faster, looking up by conversationId
    const response = await fetch(`${API_URL}/messages/history/${conversationId}`);
    if (!response.ok) throw new Error("Failed to fetch history");
    return await response.json();
  } catch (error) {
    console.error("Error in fetchConversationHistory:", error);
    return [];
  }
};

/**
 * Sends a new message (text or image) and updates the conversation.
 */
export const sendMessage = async (
  senderId: string,
  receiverId: string,
  text?: string,
  image?: string
): Promise<ChatMessage | null> => {
  try {
    const response = await fetch(`${API_URL}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId, receiverId, text, image }),
    });
    if (!response.ok) throw new Error("Failed to send message");
    return await response.json();
  } catch (error) {
    console.error("Error in sendMessage:", error);
    return null;
  }
};


/**
 * Marks all messages in a conversation as read for a given user.
 */
export const markMessagesAsRead = async (conversationId: string, userId: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_URL}/messages/read`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId, userId }),
        });
        const data = await response.json();
        return response.ok && data.success;
    } catch (error) {
        console.error("Error in markMessagesAsRead:", error);
        return false;
    }
};