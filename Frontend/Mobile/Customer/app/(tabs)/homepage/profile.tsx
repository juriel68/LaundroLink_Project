//profile.tsx
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
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Linking 
} from "react-native";

// ✅ Import Services
import { updateUserProfile, updateUserPassword, uploadUserImage, UserDetails, fetchFullCustomerProfile, logout as authLogout } from "@/lib/auth";

export default function ProfileScreen() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserDetails | null>(null);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);

    const getInitials = (name: string | undefined) => {
        const nameString = name?.trim() || "U"; 
        return nameString.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2);
    };

    const fetchUser = async () => {
        setLoading(true);
        try {
            // 1. Get current session info (may be partial)
            const storedUser = await AsyncStorage.getItem("user"); 
            if (!storedUser) {
                 router.replace("/");
                 return;
            }
            const parsedUser: UserDetails = JSON.parse(storedUser);
            
            // 2. Fetch complete profile details (name, phone, address) from the backend
            const fullProfile = await fetchFullCustomerProfile(parsedUser.UserID);
            
            if (fullProfile) {
                // Ensure profile fields are explicitly strings, providing defaults for bindings
                const safeProfile: UserDetails = {
                    ...fullProfile,
                    name: fullProfile.name || '',
                    phone: fullProfile.phone || '',
                    address: fullProfile.address || '',
                }
                setProfile(safeProfile);
                // Update local storage with full details for next session load
                await AsyncStorage.setItem("user", JSON.stringify(safeProfile));
            } else {
                 setProfile(parsedUser); // Use partial data if full fetch fails
            }

        } catch (e) {
            console.error("Failed to load user:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUser(); }, []);

    const handleLogout = async () => {
        try {
            await authLogout(); // Use imported logout function
            router.replace('/'); 
        } catch (e) {
            Alert.alert("Error", "Failed to log out.");
        }
    };

    const handleSaveChanges = async () => {
        if (!profile) return;
        setLoading(true);

        // 1. Password Update
        if (newPassword || confirmPassword) {
            if (newPassword !== confirmPassword) { Alert.alert("Error", "Passwords do not match."); setLoading(false); return; }
            if (newPassword.length < 6) { Alert.alert("Error", "Password must be at least 6 characters."); setLoading(false); return; }
            try {
                await updateUserPassword(profile.UserID, newPassword); 
            } catch (err: any) {
                Alert.alert("Error", err.message || "Could not update password.");
                setLoading(false);
                return;
            }
        }

        // 2. Profile Update
        try {
            const response = await updateUserProfile(profile.UserID, {
                name: profile.name,
                phone: profile.phone,
                address: profile.address,
                picture: profile.picture
            });

            if (response.success) {
                // Update local state with fresh data from backend
                const updatedUser = { 
                    ...profile, 
                    ...response.user,
                    // Ensure the state fields are explicitly strings, even if null in response
                    name: response.user?.name || profile.name || '',
                    phone: response.user?.phone || profile.phone || '',
                    address: response.user?.address || profile.address || '',
                };
                await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
                setProfile(updatedUser);
                Alert.alert("Success", "Profile updated successfully!");
                setNewPassword("");
                setConfirmPassword("");
                setIsEditing(false);
            }
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to update profile.");
        } finally {
             setLoading(false);
        }
    };

    const updateField = (field: keyof UserDetails, value: string) => {
        if (!profile) return;
        setProfile({ ...profile, [field]: value });
    };
    
    const handlePinpointAddress = async () => {
        setIsFetchingLocation(true);
        try {
            const serviceEnabled = await Location.hasServicesEnabledAsync();
            if (!serviceEnabled) {
                Alert.alert("Location Disabled", "Please turn on location services.", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Open Settings", onPress: () => Linking.openSettings() } 
                ]);
                setIsFetchingLocation(false);
                return;
            }

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Please allow location access.');
                return;
            }
            
            let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            if (!location) location = await Location.getLastKnownPositionAsync({}) as Location.LocationObject;
            if (!location) throw new Error("Could not determine location.");

            const { latitude, longitude } = location.coords;
            
            // OpenStreetMap Call
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
            const response = await axios.get(url, { headers: { 'User-Agent': 'LaundroLinkApp/1.0' } });

            if (response.data && response.data.display_name) {
                updateField('address', response.data.display_name);
                Alert.alert("Location Found!", "Address updated. Save changes to apply.");
            } else {
                Alert.alert("Error", "Address not found.");
            }
        } catch (error: any) {
            Alert.alert("Location Error", error.message || "Could not fetch location.");
        } finally {
            setIsFetchingLocation(false);
        }
    };

    const pickAndUploadImage = async () => {
        if (!isEditing) return;
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") return Alert.alert("Permission needed", "Allow photo access.");

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8,
        });

        if (result.canceled || !result.assets) return;

        setIsUploading(true);
        const localUri = result.assets[0].uri;
        const filename = localUri.split("/").pop() || "profile.jpg";

        try {
            const formData = new FormData();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;

            formData.append('file', { uri: localUri, name: filename, type } as any);
            
            const uploadResponse = await uploadUserImage(formData);
            
            if (uploadResponse.success) {
                setProfile({ ...profile!, picture: uploadResponse.url });
                Alert.alert("Success", "Picture updated. Save changes to apply!");
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to upload image.");
        } finally {
            setIsUploading(false);
        }
    };

    if (loading || !profile) {
        return ( <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#0D47A1" /></View> );
    }

    const profilePictureUri = profile.picture ? profile.picture.replace('http://', 'https://') : null;

    return (
        <SafeAreaView style={styles.safe}>
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
                            {profilePictureUri ? ( <Image source={{ uri: profilePictureUri }} style={styles.avatar} /> ) 
                            : ( <View style={styles.avatarPlaceholder}><Text style={styles.avatarInitial}>{getInitials(profile.name)}</Text></View> )}
                            {isUploading ? ( <View style={styles.uploadingOverlay}><ActivityIndicator color="#fff" /></View> )
                                : isEditing && ( <View style={styles.cameraOverlay}><Ionicons name="camera" size={22} color="#fff" /></View> )}
                        </TouchableOpacity>
                        
                        <TextInput 
                            style={[styles.input, styles.nameInput, !isEditing && styles.readonlyName]} 
                            value={profile.name || ''} 
                            onChangeText={(t) => updateField("name", t)} 
                            editable={isEditing} 
                            placeholder="Full Name"
                        />
                    </View>

                    <View style={styles.form}>
                        <TextInput 
                            style={[styles.input, !isEditing && styles.readonly]} 
                            value={profile.phone || ''} 
                            onChangeText={(t) => updateField("phone", t)} 
                            editable={isEditing} 
                            keyboardType="phone-pad" 
                            placeholder="Phone number" 
                            placeholderTextColor="#aaa" 
                        />
                        <TextInput 
                            style={[styles.input, styles.readonly]} 
                            value={profile.UserEmail} 
                            editable={false} 
                        />
                        
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Saved Address</Text>
                            {isEditing && (
                                <TouchableOpacity onPress={handlePinpointAddress} style={styles.pinpointButton} disabled={isFetchingLocation}>
                                    {isFetchingLocation ? ( <ActivityIndicator color="#004aad" size="small" /> ) : ( <Ionicons name="navigate-circle-outline" size={24} color="#004aad" /> )}
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={styles.addrRow}>
                            <TextInput 
                                style={[styles.input, styles.addressInput, !isEditing && styles.readonly]} 
                                value={profile.address || ''} 
                                onChangeText={(t) => updateField("address", t)} 
                                editable={isEditing} 
                                multiline 
                                placeholder="Enter address or use pinpoint" 
                                placeholderTextColor="#aaa" 
                            />
                        </View>
                        
                        {isEditing && (
                            <>
                                <Text style={styles.sectionTitle}>Change Password</Text>
                                <TextInput style={styles.input} placeholder="New Password" secureTextEntry value={newPassword} onChangeText={setNewPassword} placeholderTextColor="#aaa" />
                                <TextInput style={styles.input} placeholder="Confirm New Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} placeholderTextColor="#aaa" />
                            </>
                        )}
                    </View>
                </ScrollView>
                <View style={styles.editRow}>
                    <TouchableOpacity style={[styles.editButton, isEditing && styles.saveButton]} onPress={() => isEditing ? handleSaveChanges() : setIsEditing(true)}>
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
    roleText: { fontSize: 14, color: '#004aad', fontWeight: '600' },
    nameInput: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 6, width: '80%', paddingVertical: 8, },
    readonlyName: { borderWidth: 0, backgroundColor: 'transparent', color: "#0B3954", fontSize: 22, padding: 0, marginBottom: 0, height: 'auto', textAlign: 'center' },
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
});