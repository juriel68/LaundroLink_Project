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
  partnerPicture?: string; // 🟢 NEW: Partner's profile picture URL (or shop logo)
}

/**
 * Type for a single message in a chat (frontend: chat.tsx).
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
 * Sends a new text message.
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
 * Uploads an image and then sends the message with the resulting URL.
 * Requires a dedicated backend upload endpoint.
 */
export const sendMessageWithImage = async (
    senderId: string,
    receiverId: string,
    imageUri: string,
    caption: string
): Promise<{ message: ChatMessage | null; success: boolean }> => {
    try {
        // 1. Upload image file to Cloudinary via backend
        const formData = new FormData();
        const filename = imageUri.split('/').pop() || "chat_photo.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        // @ts-ignore - React Native FormData handling
        formData.append('file', { uri: imageUri, name: filename, type });

        const uploadResponse = await fetch(`${API_URL}/messages/upload-image`, {
            method: 'POST',
            body: formData,
        });

        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok || !uploadResult.success) {
            throw new Error(uploadResult.message || 'Image upload failed');
        }
        
        const imageUrl = uploadResult.url;

        // 2. Send message with the Cloudinary URL
        const chatMessage = await sendMessage(senderId, receiverId, caption || '📷 Photo', imageUrl);

        return { message: chatMessage, success: true };
    } catch (error) {
        console.error("Error in sendMessageWithImage:", error);
        return { message: null, success: false };
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