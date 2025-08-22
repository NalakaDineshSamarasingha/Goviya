import { useState, useRef, RefObject } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView
} from 'react-native';
import type { TextInput as RNTextInput } from 'react-native';

export default function OTPScreen() {
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  // const { mobile } = useLocalSearchParams(); // Remove unused variable
  const inputRefs = useRef<Array<RefObject<RNTextInput> | null>>([]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 3) {
      (inputRefs.current[index + 1] as RefObject<RNTextInput>)?.current?.focus();
    }

    // Auto focus previous input on backspace
    if (!value && index > 0) {
      (inputRefs.current[index - 1] as RefObject<RNTextInput>)?.current?.focus();
    }
  };

  const handleResendCode = () => {
    // Handle resend logic here
    console.log('Resending code...');
  };

  // Remove unused handleVerify and isOtpComplete

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
            We have sent a 4 digit code via SMS to your number{' '}
            <Text style={styles.changeNumber}>Change number</Text>
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
            />
          ))}
        </View>
        <TouchableOpacity 
          style={styles.resendButton} 
          onPress={handleResendCode}
        >
          <Text style={styles.resendText}>Resend code</Text>
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
    width: 60,
    height: 60,
    backgroundColor: '#333',
    borderRadius: 8,
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    marginHorizontal: 2,
  },
  otpInputFilled: {
    borderColor: '#ff8000',
    backgroundColor: '#333',
  },
  resendButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#4a4a4a',
    alignSelf: 'flex-start',
  },
  resendText: {
    color: '#a0a0a0',
    fontSize: 16,
    fontWeight: '500',
  },
});