// Updated GroupProfileScreen.js
import React, { useEffect, useState, useCallback } from 'react';
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
import { getCurrentUser } from '../../utils/api';
import { getGroupMemberPhotos } from '../../utils/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const GroupProfileScreen = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [memberPhotosMap, setMemberPhotosMap] = useState({});
  const navigation = useNavigation();

  const fetchUser = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;
    try {
      const response = await getCurrentUser(token);
      const userData = response.data;
      setUser(userData);

      const newMap = {};
      for (const mem of userData.members || []) {
        try {
          const res = await getGroupMemberPhotos(mem.id, token);
          newMap[mem.id] = res.data;
        } catch (err) {
          console.error('Error fetching photos for member', mem.id, err);
          newMap[mem.id] = [];
        }
      }
      setMemberPhotosMap(newMap);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, [])
  );

  const handleEditShared = () => navigation.navigate('EditGroupShared', { group: user.group_profile });
  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };
  const handleEditMember = (member) => navigation.navigate('EditGroupMember', { member });

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }
  if (!user) {
    return <View style={styles.center}><Text>Unable to load profile.</Text></View>;
  }

  const group = user.group_profile || {};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Group Profile</Text>

      <View style={styles.card}>
        <Text style={styles.label}>📍 Location:</Text>
        <Text style={styles.value}>{group.location || 'N/A'}</Text>

        <Text style={styles.label}>🎯 Looking For:</Text>
        <Text style={styles.value}>{group.looking_for || 'N/A'}</Text>

        <Text style={styles.label}>🎨 Interests:</Text>
        <Text style={styles.value}>
          {typeof group.interests === 'string' ? group.interests : (group.interests || []).join(', ') || 'N/A'}
        </Text>

        <TouchableOpacity style={styles.editBtn} onPress={handleEditShared}>
          <Text style={styles.editText}>Edit Shared Info</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('EditProfileType', { currentType: user.profile_type })}>
        <Text style={styles.changeTypeButton}>Change Profile Type</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleLogout}>
        <Text style={styles.logout}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.subHeader}>Members</Text>
      {user.members && user.members.length < 6 && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            navigation.navigate('AddGroupMember', {
              step: user.members.length + 1,
              sharedData: group,
              members: user.members,
            })
          }
        >
          <Text style={styles.addButtonText}>Add Group Member</Text>
        </TouchableOpacity>
      )}

      {(user.members || []).map((member) => (
        <View key={member.id} style={styles.memberCard}>
          {member.profile_photo ? (
            <Image source={{ uri: member.profile_photo }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}><Text style={styles.initials}>{member.name?.[0]}</Text></View>
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text>Age: {member.age}</Text>
            {member.height && <Text>Height: {member.height}"</Text>}
          </View>

          {memberPhotosMap[member.id]?.length > 0 && (
            <View style={styles.miniPhotoGrid}>
              {memberPhotosMap[member.id].map((pic) => (
                <Image key={pic.id} source={{ uri: pic.photo_url }} style={styles.miniPhoto} />
              ))}
            </View>
          )}

          <TouchableOpacity onPress={() => handleEditMember(member)}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
};

export default GroupProfileScreen;

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#f7f7f7', flexGrow: 1 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:    { fontSize: 26, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  card:      { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#ddd' },
  label:     { fontWeight: '600', marginTop: 12 },
  value:     { marginBottom: 8 },
  editBtn:   { marginTop: 10 },
  editText:  { color: '#007AFF', fontSize: 14, fontWeight: '500' },
  changeTypeButton: { marginTop: 30, alignSelf: 'center', padding: 12, borderRadius: 8, backgroundColor: '#007AFF' },
  logout:    { color: 'gray', fontSize: 14, textAlign: 'center', marginTop: 20 },
  subHeader: { fontSize: 20, fontWeight: '600', marginTop: 24, marginBottom: 12 },
  addButton: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignSelf: 'center', marginBottom: 12, width: '60%' },
  addButtonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
  memberCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  photo:     { width: 60, height: 60, borderRadius: 30, marginRight: 16 },
  photoPlaceholder: { width: 60, height: 60, borderRadius: 30, marginRight: 16, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  initials:  { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  memberName: { fontWeight: 'bold', fontSize: 16 },
  miniPhotoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  miniPhoto: { width: 60, height: 60, borderRadius: 8, marginRight: 8, marginBottom: 8 },
});
