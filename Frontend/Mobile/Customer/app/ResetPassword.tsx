import React, { useState } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { initiateForgotPassword, resetUserPassword } from '@/lib/auth';

export default function ResetPassword() {
    const router = useRouter();
    
    // State
    const [step, setStep] = useState<1 | 2>(1); // Step 1: Email, Step 2: OTP & New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Step 1: Send OTP
    const handleSendCode = async () => {
        if (!email) {
            Alert.alert("Error", "Please enter your email address.");
            return;
        }

        setLoading(true);
        try {
            const response = await initiateForgotPassword(email);
            if (response.success) {
                Alert.alert("Code Sent", "Please check your email for the 6-digit code.");
                setStep(2);
            } else {
                Alert.alert("Error", response.message);
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to send reset code.");
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Reset Password
    const handleResetPassword = async () => {
        if (!otp || !newPassword || !confirmPassword) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match.");
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters long.");
            return;
        }

        setLoading(true);
        try {
            const response = await resetUserPassword(email, otp, newPassword);
            if (response.success) {
                Alert.alert("Success", "Your password has been reset successfully!", [
                    { text: "Login Now", onPress: () => router.replace('/') }
                ]);
            } else {
                Alert.alert("Error", response.message);
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to reset password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <ScrollView contentContainerStyle={styles.container}>

                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>
                    {step === 1 
                        ? "Enter your email to receive a reset code." 
                        : "Enter the code sent to your email and your new password."}
                </Text>

                {step === 1 ? (
                    // --- STEP 1: EMAIL INPUT ---
                    <View style={styles.form}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="example@email.com" 
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TouchableOpacity 
                            style={styles.button} 
                            onPress={handleSendCode}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Code</Text>}
                        </TouchableOpacity>
                    </View>
                ) : (
                    // --- STEP 2: OTP & NEW PASSWORD ---
                    <View style={styles.form}>
                        <Text style={styles.label}>6-Digit Code</Text>
                        <TextInput 
                            style={[styles.input, { letterSpacing: 5, textAlign: 'center', fontSize: 20 }]} 
                            placeholder="123456" 
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="number-pad"
                            maxLength={6}
                        />

                        <Text style={styles.label}>New Password</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="••••••••" 
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />

                        <Text style={styles.label}>Confirm Password</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="••••••••" 
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />

                        <TouchableOpacity 
                            style={styles.button} 
                            onPress={handleResetPassword}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setStep(1)} style={styles.linkButton}>
                            <Text style={styles.linkText}>Wrong email? Go back</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: "#F0F4F8",
        padding: 25,
        justifyContent: "center",
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        padding: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#003366",
        textAlign: "center",
        marginBottom: 10
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        marginBottom: 30,
    },
    form: {
        width: "100%",
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginBottom: 8,
        marginTop: 10,
    },
    input: {
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: "#ddd",
        color: "#333",
    },
    button: {
        backgroundColor: "#004080",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    linkButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    linkText: {
        color: "#004080",
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});