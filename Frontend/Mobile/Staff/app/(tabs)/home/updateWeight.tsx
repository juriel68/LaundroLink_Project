import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, SafeAreaView, TextInput, ScrollView 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from "@expo/vector-icons";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import { updateOrderWeightWithProof } from "@/lib/orders";

export default function UpdateWeightScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  
  const [weight, setWeight] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const user = getCurrentUser();

  const pickImage = async () => {
    // Request Camera Permissions
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to allow access to the camera to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled) {
      setProofImage(result.assets[0].uri);
    }
  };

  const handleConfirm = async () => {
    if (!weight || isNaN(parseFloat(weight))) {
      Alert.alert("Invalid Input", "Please enter a valid weight in kg.");
      return;
    }
    if (!proofImage) {
      Alert.alert("Required", "Please take a photo of the weighing scale.");
      return;
    }

    setLoading(true);
    const success = await updateOrderWeightWithProof(
        String(orderId), 
        weight, 
        proofImage, 
        user?.UserID || 'Staff', 
        'Staff'
    );
    setLoading(false);

    if (success) {
      Alert.alert("Success", "Weight updated and sent to customer.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } else {
      Alert.alert("Error", "Failed to update weight.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Update Weight" showBack={true} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
            <Text style={styles.label}>Order ID</Text>
            <Text style={styles.value}>#{orderId}</Text>
            <Text style={styles.instruction}>Enter the final weight and take a photo of the scale.</Text>
        </View>

        <View style={styles.formContainer}>
            {/* Weight Input */}
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <View style={styles.inputWrapper}>
                <TextInput 
                    style={styles.input}
                    placeholder="0.0"
                    keyboardType="numeric"
                    value={weight}
                    onChangeText={setWeight}
                />
                <Text style={styles.unit}>kg</Text>
            </View>

            {/* Image Capture */}
            <Text style={styles.inputLabel}>Proof Photo</Text>
            <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                {proofImage ? (
                    <Image source={{ uri: proofImage }} style={styles.previewImage} />
                ) : (
                    <View style={styles.cameraPlaceholder}>
                        <Ionicons name="camera" size={40} color="#007bff" />
                        <Text style={styles.cameraText}>Take Photo</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Confirm Button */}
            <TouchableOpacity 
                style={[styles.btn, (!weight || !proofImage) && styles.disabledBtn]} 
                onPress={handleConfirm}
                disabled={loading || !weight || !proofImage}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.btnText}>Confirm & Notify Customer</Text>
                )}
            </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 20 },
  
  infoCard: {
    marginBottom: 20,
  },
  label: { fontSize: 14, color: '#888' },
  value: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  instruction: { fontSize: 14, color: '#555', lineHeight: 20 },

  formContainer: {
    backgroundColor: '#fff', padding: 20, borderRadius: 12,
    shadowColor: "#000", shadowOpacity: 0.05, elevation: 2
  },
  inputLabel: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 10 },
  
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, height: 50, marginBottom: 20
  },
  input: { flex: 1, fontSize: 18, color: '#333' },
  unit: { fontSize: 16, color: '#888', fontWeight: '600' },

  cameraButton: {
    height: 200, backgroundColor: '#f0f4f8', borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 30,
    borderWidth: 1, borderColor: '#dae1e7', borderStyle: 'dashed', overflow: 'hidden'
  },
  cameraPlaceholder: { alignItems: 'center' },
  cameraText: { color: '#007bff', marginTop: 10, fontWeight: '500' },
  previewImage: { width: '100%', height: '100%' },

  btn: { backgroundColor: '#007bff', padding: 16, borderRadius: 8, alignItems: 'center' },
  disabledBtn: { backgroundColor: '#b0c4de' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});