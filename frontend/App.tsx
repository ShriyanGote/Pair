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

// Import RegistrationContext from your context file
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
  // Because the entire app is wrapped in <RegistrationProvider>, 
  // we can use context here in App
  const AppInner = () => {
    const { registrationData } = useContext(RegistrationContext);

    useEffect(() => {
      const handleDeepLink = async ({ url }: { url: string }) => {
        const parsedUrl = new URL(url);
        const token = parsedUrl.searchParams.get('token');

        if (parsedUrl.hostname === 'auth' && parsedUrl.pathname === '/success' && token) {
          // 1) Save token
          await AsyncStorage.setItem('token', token);

          try {
            // 2) Get user from that token
            const response = await getCurrentUser(token);
            const user = response.data;

            // 3) Now patch/put user with registrationData
            //    (assuming you have a route like PUT /users/{userId})
            //    Make sure your backend route is expecting these fields
            await axios.put(
              `${API_BASE_URL}/users/${user.id}`,
              {
                // Map from registrationData to your user fields
                // e.g. age, gender, ethnicity, etc.
                profile_type: registrationData.profileType,
                age: null, // or remove if not used
                gender: registrationData.gender,
                // etc. if your endpoint expects them
                ethnicity: registrationData.ethnicity,
                social_media_use: registrationData.socialMediaUse,
                past_activities: registrationData.pastActivities?.join(','),
                personality: registrationData.personality,
                occupation: registrationData.occupation,
                interests: registrationData.interests?.join(','),
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            // 4) Navigate to main app
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
    }, [registrationData]); // re-run if registrationData changes

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