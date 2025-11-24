// Staff/lib/messages.ts

import axios from "axios";
import { API_URL } from "./api";

// --- INTERFACES ---

// Matches the SQL output from GET /api/messages/conversations/:userId
export interface ConversationPreview {
    conversationId: string;
    partnerId: string;
    name: string;
    time: string;
    lastMessage: string | null; 
    unreadCount: number;
}

// Matches the SQL output from GET /api/messages/history/:conversationId
export interface ChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    receiverId: string;
    text?: string;
    image?: string;
    time: string;
    status: 'Sent' | 'Delivered' | 'Read'; // Typed strictly
}

// --- API FUNCTIONS ---

/**
 * Fetches all conversation previews for a user.
 */
export const fetchConversations = async (userId: string): Promise<ConversationPreview[]> => {
    try {
        const response = await axios.get(`${API_URL}/messages/conversations/${userId}`);
        return response.data;
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
        const response = await axios.get(`${API_URL}/messages/history/${conversationId}`);
        return response.data;
    } catch (error) {
        console.error("Error in fetchConversationHistory:", error);
        return [];
    }
};

/**
 * Sends a new message (text or image).
 * Warning: If 'image' is a large base64 string, ensure your server limit allows large JSON bodies.
 */
export const sendMessage = async (
    senderId: string,
    receiverId: string,
    text?: string,
    image?: string
): Promise<ChatMessage | null> => {
    try {
        const response = await axios.post(`${API_URL}/messages`, {
            senderId,
            receiverId,
            text,
            image
        });
        return response.data;
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
        const response = await axios.patch(`${API_URL}/messages/read`, {
            conversationId,
            userId
        });
        return response.data.success;
    } catch (error) {
        console.error("Error in markMessagesAsRead:", error);
        return false;
    }
};