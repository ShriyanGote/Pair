import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SwipeScreen from '../screens/SwipeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MatchesScreen from '../screens/MatchesScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from '../utils/api';

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
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
    fetchUser();
  }, []);

  return (
    <Tab.Navigator>
      <Tab.Screen name="Discover" component={SwipeScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Profile">
        {() => <ProfileScreen user={user} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
