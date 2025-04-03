import { useEffect } from 'react';
import { Linking, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './navigation/AuthStack';
import 'react-native-url-polyfill/auto'; // <-- ensures `URL` works on React Native
import { navigationRef } from './navigation/navigationRef';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from './utils/api'; // at the top of App.tsx
import 'react-native-get-random-values';





const linking = {
  prefixes: ['pairs://'],
  config: {
    screens: {
      MainTabs: 'auth/success',
    },
  },
};

export default function App() {
useEffect(() => {
  const handleDeepLink = async ({ url }: { url: string }) => {
    const parsedUrl = new URL(url);
    const token = parsedUrl.searchParams.get('token');
  
    if (parsedUrl.hostname === 'auth' && parsedUrl.pathname === '/success' && token) {
      await AsyncStorage.setItem('token', token);
      
      try {
        const response = await getCurrentUser(token);
        navigationRef.current?.reset({
          index: 0,
          routes: [{ name: 'MainTabs', params: { user: response.data } }],
        });
      } catch (err) {
        console.error('Failed to fetch user after login', err);
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
}, []);

  return (
    
    <NavigationContainer linking={linking} ref={navigationRef}>
      <AuthStack />
      
    </NavigationContainer>
  );
}
