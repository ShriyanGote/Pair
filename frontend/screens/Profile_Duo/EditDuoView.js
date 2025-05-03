// screens/Profile_Duo/DuoProfileScreen.js

import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  getCurrentUser,
  getDuoMembers,
  getDuoMemberPhotos,
  deleteDuoMember,
  uploadDuoMemberPhoto,
  deleteDuoMemberPhoto,
  uploadMulipleProfilePhoto,
} from '../../utils/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function EditDuoView() {
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [photosMap, setPhotosMap] = useState({});
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Edit Profile',
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={() => {/* TODO: save handler */}} style={styles.headerBtn}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      ),
      headerStyle: { backgroundColor: '#fff', shadowOpacity: 0 },
      headerTitleStyle: { fontSize: 18, fontWeight: '600', color: '#333' },
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        const token = await AsyncStorage.getItem('token');
        if (!token) return setLoading(false);
        try {
          const { data: me } = await getCurrentUser(token);
          if (!active) return;
          setUser(me);

          const { data: list } = await getDuoMembers(token);
          if (!active) return;
          setMembers(list);

          const map = {};
          for (let m of list) {
            try {
              const { data: pics } = await getDuoMemberPhotos(m.id, token);
              map[m.id] = pics;
            } catch {
              map[m.id] = [];
            }
          }
          if (active) setPhotosMap(map);
        } catch (err) {
          console.error(err);
        } finally {
          active && setLoading(false);
        }
      })();
      return () => { active = false; };
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#B76EFF" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loading}>
        <Text>Unable to load profile.</Text>
      </View>
    );
  }

    // delete member
  const handleDeleteMember = (id) => {
    Alert.alert(
      'Remove Member?',
      'Are you sure you want to delete this member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const token = await AsyncStorage.getItem('token');
            await deleteDuoMember(id, token);
            setMembers(ms => ms.filter(m => m.id !== id));
            setPhotosMap(pm => {
              const { [id]:_, ...rest } = pm;
              return rest;
            });
          },
        },
      ]
    );
  };

  const handleAddPhoto = async (memberId) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      try {
        const token = await AsyncStorage.getItem('token');
        const form = new FormData();
        form.append('file', {
          uri: result.assets[0].uri,
          name: 'photo.jpg',
          type: 'image/jpeg',
        });

      const { data } = await uploadMulipleProfilePhoto(form, token);
      setUser(u => ({ ...u, profile_picture: data.profile_picture }));

      } catch (e) {
        Alert.alert('Upload failed', 'Could not upload photo.');
        console.error(e);
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* — Settings & Change Type Row — */}
      <View style={styles.topActionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => { /* TODO: settings */ }}
        >
          <Ionicons name="settings-outline" size={24} color="#6C3FB5" />
          <Text style={styles.actionText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.push('EditProfileType', { currentType: user.profile_type })}
        >
          <Ionicons name="swap-horizontal-outline" size={24} color="#6C3FB5" />
          <Text style={styles.actionText}>Change Type</Text>
        </TouchableOpacity>
      </View>
      {/* — Group Photo */}
      <View style={styles.photoSection}>
        <Image
          source={{ uri: user.profile_picture || 'https://placekitten.com/200/200' }}
          style={styles.groupPhoto}
        />
        <Text style={styles.profileType}>Duo</Text>
        <TouchableOpacity style={styles.pillButton} onPress={handleAddPhoto}>
          <Text style={styles.pillText}>Upload New Profile Picture</Text>
        </TouchableOpacity>
      </View>

      {/* — Shared Info */}
      <View style={styles.card}>
        <View style={styles.rowHeader}>
          <Text style={styles.cardTitle}>Shared Info</Text>
          <TouchableOpacity onPress={() => navigation.push('EditDuoShared',{user})}>
            <Ionicons name="pencil-outline" size={20} color="#6C3FB5" />
          </TouchableOpacity>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Location</Text>
          <Text style={styles.infoValue}>{user.location || '—'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Looking For</Text>
          <Text style={styles.infoValue}>{user.looking_for || '—'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Past Activities</Text>
          <Text style={styles.infoValue}>{(user.past_activities||[]).join(', ') || '—'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Interests</Text>
          <Text style={styles.infoValue}>{(user.interests||[]).join(', ') || '—'}</Text>
        </View>
      </View>

      

      {/* — Members */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Members</Text>
        {members.map(m => (
          <View key={m.id} style={styles.memberRow}>
            <Image source={{ uri: m.profile_photo||'https://placekitten.com/100' }}
                   style={styles.memberAvatar} />
            <Text style={styles.memberName}>{m.name}</Text>
            <TouchableOpacity onPress={() => navigation.push('EditDuoMember',{member:m})} style={{ marginRight: 15 }}>
              <Text style={styles.editSmall}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>handleDeleteMember(m.id)}>
              <Ionicons name="trash-outline" size={20} color="red" />
            </TouchableOpacity>
          </View>
        ))}

        {/* only if less than 2 */}
        {members.length < 2 && (
          <TouchableOpacity
            style={styles.pillButton}
            onPress={() => navigation.push('AddDuoMember',{
              step: members.length+1,
              sharedData:{location:user.location,interests:user.interests,looking_for:user.looking_for},
              member1: members[0]||{}
            })}
          >
            <Ionicons name="person-add-outline" size={16} color="#6C3FB5" style={{marginRight:4}}/>
            <Text style={styles.pillText}>Add Member</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* — Logout Button — */}
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
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F7F3FF',
  },
  headerBtn: { paddingHorizontal: 16 },
  saveText: { color: '#B76EFF', fontWeight: '600', fontSize: 16 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photoSection: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  groupPhoto: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  profileType: { fontSize: 20, fontWeight: '600', color: '#333', marginBottom: 8 },
  pillButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F5', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  pillText: { color: '#6C3FB5', fontWeight: '600', fontSize: 14 },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  memberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  memberName: { flex: 1, fontSize: 15, color: '#333' },
  editSmall: { color: '#6C3FB5', fontSize: 14, fontWeight: '500' },
  interestsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  interestPill: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: '#F0F0F5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius:    16,
    marginRight:     8,
    marginBottom:    8,
  },
  interestText:    { fontSize: 13, color: '#6C3FB5' },
  infoRow:         {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   12,
  },
  infoLabel:       { color: '#555', fontWeight: '600' },
  infoValue:       { color: '#333', maxWidth: '65%', textAlign: 'right' },
  topActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  actionBtn: {
    alignItems: 'center',
    padding: 5,
  },
  actionText: {
    marginTop: 4,
    fontSize: 12,
    color: '#6C3FB5',
  },
  logoutButton: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  logoutText: {
    marginTop: 4,
    fontSize: 12,
    color: 'red',
  },
});