// screens/DuoProfileScreen.js

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCurrentUser,
  getDuoMembers,
  getDuoMemberPhotos,
} from '../../utils/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const DuoProfileScreen = () => {
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [memberPhotosMap, setMemberPhotosMap] = useState({});
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function fetchAll() {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }
        try {
          // 1) fetch the base user
          const { data: userData } = await getCurrentUser(token);
          if (!isActive) return;
          setUser(userData);

          // 2) only if duo, fetch duo members
          if (userData.profile_type === 'duo') {
            const { data: duoList } = await getDuoMembers(token);
            if (!isActive) return;
            setMembers(duoList);

            // 3) fetch each member’s photos
            const photosMap = {};
            for (const m of duoList) {
              try {
                const { data: pics } = await getDuoMemberPhotos(m.id, token);
                photosMap[m.id] = pics;
              } catch {
                photosMap[m.id] = [];
              }
            }
            if (isActive) setMemberPhotosMap(photosMap);
          }
        } catch (err) {
          console.error('Error loading duo profile:', err);
        } finally {
          if (isActive) setLoading(false);
        }
      }

      fetchAll();
      return () => {
        isActive = false;
      };
    }, [])
  );

  const handleEditShared = () => {
    navigation.navigate('EditDuoShared', { user });
  };
  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };
  const handleEditMember = (m) => {
    navigation.navigate('EditDuoMember', { member: m });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Unable to load profile.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Duo Profile</Text>

      <View style={styles.card}>
        <Text style={styles.label}>📍 Location:</Text>
        <Text style={styles.value}>{user.location || 'N/A'}</Text>

        <Text style={styles.label}>🎯 Looking For:</Text>
        <Text style={styles.value}>{user.looking_for || 'N/A'}</Text>

        <Text style={styles.label}>🎨 Interests:</Text>
        <Text style={styles.value}>{user.interests || 'N/A'}</Text>

        <TouchableOpacity style={styles.editBtn} onPress={handleEditShared}>
          <Text style={styles.editText}>Edit Shared Info</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() =>
          navigation.navigate('EditProfileType', { currentType: user.profile_type })
        }
      >
        <Text style={styles.changeTypeButton}>Change Profile Type</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogout}>
        <Text style={styles.logout}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.subHeader}>Members</Text>

      {members.length < 2 && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            navigation.navigate('AddDuoMember', {
              step: members.length + 1,
              sharedData: {
                location: user.location,
                interests: user.interests,
                looking_for: user.looking_for,
              },
              member1: members[0] || null,
            })
          }
        >
          <Text style={styles.addButtonText}>
            {members.length === 1 ? 'Add Second Member' : 'Add Member'}
          </Text>
        </TouchableOpacity>
      )}

      {members.length === 0 && (
        <Text style={styles.noMembers}>No members added yet.</Text>
      )}

      {members.map((member) => {
        const pics = memberPhotosMap[member.id] || [];
        return (
          <View key={member.id} style={styles.memberCard}>
            <View style={styles.infoContainer}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text>Age: {member.age}</Text>
              <Text>Gender: {member.gender}</Text>
              <Text>Ethnicity: {member.ethnicity}</Text>
              <Text>
                Personality:{' '}
                {Array.isArray(member.personality)
                  ? member.personality.join(', ')
                  : member.personality || 'N/A'}
              </Text>
            </View>

            <TouchableOpacity onPress={() => handleEditMember(member)}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>

            {pics.length > 0 && (
              <View style={styles.miniPhotoGrid}>
                {pics.map((p) => (
                  <Image
                    key={p.id}
                    source={{ uri: p.photo_url }}
                    style={styles.miniPhoto}
                  />
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};

export default DuoProfileScreen;

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#f7f7f7', flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  label: { fontWeight: '600', marginTop: 12 },
  value: { marginBottom: 8 },
  editBtn: { marginTop: 10 },
  editText: { color: '#007AFF', fontSize: 14, fontWeight: '500' },
  changeTypeButton: {
    marginTop: 30,
    alignSelf: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  logout: { color: 'gray', fontSize: 14, textAlign: 'center', marginTop: 20 },
  subHeader: { fontSize: 20, fontWeight: '600', marginTop: 24, marginBottom: 12 },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 12,
    width: '60%',
  },
  addButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
  noMembers: { color: 'gray', fontStyle: 'italic' },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContainer: { flex: 1, marginLeft: 8 },
  memberName: { fontWeight: 'bold', fontSize: 16 },
  miniPhotoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  miniPhoto: { width: 60, height: 60, borderRadius: 8, marginRight: 8, marginBottom: 8 },
});