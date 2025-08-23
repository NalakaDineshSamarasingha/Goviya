import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

const API_BASE_URL = "http://localhost:9090"; // Change this to your server URL

export default function LoginScreen() {
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const sendOtp = async () => {
    if (mobile.length !== 10) {
      Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/sendOtp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: mobile,
          purpose: "login"
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          "OTP Sent", 
          "Verification code has been sent to your mobile number",
          [
            {
              text: "OK",
              onPress: () => router.push({ 
                pathname: "/otp", 
                params: { 
                  mobile: mobile,
                  formattedPhone: data.data?.phoneNumber || `+94${mobile.substring(1)}`
                } 
              })
            }
          ]
        );
      } else {
        Alert.alert("Error", data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Send OTP Error:", error);
      Alert.alert("Network Error", "Please check your internet connection and try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Your number</Text>
      <View style={{ width: '100%', height: 1, backgroundColor: '#ccc', marginVertical: 16 }} />
      <Text style={styles.subtitle}>We will send you a verification code to this number</Text>

      {/* Input Section */}
      <View style={styles.inputContainer}>
        {/* Country Flag */}
        <Image
          source={{ uri: "https://flagcdn.com/w20/lk.png" }}
          style={styles.flag}
        />
        <Text style={styles.countryCode}>(+94)</Text>
        <TextInput
          style={styles.input}
          placeholder="Your number"
          placeholderTextColor="#aaa"
          keyboardType="phone-pad"
          value={mobile}
          onChangeText={setMobile}
          maxLength={10}
          editable={!loading}
        />
      </View>

      {/* Button */}
      <TouchableOpacity
        style={[styles.button, (mobile.length !== 10 || loading) && styles.buttonDisabled]}
        onPress={sendOtp}
        disabled={mobile.length !== 10 || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Next</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1e1e", // dark background
    padding: 20,
    paddingTop: 70,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#bbb",
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 20,
  },
  flag: {
    width: 24,
    height: 16,
    marginRight: 8,
  },
  countryCode: {
    fontSize: 16,
    color: "#fff",
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#fff",
  },
  button: {
    backgroundColor: "#ff8000", // orange button
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
