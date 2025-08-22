import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const [mobile, setMobile] = useState("");
  const router = useRouter();

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
        />
      </View>

      {/* Button */}
      <TouchableOpacity
        style={[styles.button, mobile.length !== 10 && styles.buttonDisabled]}
        onPress={() => router.push({ pathname: "/otp", params: { mobile } })}
        disabled={mobile.length !== 10}
      >
        <Text style={styles.buttonText}>Next</Text>
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
