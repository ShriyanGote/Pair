import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import MatchesScreen from '../screens/Matches/MatchesScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from '../utils/api';
import DuoProfileScreen from '../screens/Duo/DuoProfileScreen';
import DuoStack from './DuoStack'; // <-- ADD THIS


import { useFocusEffect } from '@react-navigation/native';
import SwipeScreen from '../screens/Swipe/SwipeScreen';
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

  return (
    <Tab.Navigator>
      <Tab.Screen name="Discover" component={SwipeScreen} options={{ headerShown: true }}/>
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Profile" options={{ headerShown: true }}>
        {() =>
          user?.profile_type === 'duo'
            ? <DuoStack />               // <-- use DuoStack here
            : <ProfileScreen user={user} />
        }
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default MainTabNavigator;