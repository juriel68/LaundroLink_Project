import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import {
  fetchConversationHistory,
  sendMessage,
  markMessagesAsRead,
  ChatMessage as ApiMessage,
} from "@/lib/messages";
import { getCurrentUser } from "@/lib/auth";
import Header from "@/components/Header";

type UIMessage = {
  id: string | number;
  sender: "me" | "other";
  text?: string;
  image?: string;
  time: string;
};

export default function ChatScreen() {
  const { conversationId, partnerName, partnerId } =
    useLocalSearchParams<{
      conversationId: string;
      partnerName: string;
      partnerId: string;
    }>();

  const user = getCurrentUser();
  const userId = user?.UserID;

  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const loadHistory = useCallback(async () => {
    if (userId && conversationId) {
      await markMessagesAsRead(conversationId, userId);
      const apiHistory: ApiMessage[] = await fetchConversationHistory(conversationId);

      const uiMessages: UIMessage[] = apiHistory.map((msg) => ({
        id: msg.id,
        sender: msg.senderId === userId ? "me" : "other",
        text: msg.text,
        image: msg.image,
        time: formatTime(new Date(msg.time)),
      }));

      setMessages(uiMessages);
      setLoading(false);
    }
  }, [conversationId, userId]);

  useEffect(() => {
    setLoading(true);
    loadHistory();
  }, [loadHistory]);
  
  useEffect(() => {
    if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: false }); // Use false for initial load
    }
  }, [messages]);


  const handleSend = async (text: string, imageUrl?: string) => {
    if ((!text.trim() && !imageUrl) || !userId || !partnerId) return;

    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: UIMessage = {
      id: tempId,
      sender: "me",
      text: text,
      image: imageUrl,
      time: formatTime(new Date()),
    };
    
    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
    if (text) setInput("");

    const newMessage = await sendMessage(userId, partnerId, text, imageUrl);

    if (newMessage) {
      await loadHistory(); 
    } else {
      Alert.alert("Error", "Failed to send message. Please try again.");
      setMessages(prev => prev.filter(m => m.id !== tempId));
      if (text) setInput(text);
    }
  };

  const pickImage = async (useCamera: boolean) => {
    const requestPermission = useCamera
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;
      
    const { status } = await requestPermission();
    if (status !== "granted") {
      Alert.alert("Permission required", `Allow access to your ${useCamera ? 'camera' : 'photos'}.`);
      return;
    }

    const launchAction = useCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const result = await launchAction({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      handleSend("", imageUri);
    }
  };

  return (
    <View style={styles.container}>
      <Header title={partnerName as string} />

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color="#007bff" />
      ) : (
        // ✅ CORRECTED STRUCTURE: The KeyboardAvoidingView now wraps everything that needs to move.
        <KeyboardAvoidingView
          style={{ flex: 1 }} // It needs to be flexible
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} // Adjust for the header height
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatContainer}
            contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 10 }}
          >
            {messages.map((msg, index) => (
              <View
                key={`${msg.id}-${index}`}
                style={[
                  styles.messageRow,
                  msg.sender === "me" ? styles.myRow : styles.otherRow,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    msg.sender === "me"
                      ? styles.myMessageBubble
                      : styles.otherMessageBubble,
                  ]}
                >
                  {msg.text && (
                    <Text
                      style={
                        msg.sender === "me"
                          ? styles.myMessageText
                          : styles.otherMessageText
                      }
                    >
                      {msg.text}
                    </Text>
                  )}
                  {msg.image && (
                    <Image source={{ uri: msg.image }} style={styles.chatImage} />
                  )}
                  <Text style={
                    msg.sender === 'me'
                      ? styles.myMessageTime
                      : styles.otherMessageTime
                  }>{msg.time}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* The input container is now INSIDE the KeyboardAvoidingView */}
          <View style={styles.inputContainer}>
            <TouchableOpacity onPress={() => pickImage(true)} style={styles.iconButton}>
              <Ionicons name="camera-outline" size={26} color="#555" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => pickImage(false)} style={styles.iconButton}>
              <Ionicons name="image-outline" size={26} color="#555" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Type a message..."
              placeholderTextColor="#999"
              multiline
            />
            
            <TouchableOpacity onPress={() => handleSend(input)} style={styles.sendBtn}>
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}


// Styles remain largely the same, just ensure the container has flex: 1
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" }, // This is important
  chatContainer: { flex: 1 }, // This is also important
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  myRow: {
    justifyContent: 'flex-end',
  },
  otherRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    maxWidth: "80%",
  },
  myMessageBubble: {
    backgroundColor: "#45b2f1ff",
    borderTopRightRadius: 6,
  },
  otherMessageBubble: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  myMessageText: { color: "#fff", fontSize: 15, lineHeight: 22 },
  otherMessageText: { color: "#222", fontSize: 15, lineHeight: 22 },
  myMessageTime: {
    fontSize: 11,
    color: "#e0e0e0",
    marginTop: 4,
    textAlign: "right",
  },
  otherMessageTime: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
    textAlign: "right",
  },
  chatImage: {
    width: 200,
    height: 200,
    borderRadius: 15,
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    borderTopColor: "#e0e0e0",
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    color: '#222',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 15,
    maxHeight: 100,
  },
  iconButton: {
    padding: 8,
  },
  sendBtn: {
    backgroundColor: "#45b2f1ff",
    padding: 12,
    borderRadius: 50,
    marginLeft: 10,
  },
});