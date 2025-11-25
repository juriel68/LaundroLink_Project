import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import React, { useState, useCallback, useRef, useLayoutEffect, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { fetchConversationHistory, sendMessage, sendMessageWithImage, ChatMessage } from "@/lib/messages";
import { getCurrentUser } from "@/lib/auth";

// Helper to format message time
const formatMessageTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    // 🔑 FIX: Use toLocaleTimeString directly on the Date object for stability
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
      console.warn("Invalid timestamp encountered:", timestamp);
      return 'N/A'; // Use N/A or a better fixed string for errors
  }
};

// --- CORE CHAT SCREEN COMPONENT ---

export default function ChatScreen() {
  const params = useLocalSearchParams<{ conversationId: string, partnerName: string, partnerId: string, logoUrl: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const user = getCurrentUser();

  const senderId = user?.UserID;
  const conversationId = parseInt(params.conversationId || '0'); 
  const partnerName = params.partnerName || 'Staff';
  const partnerId = params.partnerId;
  const partnerLogo = params.logoUrl;


  // --- FETCH MESSAGE HISTORY ---
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      const history = await fetchConversationHistory(conversationId);
      // Sort messages chronologically (safeguard against unsorted results)
      history.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      
      setMessages(history);
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
      Alert.alert("Error", "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);
  
  useLayoutEffect(() => {
    navigation.setOptions({
        headerShown: true,
        headerStyle: styles.headerStyle,
        headerTintColor: '#000',
        headerTitle: () => (
            <View style={styles.headerTitleContainer}>
                {/* Display Partner Logo/Picture */}
                <Image 
                    source={{ uri: partnerLogo }} 
                    style={styles.headerLogo} 
                    onError={() => console.log('Partner logo failed to load')} 
                />
                <Text style={styles.headerTitleText} numberOfLines={1}>{partnerName}</Text>
            </View>
        ),
    });
  }, [navigation, partnerName, partnerLogo]);

  useFocusEffect(
    useCallback(() => {
        loadMessages();
    }, [loadMessages])
  );

  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);


  // --- IMAGE PICKING LOGIC ---
  const handlePickImage = async (useCamera: boolean) => {
      if (isSending) return;
      
      const permissionResult = useCamera 
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.status !== 'granted') {
          Alert.alert("Permission Required", `Please grant access to the ${useCamera ? 'camera' : 'photo library'}.`);
          return;
      }

      const pickerOptions = {
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
      };

      const result = useCamera
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (!result.canceled && result.assets) {
          setSelectedImage(result.assets[0].uri);
      }
  };

  // --- SEND MESSAGE HANDLER ---
  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return; 
    if (!senderId || !partnerId) return;
    
    const textToSend = inputText.trim();
    
    const isImageSend = !!selectedImage;
    const imageUriToSend = selectedImage; 
    
    setInputText("");
    setSelectedImage(null); // Clear preview immediately
    setIsSending(true);

    try {
        // 1. Optimistically add a placeholder message 
        const placeholderMsg: ChatMessage = {
            id: Date.now(), 
            conversationId: conversationId,
            senderId: senderId,
            receiverId: partnerId,
            text: isImageSend ? (textToSend || "Photo Sent") : textToSend, 
            image: isImageSend ? imageUriToSend! : undefined, 
            time: new Date().toString(), 
            status: 'Sending',
        };
        setMessages(prev => [...prev, placeholderMsg]);

        let response: ChatMessage | null;

        if (isImageSend) {
            // 2a. Send image file and get back the final image URL from server
            const uploadResult = await sendMessageWithImage(senderId, partnerId, imageUriToSend!, textToSend);
            response = uploadResult.message;
        } else {
            // 2b. Send text only
            response = await sendMessage(senderId, partnerId, textToSend);
        }

        if (response) {
            // 3. Update placeholder status/ID with confirmed API response (uses server time)
            setMessages(prev => prev.map(msg => 
                msg.id === placeholderMsg.id ? { 
                    ...response, 
                    status: 'Sent', 
                    text: response.text || (isImageSend ? 'Photo Sent' : placeholderMsg.text) 
                } : msg
            ));
        } else {
            // 4. Mark as Failed
            setMessages(prev => prev.map(msg => 
                msg.id === placeholderMsg.id ? { ...msg, status: 'Failed', time: new Date().toString(), text: `❌ Failed: ${msg.text}` } : msg
            ));
            Alert.alert("Error", "Message failed to send to server.");
        }

    } catch (error) {
        console.error("Send error:", error);
        Alert.alert("Error", "Network error during send.");
    } finally {
        setIsSending(false);
        flatListRef.current?.scrollToEnd({ animated: true });
    }
  };


  // --- Render Functions ---
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMyMessage = item.senderId === senderId;
    
    // Determine the color for the time/status icons
    const iconColor = isMyMessage ? '#ccc' : '#999';

    return (
      <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.partnerMessage]}>
        
        {/* Render Image if exists */}
        {item.image && <Image source={{ uri: item.image }} style={styles.messageImage} />}

        {/* Render Text if exists (includes image captions/placeholders) */}
        {item.text && item.text !== '📷 Photo' && (
            <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.partnerMessageText]}>
              {item.text}
            </Text>
        )}

        {/* 🔑 FIX 4: Only show the time/status footer if it's not the simple "Photo Sent" bubble 
           Wait, let's keep the footer inside for all messages and rely on styling/content logic
        */}
        <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, { color: iconColor }]}>
                {formatMessageTime(item.time)}
            </Text>
            {isMyMessage && (
                <Ionicons 
                    name={item.status === 'Sent' || item.status === 'Delivered' ? "checkmark-done" : (item.status === 'Sending' ? "time-outline" : "alert-circle-outline")} 
                    size={14} 
                    color={item.status === 'Read' ? '#1E90FF' : iconColor} 
                    style={styles.messageStatusIcon} 
                />
            )}
        </View>
      </View>
    );
  };
  
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={styles.flex}
        // 🔑 FIX: Set a practical vertical offset for Android to push the content up 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80} 
      >
        
        {messages.length === 0 ? (
            <View style={styles.emptyChatContainer}>
                <Ionicons name="chatbox-outline" size={60} color="#ccc" />
                <Text style={styles.emptyChatText}>Start your conversation with {partnerName}!</Text>
            </View>
        ) : (
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
        )}

        {/* 🔑 Input Area */}
        <View style={styles.inputContainer}>
            
            {/* Image Preview & Clear Button */}
            {selectedImage && (
                <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: selectedImage }} style={styles.imagePreviewThumb} />
                    <TouchableOpacity style={styles.imageClearButton} onPress={() => setSelectedImage(null)}>
                        <Ionicons name="close-circle" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Camera/Gallery Buttons */}
            <TouchableOpacity 
                onPress={() => handlePickImage(true)} 
                disabled={isSending || !!selectedImage}
                style={[styles.attachButton, (isSending || !!selectedImage) && styles.attachButtonDisabled]}
            >
                <Ionicons name="camera-outline" size={24} color={isSending || !!selectedImage ? '#aaa' : '#1E90FF'} />
            </TouchableOpacity>
            
            <TouchableOpacity 
                onPress={() => handlePickImage(false)} 
                disabled={isSending || !!selectedImage}
                style={[styles.attachButton, (isSending || !!selectedImage) && styles.attachButtonDisabled]}
            >
                <Ionicons name="image-outline" size={24} color={isSending || !!selectedImage ? '#aaa' : '#1E90FF'} />
            </TouchableOpacity>

            {/* Text Input */}
            <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder={selectedImage ? "Add a caption..." : "Type your message..."}
                multiline
                editable={!isSending}
                keyboardAppearance="light"
            />
            
            {/* Send Button */}
            <TouchableOpacity 
                style={[styles.sendButton, (isSending || (!inputText.trim() && !selectedImage)) && styles.sendButtonDisabled]} 
                onPress={handleSend}
                disabled={isSending || (!inputText.trim() && !selectedImage)}
            >
                {isSending ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <Ionicons name="send" size={24} color="#fff" />
                )}
            </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  flex: { flex: 1 },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },

  // Header Styles
  headerStyle: { backgroundColor: '#89CFF0', borderBottomWidth: 0, elevation: 0 },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: -10 },
  headerLogo: { 
      width: 36, 
      height: 36, 
      borderRadius: 18, 
      marginRight: 10, 
      backgroundColor: '#fff', 
      borderWidth: 1, 
      borderColor: '#fff' 
    },
  headerTitleText: { fontSize: 18, fontWeight: '700', color: '#333' },

  // Message List
  messageList: { paddingHorizontal: 10, paddingVertical: 15 },
  
  // Empty Chat
  emptyChatContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyChatText: { marginTop: 15, fontSize: 16, color: '#999', textAlign: 'center' },

  // Message Bubbles
  messageBubble: {
    padding: 10,
    borderRadius: 15,
    maxWidth: '80%',
    marginBottom: 10,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#1E90FF',
    borderBottomRightRadius: 2,
  },
  partnerMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  partnerMessageText: {
    color: '#333',
  },
  messageImage: {
    width: 200, // Fixed width for chat image previews
    height: 150,
    borderRadius: 10,
    marginBottom: 5,
    backgroundColor: '#eee',
    alignSelf: 'center',
  },
  
  // Message Footer (Time/Status)
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 5,
  },
  messageTime: {
    fontSize: 12,
    color: '#ccc', // Adjusted for contrast on dark/light bubbles
    marginRight: 5,
  },
  messageStatusIcon: {
      marginLeft: 5,
  },

  // 🔑 Input Area & Attachments
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  attachButton: {
    padding: 8,
    marginBottom: 0,
  },
  attachButtonDisabled: {
      opacity: 0.5
  },
  imagePreviewContainer: {
    position: 'relative',
    height: 40,
    width: 40,
    borderRadius: 8,
    marginRight: 10,
    marginLeft: 5,
    marginBottom: 5,
  },
  imagePreviewThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    opacity: 0.8,
  },
  imageClearButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    borderRadius: 10,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E90FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  sendButtonDisabled: {
    backgroundColor: '#b0d6ff',
  },
});