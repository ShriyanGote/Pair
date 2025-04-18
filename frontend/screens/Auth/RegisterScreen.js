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
      // remove shared default since we're flattening
      // shared = {},
      bio: topBio,
      location: topLocation,
    } = allFields;

    // also pull any shared if still using it
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
      <Text style={styles.header}>Register with Google</Text>
      <TouchableOpacity style={styles.button} onPress={handleGoogleLogin}>
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleGoHome}>
        <Text style={styles.link}>Go Home</Text>
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
    backgroundColor: '#f9f9f9',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#DB4437',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  link: {
    color: 'gray',
    fontSize: 14,
    textAlign: 'center',
  },
});
