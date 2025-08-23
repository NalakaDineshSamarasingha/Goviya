import { useState, useRef, RefObject, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import type { TextInput as RNTextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const API_BASE_URL = "http://localhost:9090"; // Change this to your server URL

export default function OTPScreen() {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { mobile, formattedPhone } = useLocalSearchParams();
  const router = useRouter();
  const inputRefs = useRef<Array<RefObject<RNTextInput> | null>>([]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      (inputRefs.current[index + 1] as RefObject<RNTextInput>)?.current?.focus();
    }

    // Auto focus previous input on backspace
    if (!value && index > 0) {
      (inputRefs.current[index - 1] as RefObject<RNTextInput>)?.current?.focus();
    }
  };

  const verifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter a complete 6-digit code");
      return;
    }

    setLoading(true);
    try {
      // First verify the OTP
      const verifyResponse = await fetch(`${API_BASE_URL}/verifyOtp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: mobile,
          otp: otpCode,
          purpose: "login"
        }),
      });

      const verifyData = await verifyResponse.json();

      if (verifyData.success) {
        // Check if user exists in the system
        const checkUserResponse = await fetch(`${API_BASE_URL}/checkUser`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: verifyData.data.phoneNumber
          }),
        });

        const userData = await checkUserResponse.json();

        if (userData.success && userData.data.exists) {
          // User exists, redirect to home page
          Alert.alert(
            "Welcome Back!", 
            "Login successful",
            [
              {
                text: "OK",
                onPress: () => router.replace("/(tabs)")
              }
            ]
          );
        } else {
          // New user, redirect to registration page
          router.push({ 
            pathname: "/register", 
            params: { 
              phoneNumber: verifyData.data.phoneNumber 
            } 
          });
        }
      } else {
        Alert.alert("Invalid OTP", verifyData.message || "Please check your code and try again");
      }
    } catch (error) {
      console.error("Verify OTP Error:", error);
      Alert.alert("Network Error", "Please check your internet connection and try again");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
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
        Alert.alert("Code Resent", "A new verification code has been sent to your mobile number");
        setOtp(['', '', '', '', '', '']); // Clear current OTP
      } else {
        Alert.alert("Error", data.message || "Failed to resend OTP");
      }
    } catch (error) {
      console.error("Resend OTP Error:", error);
      Alert.alert("Network Error", "Please check your internet connection and try again");
    } finally {
      setResendLoading(false);
    }
  };

  // Auto verify when all digits are entered
  useEffect(() => {
    const otpCode = otp.join('');
    if (otpCode.length === 6) {
      verifyOtp();
    }
  }, [otp]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
      <View style={styles.header}>
        <Text style={styles.title}>Verify number</Text>
        <View style={{ width: '100%', height: 1, backgroundColor: '#ccc', marginVertical: 16 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.messageContainer}>
          <Text style={styles.message}>
            We have sent a 6 digit code via SMS to your number{' '}
            <Text style={styles.phoneNumber}>{formattedPhone || `+94${mobile?.toString().substring(1)}`}</Text>
            {'\n'}
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.changeNumber}>Change number</Text>
            </TouchableOpacity>
          </Text>
        </View>
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => {
                inputRefs.current[index] = ref ? { current: ref } : null;
              }}
              style={[
                styles.otpInput,
                digit !== '' && styles.otpInputFilled
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectionColor="#007AFF"
              editable={!loading}
            />
          ))}
        </View>
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff8000" />
            <Text style={styles.loadingText}>Verifying...</Text>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.resendButton, resendLoading && styles.buttonDisabled]} 
          onPress={handleResendCode}
          disabled={resendLoading || loading}
        >
          {resendLoading ? (
            <ActivityIndicator color="#a0a0a0" />
          ) : (
            <Text style={styles.resendText}>Resend code</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    padding: 20,
    paddingTop: 70,
  },
  header: {
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
  },
  messageContainer: {
    marginBottom: 30,
  },
  message: {
    fontSize: 14,
    color: '#bbb',
    marginBottom: 20,
  },
  phoneNumber: {
    color: '#fff',
    fontWeight: '600',
  },
  changeNumber: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 0,
  },
  otpInput: {
    width: 50,
    height: 60,
    backgroundColor: '#333',
    borderRadius: 8,
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    marginHorizontal: 1,
  },
  otpInputFilled: {
    borderColor: '#ff8000',
    backgroundColor: '#333',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    color: '#bbb',
    marginTop: 10,
    fontSize: 16,
  },
  resendButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#4a4a4a',
    alignSelf: 'flex-start',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    color: '#a0a0a0',
    fontSize: 16,
    fontWeight: '500',
  },
});