import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCurrentUser,
  getDuoMembers,
  getDuoMemberPhotos,
} from '../../utils/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function DuoProfileScreen() {
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [photosMap, setPhotosMap] = useState({});
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
          // 1) fetch user
          const { data: me } = await getCurrentUser(token);
          if (!isActive) return;
          setUser(me);

          // 2) if duo, fetch members
          if (me.profile_type === 'duo') {
            const { data: duoList } = await getDuoMembers(token);
            if (!isActive) return;
            setMembers(duoList);

            // 3) fetch photos for each member
            const newMap = {};
            for (const m of duoList) {
              try {
                const { data: pics } = await getDuoMemberPhotos(m.id, token);
                newMap[m.id] = pics;
              } catch {
                newMap[m.id] = [];
              }
            }
            if (isActive) setPhotosMap(newMap);
          }
        } catch (err) {
          console.error('Error loading duo profile:', err);
        } finally {
          if (isActive) setLoading(false);
        }
      }

      fetchAll();
      return () => { isActive = false; };
    }, [])
  );

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
      {/* Shared Info Card */}
      <Text style={styles.header}>Duo Profile</Text>
      <View style={styles.card}>
        <Text style={styles.label}>📍 Location:</Text>
        <Text style={styles.value}>{user.location || 'N/A'}</Text>

        <Text style={styles.label}>🎯 Looking For:</Text>
        <Text style={styles.value}>{user.looking_for || 'N/A'}</Text>

        <Text style={styles.label}>🎨 Interests:</Text>
        <Text style={styles.value}>
          {Array.isArray(user.interests)
            ? JSON.stringify(user.interests)
            : user.interests || 'N/A'}
        </Text>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate('EditDuoShared', { user })}
        >
          <Text style={styles.editText}>Edit Shared Info</Text>
        </TouchableOpacity>
      </View>

      {/* Change Type / Logout */}
      <TouchableOpacity
        onPress={() => navigation.navigate('EditProfileType', { currentType: user.profile_type })}
      >
        <Text style={styles.changeTypeButton}>Change Profile Type</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={async () => {
        await AsyncStorage.removeItem('token');
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      }}>
        <Text style={styles.logout}>Logout</Text>
      </TouchableOpacity>

      {/* Members */}
      <Text style={styles.subHeader}>Members</Text>
      {members.length < 2 && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddDuoMember', {
            step: members.length + 1,
            sharedData: {
              location:    user.location,
              interests:   user.interests,
              looking_for: user.looking_for,
            },
            member1: members[0] || {},
          })}
        >
          <Text style={styles.addButtonText}>
            {members.length === 1 ? 'Add Second Member' : 'Add Member'}
          </Text>
        </TouchableOpacity>
      )}
      {members.length === 0 && <Text style={styles.noMembers}>No members added yet.</Text>}

      {members.map(m => (
        <View key={m.id} style={styles.memberCard}>
          <View style={styles.infoContainer}>
            <Text style={styles.memberName}>{m.name}</Text>
            <Text>Age: {m.age}</Text>
            <Text>Gender: {m.gender}</Text>
            <Text>
              Ethnicity:{' '}
              {Array.isArray(m.ethnicity)
                ? JSON.stringify(m.ethnicity)
                : m.ethnicity || 'N/A'}
            </Text>
            <Text>
              Personality:{' '}
              {Array.isArray(m.personality)
                ? JSON.stringify(m.personality)
                : m.personality || 'N/A'}
            </Text>
            <Text>
              Occupation:{' '}
              {Array.isArray(m.occupation)
                ? JSON.stringify(m.occupation)
                : m.occupation || 'N/A'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('EditDuoMember', { member: m })}
          >
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
          {photosMap[m.id]?.length > 0 && (
            <View style={styles.miniPhotoGrid}>
              {photosMap[m.id].map(p => (
                <Image key={p.id} source={{ uri: p.photo_url }} style={styles.miniPhoto} />
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#f7f7f7', flexGrow: 1 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:    { fontSize: 26, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  card:      { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 20, borderWidth:1, borderColor:'#ddd' },
  label:     { fontWeight: '600', marginTop: 12 },
  value:     { marginBottom: 8 },
  editBtn:   { marginTop: 10 },
  editText:  { color: '#007AFF', fontSize: 14, fontWeight: '500' },
  changeTypeButton: { marginTop: 30, alignSelf: 'center', padding: 12, borderRadius: 8, backgroundColor: '#007AFF' },
  logout:    { color: 'gray', fontSize: 14, textAlign: 'center', marginTop: 20 },
  subHeader: { fontSize: 20, fontWeight: '600', marginTop: 24, marginBottom: 12 },
  addButton: { backgroundColor: '#007AFF', padding:12, borderRadius:8, alignSelf:'center', marginBottom:12, width:'60%' },
  addButtonText: { color:'white', textAlign:'center', fontWeight:'600' },
  noMembers:{ color:'gray', fontStyle:'italic' },
  memberCard:{ backgroundColor:'#fff', borderRadius:10, padding:12, marginBottom:12, flexDirection:'row', alignItems:'center' },
  infoContainer:{ flex:1, marginLeft:8 },
  memberName:{ fontWeight:'bold', fontSize:16 },
  miniPhotoGrid:{ flexDirection:'row', flexWrap:'wrap', marginTop:10 },
  miniPhoto:{ width:60, height:60, borderRadius:8, marginRight:8, marginBottom:8 },
});