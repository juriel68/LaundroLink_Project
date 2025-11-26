// ... imports (React, Expo, Location, Axios, Auth functions) ...
import React, { useState, useEffect } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
    ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Linking 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import axios from 'axios'; 
import { 
    updateUserProfile, 
    updateUserPassword, 
    getCurrentUser, 
    saveSession, 
    UserDetails 
} from '@/lib/auth';

export default function SetupProfile() {
    const router = useRouter();
    const params = useLocalSearchParams();
    
    const [userId, setUserId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);

    useEffect(() => {
        const idFromParams = Array.isArray(params.userId) ? params.userId[0] : params.userId;
        const userSession = getCurrentUser();
        const finalId = idFromParams || userSession?.UserID;
        setUserId(finalId || null);
        
        // If name exists in session (from Google), prepopulate ONLY once
        if (userSession?.name && !name) setName(userSession.name);
    }, [params]);

    // ... (handlePinpointLocation function remains exactly the same as before) ...
    const handlePinpointLocation = async () => {
        setLocationLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') { Alert.alert('Permission denied'); return; }
            let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const { latitude, longitude } = location.coords;
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
            const response = await axios.get(url, { headers: { 'User-Agent': 'LaundroLinkApp/1.0' } });
            if (response.data && response.data.display_name) setAddress(response.data.display_name);
            else setAddress(`${latitude}, ${longitude}`);
        } catch (error) {
            Alert.alert("Location Error", "Could not fetch location.");
        } finally { setLocationLoading(false); }
    };

    const handleSave = async () => {
        if (!name || !phone || !address || !password) {
            Alert.alert('Missing Info', 'Please fill in all fields.');
            return;
        }
        if (!userId) {
            Alert.alert('Error', 'User session lost. Login again.');
            router.replace('/');
            return;
        }

        setLoading(true);
        try {
            // 1. Update Backend
            const profileResult = await updateUserProfile(userId, { name, phone, address });
            const passwordResult = await updateUserPassword(userId, password);

            if (profileResult.success && passwordResult.success) {
                // 2. Update Local Session
                const currentUser = getCurrentUser();
                const updatedUser: UserDetails = {
                    UserID: userId,
                    UserEmail: currentUser?.UserEmail || '', 
                    UserRole: 'Customer',
                    name: name,
                    phone: phone,
                    address: address,
                    hasPassword: true, 
                    picture: currentUser?.picture
                };
                await saveSession(updatedUser);

               router.replace("/homepage/homepage") 
             
            } else {
                throw new Error("Update failed. Please try again.");
            }
        } catch (error: any) {
            Alert.alert('Update Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.header}>Complete Your Profile</Text>
                <Text style={styles.subHeader}>Please provide a few more details to get started.</Text>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Juan Dela Cruz" />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="0912 345 6789" keyboardType="phone-pad" />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Delivery Address</Text>
                    <View style={styles.addressRow}>
                        <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={address} onChangeText={setAddress} placeholder="Unit 123, Street Name, City" multiline />
                        <TouchableOpacity style={styles.pinButton} onPress={handlePinpointLocation} disabled={locationLoading}>
                            {locationLoading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="location" size={24} color="#fff" />}
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Create a Password</Text>
                    <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save & Continue</Text>}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, backgroundColor: '#fff', padding: 25, justifyContent: 'center' },
    header: { fontSize: 28, fontWeight: 'bold', color: '#003366', marginBottom: 10, textAlign: 'center' },
    subHeader: { fontSize: 16, color: '#666', marginBottom: 30, textAlign: 'center' },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
    input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, color: '#333' },
    addressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    pinButton: { backgroundColor: '#DB4437', padding: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center', height: 55, width: 55 },
    helperText: { fontSize: 12, color: '#999', marginTop: 5 },
    saveButton: { backgroundColor: '#004080', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});