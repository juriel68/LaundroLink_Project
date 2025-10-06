import { useState, useEffect } from "react";

export type Message = {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
};

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // TODO: Replace with DB fetch later
    setMessages([
      {
        id: "1",
        name: "John Doe",
        avatar: "https://i.pravatar.cc/150?img=1",
        lastMessage: "I see, Thank you ❤️",
        time: "07:20AM",
      },
      {
        id: "2",
        name: "Jane Smith",
        avatar: "https://i.pravatar.cc/150?img=2",
        lastMessage: "Almost done, will notify you soon!",
        time: "10:15AM",
      },
    ]);
  }, []);

  return { messages, setMessages };
}
