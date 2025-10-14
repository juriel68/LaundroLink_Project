import { useState, useEffect } from "react";

export type ChatMessage = {
  id: string;
  sender: "me" | "other";
  text: string;
  time: string;
};

export function useConversation(conversationId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    // TODO: Replace with DB fetch later
    const dummyConversations: Record<string, ChatMessage[]> = {
      "1": [
        { id: "1", sender: "other", text: "Hi, do you see a black pants in there?", time: "07:15AM" },
        { id: "2", sender: "me", text: "Good morning, yes. It’s here.", time: "07:16AM" },
        { id: "3", sender: "other", text: "I see, Thank you ❤️", time: "07:20AM" },
      ],
      "2": [
        { id: "1", sender: "other", text: "Hey, is my laundry ready?", time: "10:12AM" },
        { id: "2", sender: "me", text: "Almost done, will notify you soon!", time: "10:15AM" },
      ],
    };
    setMessages(dummyConversations[conversationId] || []);
  }, [conversationId]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const newMsg: ChatMessage = {
      id: String(messages.length + 1),
      sender: "me",
      text,
      time: "Now",
    };
    setMessages((prev) => [...prev, newMsg]);

    // TODO: Save to DB here
  };

  return { messages, sendMessage };
}
