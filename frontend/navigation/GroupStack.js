import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import GroupProfileScreen from '../screens/Group/GroupProfileScreen';
import AddGroupMember from '../screens/Group/AddGroupMember';
import GroupReviewScreen from '../screens/Group/GroupReviewScreen';
import EditGroupShared from '../screens/Group/EditGroupShared';
import EditGroupMember from '../screens/Group/EditGroupMember';
import EditProfileType from '../screens/Profile/EditProfileType';

const Stack = createStackNavigator();

const GroupStack = () => {
  return (
    <Stack.Navigator initialRouteName="GroupProfileScreen">
      <Stack.Screen name="GroupProfileScreen" component={GroupProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AddGroupMember" component={AddGroupMember} options={{ headerShown: false }} />
      <Stack.Screen name="GroupReviewScreen" component={GroupReviewScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EditGroupShared" component={EditGroupShared} options={{ headerShown: false }} />
      <Stack.Screen name="EditGroupMember" component={EditGroupMember} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfileType" component={EditProfileType} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default GroupStack;