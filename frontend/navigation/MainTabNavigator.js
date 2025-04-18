import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ProfileScreen from '../screens/Profile_Uno/ProfileScreen';
import ChatScreen from '../screens/Matches/ChatScreen';
import MatchesScreen from '../screens/Matches/MatchesScreen';
import SwipeScreen from '../screens/Swipe/SwipeScreen';
import RequestScreen from '../screens/Request/RequestScreen'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from '../utils/api';
import DuoStack from './DuoStack';
import GroupStack from './GroupStack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

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
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        tabBarStyle: {
          backgroundColor: 'black',
          borderTopColor: 'black',
          height: 90,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarActiveTintColor: '#B76EFF',   // purple for active
        tabBarInactiveTintColor: 'white',   // white for others
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
      })}
    >
      <Tab.Screen
        name="Discover"
        component={SwipeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="globe-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Requests"
        component={RequestScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Connections"
        component={MatchesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      {/* <Tab.Screen name="Requests" component={RequestScreen} />
      <Tab.Screen name="Connections" component={MatchesScreen} /> */}
      <Tab.Screen
        name="Profile"
        component={renderProfileTab}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      {/* <Tab.Screen name="Profile">
        {renderProfileTab}
      </Tab.Screen> */}
    </Tab.Navigator>
  );
};

export default MainTabNavigator;