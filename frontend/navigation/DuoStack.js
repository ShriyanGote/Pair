// navigation/DuoStack.tsx or DuoStack.js
import React from 'react';
// @ts-ignore
import DuoProfileSetup from '../screens/Profile_Duo/DuoProfileScreen';
import AddDuoMember from '../screens/Profile_Duo/AddDuoMember';
import DuoReviewScreen from '../screens/Profile_Duo/DuoReviewScreen';
import { createStackNavigator } from '@react-navigation/stack';
import EditDuoShared from '../screens/Profile_Duo/EditDuoShared';
import EditDuoMember from '../screens/Profile_Duo/EditDuoMember';
import EditProfileType from '../screens/Profile_Uno/EditProfileType';


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
