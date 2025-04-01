// navigation/AuthStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen'; 
import ProfileScreen from '../screens/ProfileScreen';
import SwipeScreen from '../screens/SwipeScreen';
import EmailLoginScreen from '../screens/EmailVerificationScreen';




const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} /> 
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="EmailLogin" component={EmailLoginScreen} /> 
      <Stack.Screen name="Profile" component={ProfileScreen} /> 
      <Stack.Screen name="Swipe" component={SwipeScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;
