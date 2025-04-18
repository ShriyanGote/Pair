// screens/Profile_Group/GroupProfileScreen.js

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCurrentUser,
  getGroupMembers,
  getGroupMemberPhotos,
  deleteGroupMember,
} from '../../utils/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function GroupProfileScreen() {
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [photosMap, setPhotosMap] = useState({});
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setLoading(true);

      (async () => {
        const token = await AsyncStorage.getItem('token');
        if (!token) { setLoading(false); return; }

        try {
          const { data: me } = await getCurrentUser(token);
          if (!isActive) return;
          setUser(me);

          if (me.profile_type === 'group') {
            const { data: list } = await getGroupMembers(token);
            if (!isActive) return;
            setMembers(list);

            const map = {};
            for (const m of list) {
              try {
                const { data: pics } = await getGroupMemberPhotos(m.id, token);
                map[m.id] = pics;
              } catch {
                map[m.id] = [];
              }
            }
            if (isActive) setPhotosMap(map);
          }
        } catch (err) {
          console.error('Error loading group profile:', err);
        } finally {
          if (isActive) setLoading(false);
        }
      })();

      return () => { isActive = false; };
    }, [])
  );

  // delete member
  const handleDelete = (id) => {
    Alert.alert(
      'Remove Member?',
      'Are you sure you want to remove this group member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await deleteGroupMember(id, token);
              setMembers(ms => ms.filter(m => m.id !== id));
              setPhotosMap(pm => {
                const { [id]: _, ...rest } = pm;
                return rest;
              });
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
    </View>
  );
  if (!user) return (
    <View style={styles.center}>
      <Text>Unable to load profile.</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Shared Info */}
      <Text style={styles.header}>Group Profile</Text>
      <View style={styles.card}>
        <Text style={styles.label}>📍 Location:</Text>
        <Text style={styles.value}>{user.location || 'N/A'}</Text>
        <Text style={styles.label}>🎯 Looking For:</Text>
        <Text style={styles.value}>{user.looking_for || 'N/A'}</Text>
        <Text style={styles.label}>🎨 Interests:</Text>
        <Text style={styles.value}>
          {Array.isArray(user.interests)
            ? user.interests.join(', ')
            : user.interests || 'N/A'}
        </Text>

        {/* Edit Shared Info */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('EditGroupShared', { user })}
        >
          <Text style={styles.editText}>Edit Shared Info</Text>
        </TouchableOpacity>

       
      </View>

       {/* Change Type / Logout */}
       <TouchableOpacity
          style={styles.changeTypeButton}
          onPress={() =>
            navigation.navigate('EditProfileType', { currentType: user.profile_type })
          }
        >
          <Text style={styles.changeTypeText}>Change Profile Type</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            await AsyncStorage.removeItem('token');
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          }}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

      {/* Members */}
      <Text style={styles.subHeader}>Members</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          navigation.navigate('AddGroupMember', {
            step: members.length + 1,
            sharedData: {
              location: user.location,
              interests: user.interests,
              looking_for: user.looking_for,
            },
            members,
          })
        }
      >
        <Text style={styles.addButtonText}>Add Member</Text>
      </TouchableOpacity>
      {members.length === 0 && (
        <Text style={styles.noMembers}>No members added yet.</Text>
      )}

      {members.map(m => (
        <View key={m.id} style={styles.memberCard}>
          <View style={styles.infoContainer}>
            <Text style={styles.memberName}>{m.name}</Text>
            <Text>Age: {m.age}</Text>
            <Text>Gender: {m.gender}</Text>
            <Text>
              Ethnicity:{' '}
              {Array.isArray(m.ethnicity)
                ? m.ethnicity.join(', ')
                : m.ethnicity || 'N/A'}
            </Text>
            <Text>
              Personality:{' '}
              {Array.isArray(m.personality)
                ? m.personality.join(', ')
                : m.personality || 'N/A'}
            </Text>
            <Text>
              Occupation:{' '}
              {Array.isArray(m.occupation)
                ? m.occupation.join(', ')
                : m.occupation || 'N/A'}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('EditGroupMember', { member: m })}
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(m.id)}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>

          {photosMap[m.id]?.length > 0 && (
            <View style={styles.miniPhotoGrid}>
              {photosMap[m.id].map(p => (
                <Image
                  key={p.id}
                  source={{ uri: p.photo_url }}
                  style={styles.miniPhoto}
                />
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:          { padding: 24, backgroundColor: '#f7f7f7', flexGrow: 1 },
  center:             { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:             { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  card:               { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 20, borderColor:'#ddd', borderWidth:1 },
  label:              { fontWeight: '600', marginTop: 12 },
  value:              { marginBottom: 8 },
  editBtn:            { marginTop: 10 },
  editText:           { color: '#007AFF', fontSize: 14, fontWeight: '500' },
  changeTypeButton:   { marginTop: 16, alignSelf: 'center', padding: 10, backgroundColor: '#007AFF', borderRadius: 8 },
  changeTypeText:     { color: 'white', fontWeight: '500' },
  logoutText:         { color: 'gray', textAlign: 'center', marginTop: 12 },
  subHeader:          { fontSize: 20, fontWeight: '600', marginTop: 24, marginBottom: 12 },
  addButton:          { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignSelf: 'center', marginBottom: 12, width: '60%' },
  addButtonText:      { color: 'white', textAlign: 'center', fontWeight: '600' },
  noMembers:          { color: 'gray', fontStyle: 'italic', textAlign: 'center' },
  memberCard:         { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12 },
  infoContainer:      { marginBottom: 10 },
  memberName:         { fontWeight: 'bold', fontSize: 16 },
  actions:            { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  deleteText:         { color: 'red', fontSize: 14, fontWeight: '500' },
  miniPhotoGrid:      { flexDirection: 'row', flexWrap: 'wrap' },
  miniPhoto:          { width: 60, height: 60, borderRadius: 8, marginRight: 8, marginBottom: 8 },
});