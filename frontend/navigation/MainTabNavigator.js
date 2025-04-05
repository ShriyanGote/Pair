import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ProfileScreen from '../screens/Profile_Uno/ProfileScreen';
import MatchesScreen from '../screens/Matches/MatchesScreen';
import SwipeScreen from '../screens/Swipe/SwipeScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from '../utils/api';
import DuoStack from './DuoStack';
import GroupStack from './GroupStack';
import { useFocusEffect } from '@react-navigation/native';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;
    try {
      const response = await getCurrentUser(token);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user', error);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchUser();
    }, [])
  );

  const renderProfileTab = () => {
    if (user?.profile_type === 'duo') {
      return <DuoStack />;
    } else if (user?.profile_type === 'group') {
      return <GroupStack />;
    } else {
      return <ProfileScreen user={user} />;
    }
  };

  return (
    <Tab.Navigator>
      <Tab.Screen name="Discover" component={SwipeScreen} options={{ headerShown: true }} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Profile" options={{ headerShown: true }}>
        {renderProfileTab}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default MainTabNavigator;