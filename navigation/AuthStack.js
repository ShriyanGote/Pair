// navigation/AuthStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen'; 
import EmailLoginScreen from '../screens/EmailVerificationScreen';
import MainTabNavigator from './MainTabNavigator';
import ProfileScreen from '../screens/ProfileScreen';
import ProfileTypeScreen from '../screens/ProfileTypeScreen';



const Stack = createNativeStackNavigator();

const AuthStack = () => {
  
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} /> 
      <Stack.Screen name="ProfileType" component={ProfileTypeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="EmailLogin" component={EmailLoginScreen} /> 
      {/* <Stack.Screen name="Profile" component={ProfileScreen} /> 
      <Stack.Screen name="Swipe" component={SwipeScreen} /> */}
      <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={ProfileScreen} />
      

    </Stack.Navigator>
  );
};

export default AuthStack;
