// navigation/AuthStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import HomeScreen from '../screens/Home/HomeScreen'; 
import EmailLoginScreen from '../screens/Auth/EmailVerificationScreen';
import MainTabNavigator from './MainTabNavigator';
import MainStackNavigator from './MainStackNavigator';
import ProfileScreen from '../screens/Profile_Uno/ProfileScreen';
// import ProfileTypeScreen from '../screens/Auth/ProfileTypeScreen';
import EditProfileType from '../screens/Profile_Uno/EditProfileType'; // update path if needed
import RegistrationFlow from '../screens/Auth/RegistrationFlow';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} /> 
      <Stack.Screen name="RegistrationFlow" component={RegistrationFlow} options={{ headerShown: false }} />
      {/* <Stack.Screen name="ProfileType" component={ProfileTypeScreen} options={{ headerShown: false }} /> */}
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EmailLogin" component={EmailLoginScreen} options={{ headerShown: false }} /> 
      <Stack.Screen name="MainTabs" component={MainStackNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={ProfileScreen}options={{ headerShown: false }}  />
      <Stack.Screen name="EditProfileType" component={EditProfileType}options={{ headerShown: false }}  />
      
    </Stack.Navigator>
  );
};

export default AuthStack;
