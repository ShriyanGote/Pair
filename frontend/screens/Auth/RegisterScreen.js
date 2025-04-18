import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Linking, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';

const RegisterScreen = ({ navigation, route }) => {
  const [allFields, setAllFields] = useState(null);

  useEffect(() => {
    navigation.setOptions({ headerLeft: () => null });
    if (route.params?.allFields) {
      setAllFields(route.params.allFields);
    }
  }, [navigation, route.params?.allFields]);

  const handleGoogleLogin = async () => {
    if (!allFields) {
      Alert.alert('Error', 'No registration data found');
      return;
    }

    const {
      profile_type,
      ethnicity,
      gender,
      interests,
      past_activities,
      looking_for,
      personality,
      social_media_use,
      occupation,
      bio: topBio,
      location: topLocation,
    } = allFields;

    const shared = allFields.shared || {};

    const profileData = {
      profile_type,
      ethnicity,
      gender,
      interests,
      past_activities,
      looking_for: shared.lookingFor || looking_for || null,
      personality,
      social_media_use,
      occupation,
      bio: shared.bio || topBio || null,
      location: shared.location || topLocation || null,
    };

    try {
      const jsonStr = JSON.stringify(profileData);
      const encoded = encodeURIComponent(jsonStr);
      const url = `${API_BASE_URL}/auth/google/login?profile_data=${encoded}`;

      const supported = await Linking.canOpenURL(url);
      if (!supported) throw new Error('Cannot open login URL');
      await Linking.openURL(url);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to open Google login');
    }
  };

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home', params: { registered: true } }],
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Your Account</Text>
      <Text style={styles.subtitle}>We’ll link your profile with Google</Text>

      <TouchableOpacity style={styles.button} onPress={handleGoogleLogin}>
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleGoHome}>
        <Text style={styles.link}>← Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#f4f0fc',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#5E3C9B',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 36,
    color: '#777',
  },
  button: {
    backgroundColor: 'black',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  link: {
    color: '#5E3C9B',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});