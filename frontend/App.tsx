import React, { useEffect, useContext } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './navigation/AuthStack';
import 'react-native-url-polyfill/auto';
import { navigationRef } from './navigation/navigationRef';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from './utils/api';
import 'react-native-get-random-values';
import axios from 'axios';

import { RegistrationProvider, RegistrationContext } from './screens/Auth/RegistrationContext';
import { API_BASE_URL } from '@env';

const linking = {
  prefixes: ['pairs://'],
  config: {
    screens: {
      MainTabs: 'auth/success',
    },
  },
};

export default function App() {
  const AppInner = () => {
    const { registrationData } = useContext(RegistrationContext);

    useEffect(() => {
      const handleDeepLink = async ({ url }: { url: string }) => {
        const parsedUrl = new URL(url);
        const token = parsedUrl.searchParams.get('token');

        if (parsedUrl.hostname === 'auth' && parsedUrl.pathname === '/success' && token) {
          await AsyncStorage.setItem('token', token);

          try {
            const response = await getCurrentUser(token);
            const user = response.data;

            await axios.put(
              `${API_BASE_URL}/users/${user.id}`,
              {
                profile_type: registrationData.profileType,
                age: registrationData.age || null,
                gender: registrationData.gender,
                ethnicity: registrationData.ethnicity || [],
                social_media_use: registrationData.socialMediaUse,
                past_activities: registrationData.pastActivities || [],
                personality: registrationData.personality || [],
                occupation: registrationData.occupation || [],
                interests: registrationData.interests || [],
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            navigationRef.current?.reset({
              index: 0,
              routes: [{ name: 'MainTabs', params: { user } }],
            });
          } catch (err) {
            console.error('Failed to update user after Google login', err);
          }
        }
      };

      const subscription = Linking.addEventListener('url', handleDeepLink);

      Linking.getInitialURL().then((url) => {
        if (url) handleDeepLink({ url });
      });

      return () => {
        subscription.remove();
      };
    }, [registrationData]);

    return <AuthStack />;
  };

  return (
    <RegistrationProvider>
      <NavigationContainer linking={linking} ref={navigationRef}>
        <AppInner />
      </NavigationContainer>
    </RegistrationProvider>
  );
}