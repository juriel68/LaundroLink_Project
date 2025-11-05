// lib/messages.ts

import { API_URL } from "./api";

// =================================================================
// 1. Types for Messaging
// =================================================================

/**
 * Type for the conversation list view (frontend: message.tsx).
 */
export interface ConversationPreview {
  conversationId: string;
  partnerId: string; // ID of the other participant (Staff or Shop Owner ID)
  name: string;
  time: string; // Timestamp of the last message
  lastMessage: string | null;
  lastMessageImage?: string | null; // Added to support '📷 Photo' in preview
  unreadCount: number;
}

/**
 * Type for a single message in a chat (frontend: message_pay.tsx).
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text?: string; // Message content (text)
  image?: string; // URL or URI for the image
  time: string;
  status: 'Sent' | 'Delivered' | 'Read' | 'Sending' | 'Failed'; // Includes client-side statuses
}

// =================================================================
// 2. Messaging API Functions
// =================================================================

/**
 * Fetches all conversation previews for a user.
 * Corresponds to: GET /api/messages/conversations/:userId
 */
export const fetchConversations = async (userId: string): Promise<ConversationPreview[]> => {
  console.log(`[FRONTEND-TS] Sending request for conversations for UserID: ${userId}`);
  try {
    const response = await fetch(`${API_URL}/messages/conversations/${userId}`);
    if (!response.ok) {
        console.error(`[FRONTEND-TS] HTTP Error: ${response.status} ${response.statusText}`);
        throw new Error("Failed to fetch conversations");
    }
    const data = await response.json();
    console.log(`[FRONTEND-TS] Received ${data.length} raw conversations from API.`);
    // The backend query ensures the result matches ConversationPreview[] structure.
    return data;
  } catch (error) {
    console.error("Error in fetchConversations:", error);
    return [];
  }
};

/**
 * Fetches the full chat history for a single conversation.
 * Corresponds to: GET /api/messages/history/:conversationId
 */
export const fetchConversationHistory = async (conversationId: string): Promise<ChatMessage[]> => {
  try {
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
    
    // The backend POST endpoint returns the newly created message object
    return await response.json();
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