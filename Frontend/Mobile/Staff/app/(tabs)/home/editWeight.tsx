// editWeight.tsx 

import { updateOrderWeight } from "@/lib/orders";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ActivityIndicator, 
    // Removed Switch
} from "react-native";
import { loadUserFromStorage, UserSession } from "@/lib/auth"; 

import Header from "@/components/Header";

export default function EditWeight() {
    const router = useRouter();
    const { orderId, prevWeight } = useLocalSearchParams();

    const [weight, setWeight] = useState(prevWeight ? String(prevWeight) : "");
    const [successMsg, setSuccessMsg] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    // Removed isFinal state
    
    const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

    // Effect: Load user details on component mount
    useEffect(() => {
        const loadUser = async () => {
            const user = await loadUserFromStorage();
            setCurrentUser(user);
            if (!user) {
                Alert.alert("Session Expired", "Please log in again to update orders.");
            }
        };
        loadUser();
    }, []);

    const handleUpdate = async () => {
        if (!orderId || !weight || isNaN(parseFloat(weight))) {
            Alert.alert("Invalid Input", "Please enter a valid numeric weight.");
            return;
        }
        if (!currentUser || !currentUser.UserID) {
            Alert.alert("Authentication Error", "User session is missing.");
            return;
        }
        
        setIsUpdating(true);

        const response = await updateOrderWeight(
            String(orderId), 
            parseFloat(weight), 
            true, // 🔑 ALWAYS send isFinal: true
            currentUser.UserID, 
            currentUser.UserRole
        );
        
        setIsUpdating(false);

        if (response.success) {
            // Updated success message to reflect finalization
            setSuccessMsg(`Final weight and invoice updated to ${parseFloat(weight).toFixed(1)} kg.`);
            
            setTimeout(() => router.back(), 2000);
        } else {
            Alert.alert("Update Failed", response.message || "Failed to update weight and finalize invoice.");
        }
    };

    const isButtonDisabled = isUpdating || !currentUser;
    
    return (
        <View style={styles.container}>
            <Header title="Confirm Laundry Weight" />

            <View style={styles.centerWrapper}>
                <View style={styles.card}>
                    {/* Old Weight */}
                    <Text style={styles.oldLabel}>Previous Weight (Initial Booking)</Text>
                    <Text style={styles.oldValue}>{prevWeight} kg</Text>

                    {/* Input */}
                    <Text style={styles.inputLabel}>Final Measured Weight</Text>
                    <View style={styles.inputBox}>
                        <TextInput
                            style={styles.input}
                            onChangeText={setWeight}
                            value={weight}
                            keyboardType="numeric"
                            placeholder="Enter final weight"
                        />
                        <Text style={styles.unit}>kg</Text>
                    </View>
                    
                    {/* Removed Finalization Switch */}

                    {/* Update button */}
                    <TouchableOpacity 
                        style={[styles.updateBtn, isButtonDisabled && { opacity: 0.7 }]} 
                        onPress={handleUpdate}
                        disabled={isButtonDisabled}
                    >
                        <Text style={styles.updateText}>
                            {isUpdating ? <ActivityIndicator color="#fff" /> : "Confirm Final Weight & Price"}
                        </Text>
                    </TouchableOpacity>

                    {/* Success message */}
                    {successMsg ? (
                        <View style={styles.successBox}>
                            <Text style={styles.successText}>{successMsg}</Text>
                        </View>
                    ) : null}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#eef3f7" 
  },

  centerWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  card: {
    width: "92%",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 26,
    shadowColor: "#8ab6d6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#e3edf7",
  },

  oldLabel: {
    fontSize: 15,
    color: "#7b8b9a",
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  oldValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#3c4a5a",
    textAlign: "center",
    marginBottom: 28,
    backgroundColor: "#f2f7fb",
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: "#c2d7ea",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  inputLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2e4053",
    marginBottom: 14,
    textAlign: "center",
    letterSpacing: 0.4,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#a7c8ec",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 32, 
    backgroundColor: "#fefeff",
    shadowColor: "#bcd6f2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  unit: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 8,
    color: "#3a8dde",
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#2b2b2b",
    textAlign: "center",
    letterSpacing: 0.5,
    fontStyle: "italic",
  },

  updateBtn: {
    backgroundColor: "#0D47A1",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 22,
    shadowColor: "#5ca9f5",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  updateText: { 
    color: "#fff", 
    fontWeight: "700", 
    fontSize: 18,
    letterSpacing: 0.3 
  },

  successBox: {
    backgroundColor: "#e3f7ec",
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 5,
    borderLeftColor: "#37b36b",
    shadowColor: "#d9f0e1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  successText: {
    color: "#276749",
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    fontWeight: "600",
  },
  // Removed unused switch styles
});