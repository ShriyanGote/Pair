// navigation/AuthStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen'; 
import ProfileScreen from '../screens/ProfileScreen';
import SwipeScreen from '../screens/SwipeScreen';
import EmailLoginScreen from '../screens/EmailVerificationScreen';
import MainTabNavigator from './MainTabNavigator';
import EditProfileScreen from '../screens/EditProfileScreen';




const Stack = createNativeStackNavigator();

const AuthStack = () => {
  
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} /> 
      <Stack.Screen name="Login" component={RegisterScreen} />
      <Stack.Screen name="EmailLogin" component={EmailLoginScreen} /> 
      {/* <Stack.Screen name="Profile" component={ProfileScreen} /> 
      <Stack.Screen name="Swipe" component={SwipeScreen} /> */}
      <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      

    </Stack.Navigator>
  );
};

export default AuthStack;
