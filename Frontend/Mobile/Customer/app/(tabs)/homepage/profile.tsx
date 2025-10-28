//app/(tabs)/homepage/profile.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import * as Location from 'expo-location';
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from 'react-native-webview';
import { API_URL } from "@/lib/api";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  picture: string | null;
  address: string | null;
  gcash_payment_method_id: string | null;
  maya_payment_token_id: string | null;
}

// 💡 HELPER FUNCTION: Safely get initials from a name
const getInitials = (name: string | null) => {
    // If name is null, undefined, or empty, default to 'U'
    const nameString = name?.trim() || "U"; 
    
    return nameString
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2); // Safely take up to the first two initials
};

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showWebView, setShowWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');
  const [currentProvider, setCurrentProvider] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const fetchUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        setProfile(JSON.parse(storedUser));
      } else {
        // FIX: Using a correct relative path for Expo Router
        router.replace("/");
      }
    } catch (e) {
      console.error("Failed to load user from AsyncStorage", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      router.replace('/'); 
    } catch (e) {
      console.error("Failed to log out.", e);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  const handleSaveChanges = async () => {
    if (!profile) return;
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) { Alert.alert("Error", "Passwords do not match."); return; }
      if (newPassword.length < 6) { Alert.alert("Error", "Password must be at least 6 characters long."); return; }
      try {
        const passResponse = await axios.post(`${API_URL}/api/users/set-password`, { userId: profile.id, newPassword: newPassword });
        if (!passResponse.data.success) { Alert.alert("Password Error", "Could not update password."); return; }
      } catch (err) {
        console.error("❌ Password update error:", err);
        Alert.alert("Error", "Failed to connect to the server for password update.");
        return;
      }
    }
    try {
      const response = await axios.put(`${API_URL}/api/users/${profile.id}`, { name: profile.name, phone: profile.phone, address: profile.address, picture: profile.picture });
      if (response.data.success) {
        await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
        setProfile(response.data.user);
        Alert.alert("Success", "Profile updated successfully!");
        setNewPassword("");
        setConfirmPassword("");
        setIsEditing(false);
      } else {
        Alert.alert("Error", response.data.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("❌ Profile update error:", err);
      Alert.alert("Error", "Failed to connect to the server.");
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      handleSaveChanges();
    } else {
      setIsEditing(true);
    }
  };

  const updateField = (field: keyof UserProfile, value: string | null) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };
  
  // ✅ UPDATED: This function now uses the Nominatim (OpenStreetMap) API
  const handlePinpointAddress = async () => {
    setIsFetchingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Please allow location access to use this feature.');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Using the Nominatim API - no key required
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
      
      const response = await axios.get(url);

      if (response.data && response.data.display_name) {
        updateField('address', response.data.display_name);
        Alert.alert("Location Found!", "Address has been updated. Remember to Save Changes.");
      } else {
        Alert.alert("Error", "Could not find an address for this location.");
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Could not fetch your location.");
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const pickAndUploadImage = async () => {
    if (!isEditing) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true,
      aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled || !result.assets) { return; }
    setIsUploading(true);
    const localUri = result.assets[0].uri;
    const filename = localUri.split("/").pop() || "profile.jpg";
    try {
      const response = await fetch(localUri);
      const blob = await response.blob();
      const formData = new FormData();
      // Ensure filename is correct for server handling
      formData.append('file', { uri: localUri, name: filename, type: 'image/jpeg' } as any); 
      const uploadResponse = await axios.post(`${API_URL}/api/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
      if (uploadResponse.data.success) {
        const permanentUrl = uploadResponse.data.url;
        setProfile({ ...profile!, picture: permanentUrl });
        Alert.alert("Success", "Profile picture updated. Don't forget to save changes!");
      } else {
        throw new Error(uploadResponse.data.message);
      }
    } catch (error) {
      console.error("❌ Image upload failed:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLinkGcash = async () => {
    if (!profile) return;
    try {
      const response = await axios.post(`${API_URL}/api/link-gcash`, {
        userId: profile.id,
        platform: Platform.OS,
      });
      if (response.data.success) {
        const url = response.data.url;
        if (Platform.OS === 'web') {
          window.location.href = url;
        } else {
          setCurrentProvider('GCash');
          setWebViewUrl(url);
          setShowWebView(true);
        }
      } else {
        Alert.alert('Error', response.data.message || 'Could not start GCash linking process.');
      }
    } catch (error) {
      console.error("❌ Failed to initiate GCash linking:", error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };

  const handleLinkMaya = async () => {
    if (!profile) return;
    try {
      const response = await axios.post(`${API_URL}/api/link-maya`, {
        userId: profile.id,
        platform: Platform.OS,
      });
      if (response.data.success) {
        const url = response.data.url;
        if (Platform.OS === 'web') {
          window.location.href = url;
        } else {
          setCurrentProvider('Maya');
          setWebViewUrl(url);
          setShowWebView(true);
        }
      } else {
        Alert.alert('Error', response.data.message || 'Could not start Maya linking process.');
      }
    } catch (error) {
      console.error("❌ Failed to initiate Maya linking:", error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };

  const handleWebViewNavigationStateChange = (newNavState: any) => {
    const { url } = newNavState;
    if (!url) return;
    if (url.includes('yourapp://profile/payment-success') || url.includes('yourapp://maya-success')) {
      setShowWebView(false);
      Alert.alert('Success!', `Your ${currentProvider} account has been linked.`);
      fetchUser();
    }
    if (url.includes('maya-fail') || url.includes('maya-cancel')) {
      setShowWebView(false);
    }
  };

  if (loading || !profile) {
    return ( <View style={styles.loadingContainer}><ActivityIndicator size="large" /></View> );
  }

  // 💡 LOGIC: Image source with HTTPS fix
  const profilePictureUri = profile.picture 
    ? profile.picture.replace('http://', 'https://') 
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <Modal visible={showWebView} onRequestClose={() => setShowWebView(false)} animationType="slide">
        <SafeAreaView style={{flex: 1}}>
            <WebView
                source={{ uri: webViewUrl }}
                onNavigationStateChange={handleWebViewNavigationStateChange}
                startInLoadingState={true}
                renderLoading={() => <ActivityIndicator size="large" style={StyleSheet.absoluteFill} />}
            />
        </SafeAreaView>
      </Modal>

      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: "#6EC1E4" },
          headerShadowVisible: false,
          headerTintColor: "#fff",
          headerLeft: () => ( <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.push('/homepage/homepage')}><Ionicons name="arrow-back" size={24} color="#fff" style={{ marginLeft: 10 }} /></TouchableOpacity> ),
          headerTitle: () => ( <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700", marginLeft: 20 }}>Profile</Text> ),
          headerRight: () => ( <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}><Ionicons name="log-out-outline" size={28} color="red" /></TouchableOpacity> ),
        }}
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.avatarWrap} onPress={pickAndUploadImage} disabled={!isEditing || isUploading}>
              {profilePictureUri ? ( 
                <Image source={{ uri: profilePictureUri }} style={styles.avatar} /> 
                ) : (
                <View style={styles.avatarPlaceholder}>
                    {/* ✅ FIX APPLIED: Use the safe getInitials function */}
                    <Text style={styles.avatarInitial}>{getInitials(profile.name)}</Text>
                </View>
              )}
              {isUploading ? ( <View style={styles.uploadingOverlay}><ActivityIndicator color="#fff" /></View> )
               : isEditing && ( <View style={styles.cameraOverlay}><Ionicons name="camera" size={22} color="#fff" /></View> )}
            </TouchableOpacity>
            {isEditing ? ( <TextInput style={[styles.input, styles.nameInput]} value={profile.name} onChangeText={(t) => updateField("name", t)} /> )
             : ( <Text style={styles.name}>{profile.name}</Text> )}
          </View>

          <View style={styles.form}>
            <TextInput style={[styles.input, !isEditing && styles.readonly]} value={profile.phone || ''} onChangeText={(t) => updateField("phone", t)} editable={isEditing} keyboardType="phone-pad" placeholder="Phone number" placeholderTextColor="#aaa" />
            <TextInput style={[styles.input, styles.readonly]} value={profile.email} editable={false} />
            
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Saved Address</Text>
              {isEditing && (
                <TouchableOpacity onPress={handlePinpointAddress} style={styles.pinpointButton} disabled={isFetchingLocation}>
                  {isFetchingLocation ? ( <ActivityIndicator color="#004aad" size="small" /> ) : ( <Ionicons name="navigate-circle-outline" size={24} color="#004aad" /> )}
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.addrRow}>
              <TextInput style={[styles.input, styles.addressInput, !isEditing && styles.readonly]} value={profile.address || ''} onChangeText={(t) => updateField("address", t)} editable={isEditing} multiline placeholder="Enter address or use pinpoint" placeholderTextColor="#aaa" />
            </View>
            
            {isEditing && (
              <>
                <Text style={styles.sectionTitle}>Change Password</Text>
                <TextInput style={styles.input} placeholder="New Password" secureTextEntry value={newPassword} onChangeText={setNewPassword} placeholderTextColor="#aaa" />
                <TextInput style={styles.input} placeholder="Confirm New Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} placeholderTextColor="#aaa" />
              </>
            )}

            <Text style={styles.sectionTitle}>Payment Methods</Text>
            {profile.gcash_payment_method_id ? ( <View style={styles.linkedMethod}><Text style={styles.linkedMethodText}>GCash Account Linked</Text><Ionicons name="checkmark-circle" size={24} color="green" /></View>
            ) : ( <TouchableOpacity style={styles.linkButton} onPress={handleLinkGcash}><Text style={styles.linkButtonText}>Link GCash Account</Text></TouchableOpacity> )}
            {profile.maya_payment_token_id ? ( <View style={styles.linkedMethod}><Text style={styles.linkedMethodText}>Maya Account Linked</Text><Ionicons name="checkmark-circle" size={24} color="green" /></View>
            ) : ( <TouchableOpacity style={[styles.linkButton, {backgroundColor: '#000'}]} onPress={handleLinkMaya}><Text style={styles.linkButtonText}>Link Maya Account</Text></TouchableOpacity> )}
          </View>
        </ScrollView>
        <View style={styles.editRow}>
          <TouchableOpacity style={[styles.editButton, isEditing && styles.saveButton]} onPress={toggleEdit}>
            <Text style={styles.editButtonText}>{isEditing ? "Save Changes" : "Edit Profile"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#E9F8FF" },
  flex: { flex: 1 },
  container: { padding: 20, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#E9F8FF" },
  header: { alignItems: "center", paddingVertical: 25, marginTop: 10 },
  avatarWrap: { marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#1976D2", justifyContent: "center", alignItems: "center", elevation: 5 },
  avatarInitial: { color: "#fff", fontSize: 38, fontWeight: "700" },
  uploadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', borderRadius: 50 },
  cameraOverlay: { position: "absolute", bottom: 0, right: 0, backgroundColor: "#0D47A1", borderRadius: 20, padding: 6 },
  name: { fontSize: 22, fontWeight: "700", color: "#0B3954", marginTop: 6, padding: 8, textAlign: 'center' },
  nameInput: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 6, width: '80%' },
  form: { marginTop: 20, backgroundColor: "#fff", borderRadius: 12, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  input: { backgroundColor: "#F8FAFB", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: "#DCE3E7", color: "#333" },
  readonly: { color: "#555", backgroundColor: "#f0f2f5" },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#0B3954", marginVertical: 10 },
  pinpointButton: { padding: 5 },
  addrRow: { marginBottom: 10 },
  addressInput: { minHeight: 80, textAlignVertical: "top" },
  editRow: { position: "absolute", left: 0, right: 0, bottom: 20, paddingHorizontal: 20 },
  editButton: { backgroundColor: "#1565C0", paddingVertical: 15, borderRadius: 10, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  saveButton: { backgroundColor: "#0D47A1" },
  editButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  linkButton: { backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginVertical: 6 },
  linkButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkedMethod: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F0F8FF', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#D3E3FD', marginVertical: 6 },
  linkedMethodText: { fontSize: 16, fontWeight: '600', color: '#0B3954' },
});