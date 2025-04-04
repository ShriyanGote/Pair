import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from '../../navigation/navigationRef';
import { API_BASE_URL } from '@env';

const EmailVerificationScreen = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email');
  const [loading, setLoading] = useState(false);

  const isValidEmail = (value) => {
    return /\S+@\S+\.\S+/.test(value);
  };

  const requestCode = async () => {
    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Code Sent', data.message);
        setStep('code');
      } else {
        if (response.status === 404) {
          Alert.alert('Email Not Registered', 'Please register first using Google.');
        }else{
        Alert.alert('Error', data.error || 'Failed to send code');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Network issue or server not available');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code.trim()) {
      Alert.alert('Missing Code', 'Please enter the code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();
      if (response.ok && data.access_token) {
        await AsyncStorage.setItem('token', data.access_token);
        navigationRef.current?.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      } else {
        if (response.status === 404) {
          Alert.alert('Email Not Registered', 'Please register first using Google.');
        } else{
          Alert.alert('Verification Failed', data.error || 'Invalid code');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong verifying the code');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // fallback option
    Alert.alert('Redirecting', 'Opening Google login...');
    Linking.openURL(`${API_BASE_URL}/auth/google/login`);
  };

  return (
    <View style={styles.container}>
      {step === 'email' ? (
        <>
          <Text style={styles.label}>Enter Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Button title={loading ? 'Sending...' : 'Send Code'} onPress={requestCode} disabled={loading} />
        </>
      ) : (
        <>
          <Text style={styles.label}>Enter Code</Text>
          <TextInput
            style={styles.input}
            placeholder="123456"
            value={code}
            onChangeText={setCode}
            keyboardType="numeric"
          />
          <Button title={loading ? 'Verifying...' : 'Verify'} onPress={verifyCode} disabled={loading} />
          <Text style={styles.orText}>or</Text>
          <Button title="Login with Google" onPress={handleGoogleLogin} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  label: { fontSize: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  orText: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#888',
  },
});

export default EmailVerificationScreen;