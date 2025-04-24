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
  deleteGroupMember,
  deleteGroupMemberPhoto,
  getCurrentUser,
  getGroupMembers,
  getGroupMemberPhotos,
  uploadGroupMemberPhoto,
} from '../../utils/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function GroupProfileScreen() {
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [photosMap, setPhotosMap] = useState({});
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        if (!token) return setLoading(false);

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
          console.error(err);
        } finally {
          if (isActive) setLoading(false);
        }
      })();
      return () => { isActive = false; };
    }, [])
  );

  const handleAddPhoto = async (memberId) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (result.canceled) return;

    try {
      const token = await AsyncStorage.getItem('token');
      const file = {
        uri: result.assets[0].uri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      };
      const res = await uploadGroupMemberPhoto(memberId, file, token);
      setPhotosMap(pm => ({
        ...pm,
        [memberId]: [
          ...(pm[memberId] || []),
          { id: res.photo_id,   photo_url: res.photo_url   }
        ]
      }))
    } catch {
      Alert.alert('Error', 'Failed to upload photo');
    }
  };

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
            const token = await AsyncStorage.getItem('token');
            await deleteGroupMember(id, token);
            setMembers(ms => ms.filter(m => m.id !== id));
            setPhotosMap(pm => {
              const { [id]:_, ...rest } = pm;
              return rest;
            });
          }
        }
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
    <ScrollView style={styles.container}>
      {/* — Top Actions */}
      <View style={styles.topActionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => {/* TODO */}}>
          <Ionicons name="settings-outline" size={24} color="#6C3FB5" />
          <Text style={styles.actionText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.push('EditProfileType', { currentType: user.profile_type })}>
          <Ionicons name="swap-horizontal-outline" size={24} color="#6C3FB5" />
          <Text style={styles.actionText}>Change Type</Text>
        </TouchableOpacity>
      </View>
      {/* — Group Photo */}
      <View style={styles.photoSection}>
        <Image
          source={{ uri: user.profile_photo || 'https://placekitten.com/200/200' }}
          style={styles.groupPhoto}
        />
        <Text style={styles.profileType}>Group</Text>
        <TouchableOpacity style={styles.pillButton} onPress={handleAddPhoto}>
          <Text style={styles.pillText}>Upload New Group Photo</Text>
        </TouchableOpacity>
      </View>

      {/* — Shared Info Card */}
      <View style={styles.card}>
        <View style={styles.rowHeader}>
          <Text style={styles.cardTitle}>Group Information</Text>
          <TouchableOpacity onPress={() => navigation.push('EditGroupShared', { user })}>
            <Ionicons name="pencil-outline" size={20} color="#6C3FB5" />
          </TouchableOpacity>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color="#6C3FB5" style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Location</Text>
          <Text style={styles.infoValue}>{user.location || '—'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="search-outline" size={18} color="#6C3FB5" style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Looking For</Text>
          <Text style={styles.infoValue}>{user.looking_for || '—'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="star-outline" size={18} color="#6C3FB5" style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Past Activites</Text>
          <Text style={styles.infoValue}>{(user.past_activities||[]).join(', ') || '—'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="albums-outline" size={18} color="#6C3FB5" style={styles.infoIcon} />
          <Text style={styles.infoLabel}>Interests</Text>
          <Text style={styles.infoValue}>{(user.interests||[]).join(', ') || '—'}</Text>
        </View>
      </View>

      {/* — Members List */}
      <Text style={styles.subHeader}>Members</Text>
      <TouchableOpacity
        style={styles.pillButton}
        onPress={() => navigation.push('AddGroupMember', { step: members.length+1, sharedData: { location: user.location, interests: user.interests, looking_for: user.looking_for }, members })}
      >
        <Ionicons name="person-add-outline" size={16} color="#6C3FB5" style={{marginRight:4}} />
        <Text style={styles.pillText}>Add Member</Text>
      </TouchableOpacity>
      {members.length === 0 && <Text style={styles.noMembers}>No members added yet.</Text>}
      {members.map(m => (
        <View key={m.id} style={styles.card}>
          <View style={styles.memberRow}>
            <Image source={{ uri: m.profile_photo||'https://placekitten.com/100' }} style={styles.memberAvatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.memberName}>{m.name}</Text>
              <Text>Age: {m.age}</Text>
              <Text>Gender: {m.gender}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.push('EditGroupMember', { member: m })}>
              <Text style={styles.editSmall}>Edit</Text>
            </TouchableOpacity>
            {members.length >= 4 && <TouchableOpacity onPress={() => handleDelete(m.id)}>
              <Ionicons name="trash-outline" size={20} color="red" />
            </TouchableOpacity>}
          </View>
          {photosMap[m.id]?.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {(photosMap[m.id] || []).map(p => (
                <View key={p.id} style={{ position: 'relative', marginRight: 10 }}>
                  <Image key={p.id} source={{ uri: p.photo_url }} style={styles.carouselPhoto} />
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => {
                      Alert.alert(
                        'Delete Photo?',
                        '',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              const token = await AsyncStorage.getItem('token');
                              await deleteGroupMemberPhoto(m.id, p.id, token);
                              setPhotosMap(pm => ({
                                ...pm,
                                [m.id]: pm[m.id].filter(x => x.id !== p.id),
                              }));
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.deleteX}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity onPress={() => handleAddPhoto(m.id)} style={{ marginTop: 6 }}>
            <Text style={styles.editText}>Add Photo</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* — Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={async () => {
          await AsyncStorage.removeItem('token');
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        }}
      >
        <Ionicons name="log-out-outline" size={24} color="red" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F7F7F7' },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center' },

  topActionsRow:   {
    flexDirection:   'row',
    justifyContent:  'space-between',
    marginHorizontal:16,
    marginVertical:  10,
  },
  actionBtn:       { alignItems: 'center' },
  actionText:      { fontSize: 12, color: '#6C3FB5', marginTop: 4 },

  photoSection:    {
    backgroundColor: '#fff',
    alignItems:      'center',
    paddingVertical: 24,
    marginBottom:    12,
    shadowColor:     '#000',
    shadowOpacity:   0.05,
    shadowOffset:    { width: 0, height: 2 },
    shadowRadius:    4,
    elevation:       2,
  },
  card:            {
    backgroundColor:'#fff',
    marginHorizontal:16,
    borderRadius:   12,
    padding:        16,
    marginBottom:   12,
    shadowColor:    '#000',
    shadowOpacity:  0.05,
    shadowOffset:   { width:0, height:2 },
    shadowRadius:   4,
    elevation:      2,
  },
  rowHeader:       {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   12,
  },
  cardTitle:       { fontSize:16, fontWeight:'600', color:'#333' },

  infoRow:         {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   12,
  },
  infoLabel:       { color:'#555', fontWeight:'600' },
  infoValue:       { color:'#333', maxWidth:'65%', textAlign:'right' },

  subHeader:       { fontSize:20, fontWeight:'600', marginHorizontal:16, marginTop:16, marginBottom:8 },
  pillButton:      {
    flexDirection: 'row',
    alignItems:    'center',
    backgroundColor:'#F0F0F5',
    paddingVertical:8,
    paddingHorizontal:16,
    borderRadius:  20,
    alignSelf:     'center',
    marginBottom:  12,
  },
  pillText:        { color:'#6C3FB5', fontWeight:'600', fontSize:14 },

  noMembers:       { textAlign:'center', color:'gray', fontStyle:'italic' },

  memberRow:       {
    flexDirection:'row',
    alignItems:   'center',
    marginBottom: 12,
  },
  memberAvatar:    { width:40, height:40, borderRadius:20, marginRight:12 },
  memberName:      { fontSize:15, fontWeight:'600', flex:1 },
  editSmall:       { color:'#6C3FB5', marginRight:12 },
  groupPhoto:      { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },

  carouselPhoto:   { width:80, height:80, borderRadius:10, borderWidth:1, borderColor:'#ddd' },
  deleteButton:    { position:'absolute', top:0, right:0, backgroundColor:'rgba(0,0,0,0.6)', borderRadius:12, padding:2 },
  deleteX:         { color:'#fff', fontSize:12 },
  profileType:     { fontSize: 20, fontWeight: '600', color: '#333', marginBottom: 8 },

  editText:        { color:'#007AFF', fontSize:14, marginTop:6 },
  deleteText:      { color:'red', fontSize:14 },

  logoutButton:    { alignItems:'center', marginTop:20, marginBottom:30 },
  logoutText:      { color:'red', fontSize:12, marginTop:4 },
  infoIcon: {
    marginRight: 8,
  },
});