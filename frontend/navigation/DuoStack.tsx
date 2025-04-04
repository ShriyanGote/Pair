// navigation/DuoStack.tsx or DuoStack.js
import React from 'react';
import DuoProfileSetup from '../screens/Duo/DuoProfileScreen';
import AddDuoMember from '../screens/Duo/AddDuoMember';
import DuoReviewScreen from '../screens/Duo/DuoReviewScreen';
import { createStackNavigator } from '@react-navigation/stack';
import EditDuoShared from '../screens/Duo/EditDuoShared';
import EditDuoMember from '../screens/Duo/EditDuoMember';
import EditProfileType from '../screens/Profile/EditProfileType';

const Stack = createStackNavigator();

const DuoStack = () => {
  return (
    <Stack.Navigator initialRouteName="DuoProfileSetup">
      <Stack.Screen name="DuoProfileSetup" component={DuoProfileSetup} options={{ headerShown: false }}/>
      <Stack.Screen name="AddDuoMember" component={AddDuoMember} options={{ headerShown: false }}/>
      <Stack.Screen name="DuoReviewScreen" component={DuoReviewScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="EditDuoShared" component={EditDuoShared} options={{ headerShown: false }}/>
      <Stack.Screen name="EditDuoMember" component={EditDuoMember} options={{ headerShown: false }}/>
      <Stack.Screen name="EditProfileType" component={EditProfileType}options={{ headerShown: false }}  />
    </Stack.Navigator>
  );
};

export default DuoStack;
