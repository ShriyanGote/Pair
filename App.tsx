import { useEffect } from 'react';
import { Linking, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AuthStack from './navigation/AuthStack';
import 'react-native-url-polyfill/auto'; // <-- ensures `URL` works on React Native
import { navigationRef } from './navigation/navigationRef';
import AsyncStorage from '@react-native-async-storage/async-storage';



export default function App() {
useEffect(() => {
  const handleDeepLink = ({ url }: { url: string }) => {
    const parsedUrl = new URL(url);
    const token = parsedUrl.searchParams.get('token');

    if (parsedUrl.hostname === 'auth' && parsedUrl.pathname === '/success' && token) {
      AsyncStorage.setItem('token', token).then(() => {
        navigationRef.current?.reset({
          index: 0,
          routes: [{ name: 'Profile' }],
        });
      });
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
    <NavigationContainer ref={navigationRef}>
      <AuthStack />
    </NavigationContainer>
  );
}
