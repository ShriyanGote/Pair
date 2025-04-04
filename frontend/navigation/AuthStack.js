// navigation/AuthStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import HomeScreen from '../screens/Home/HomeScreen'; 
import EmailLoginScreen from '../screens/Auth/EmailVerificationScreen';
import MainTabNavigator from './MainTabNavigator';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ProfileTypeScreen from '../screens/Profile/ProfileTypeScreen';
import EditProfileType from '../screens/Profile/EditProfileType'; // update path if needed




const Stack = createNativeStackNavigator();

const AuthStack = () => {
  
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} /> 
      <Stack.Screen name="ProfileType" component={ProfileTypeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EmailLogin" component={EmailLoginScreen} options={{ headerShown: false }} /> 
      <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={ProfileScreen}options={{ headerShown: false }}  />
      <Stack.Screen name="EditProfileType" component={EditProfileType}options={{ headerShown: false }}  />
      
    </Stack.Navigator>
  );
};

export default AuthStack;
