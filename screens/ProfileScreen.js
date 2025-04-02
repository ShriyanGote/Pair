import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getCurrentUser } from '../utils/api';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const res = await getCurrentUser(token);
      setUser(res.data);
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, [])
  );

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>Loading user profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.meta}>{user.age} • {user.location}</Text>

      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Text style={styles.editText}>Edit Profile</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About Me</Text>
        <Text>{user.bio || 'No bio yet.'}</Text>
      </View>

      <TouchableOpacity onPress={handleLogout}>
        <Text style={styles.logout}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 30, backgroundColor: '#fff' },
  name: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  meta: { fontSize: 16, textAlign: 'center', color: 'gray' },
  editButton: {
    borderColor: '#f36',
    borderWidth: 1,
    padding: 8,
    borderRadius: 6,
    alignSelf: 'center',
    marginVertical: 20,
  },
  editText: { color: '#f36' },
  section: { marginVertical: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  logout: { textAlign: 'center', color: 'gray', marginTop: 40 },
});
