// Customer/lib/messages.ts

import { API_URL } from "./api";

// =================================================================
// 1. Types for Messaging
// =================================================================

/**
 * Type for the conversation list view (frontend: message.tsx).
 */
export interface ConversationPreview {
  conversationId: number; // 🔑 UPDATED: INT in DB
  partnerId: string;      // VARCHAR (UserID) in DB
  name: string;
  time: string; 
  lastMessage: string | null;
  lastMessageImage?: string | null; 
  unreadCount: number;
}

/**
 * Type for a single message in a chat (frontend: message_pay.tsx).
 */
export interface ChatMessage {
  id: number;             // 🔑 UPDATED: INT (MessageID) in DB
  conversationId: number; // 🔑 UPDATED: INT in DB
  senderId: string;       // VARCHAR (UserID)
  receiverId: string;     // VARCHAR (UserID)
  text?: string; 
  image?: string; 
  time: string;
  status: 'Sent' | 'Delivered' | 'Read' | 'Sending' | 'Failed'; 
}

// =================================================================
// 2. Messaging API Functions
// =================================================================

/**
 * Fetches all conversation previews for a user.
 * Corresponds to: GET /api/messages/conversations/:userId
 */
export const fetchConversations = async (userId: string): Promise<ConversationPreview[]> => {
  // console.log(`[FRONTEND-TS] Sending request for conversations for UserID: ${userId}`);
  try {
    const response = await fetch(`${API_URL}/messages/conversations/${userId}`);
    if (!response.ok) {
        console.error(`[FRONTEND-TS] HTTP Error: ${response.status} ${response.statusText}`);
        throw new Error("Failed to fetch conversations");
    }
    const data = await response.json();
    
    // Ensure IDs are numbers (just in case backend sends strings for INTs)
    return data.map((item: any) => ({
        ...item,
        conversationId: Number(item.conversationId)
    }));
  } catch (error) {
    console.error("Error in fetchConversations:", error);
    return [];
  }
};

/**
 * Fetches the full chat history for a single conversation.
 * Corresponds to: GET /api/messages/history/:conversationId
 */
export const fetchConversationHistory = async (conversationId: number): Promise<ChatMessage[]> => {
  try {
    const response = await fetch(`${API_URL}/messages/history/${conversationId}`);
    if (!response.ok) throw new Error("Failed to fetch history");
    
    const data = await response.json();
    
    return data.map((msg: any) => ({
        ...msg,
        id: Number(msg.id),
        conversationId: Number(msg.conversationId)
    }));
  } catch (error) {
    console.error("Error in fetchConversationHistory:", error);
    return [];
  }
};

/**
 * Sends a new message (text or image) and updates the conversation.
 * Corresponds to: POST /api/messages
 * @returns A promise resolving to the created ChatMessage from the server.
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
    
    const data = await response.json();
    
    // Return correctly typed object
    return {
        ...data,
        id: Number(data.MessageID || data.id), // Handle casing diffs if any
        conversationId: Number(data.ConversationID || data.conversationId)
    };
  } catch (error) {
    console.error("Error in sendMessage:", error);
    return null;
  }
};


/**
 * Marks all messages in a conversation as read for a given user.
 * Corresponds to: PATCH /api/messages/read
 * @returns A promise resolving to true if successful.
 */
export const markMessagesAsRead = async (conversationId: number, userId: string): Promise<boolean> => {
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