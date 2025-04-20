import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import {
  getCurrentUser,
  getDuoMembers,
  getDuoMemberPhotos,
  deleteDuoMember,
  uploadDuoMemberPhoto,
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
          const { data: me } = await getCurrentUser(token);
          if (!isActive) return;
          setUser(me);

          if (me.profile_type === 'duo') {
            const { data: duoList } = await getDuoMembers(token);
            if (!isActive) return;
            setMembers(duoList);

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
      return () => {
        isActive = false;
      };
    }, [])
  );

  const handleDelete = (memberId) => {
    Alert.alert('Remove Member?', 'Are you sure you want to remove this duo member?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            await deleteDuoMember(memberId, token);
            setMembers(ms => ms.filter(m => m.id !== memberId));
            setPhotosMap(pm => {
              const { [memberId]: _, ...rest } = pm;
              return rest;
            });
          } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to remove member');
          }
        },
      },
    ]);
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
        const file = {
          uri: result.assets[0].uri,
          name: 'photo.jpg',
          type: 'image/jpeg',
        };
        const response = await uploadDuoMemberPhoto(memberId, file, token);

        if (response.photo_url) {
          setPhotosMap((pm) => ({
            ...pm,
            [memberId]: [...(pm[memberId] || []), response],
          }));
        }
      } catch (e) {
        Alert.alert('Upload failed', 'Could not upload photo.');
        console.error(e);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.center}><ActivityIndicator size="large" /></View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}><Text>Unable to load profile.</Text></View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Profile</Text>
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

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.push('EditDuoShared', { user })}
        >
          <Text style={styles.editText}>Edit Shared Info</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.secondaryAction}
        onPress={() => navigation.push('EditProfileType', { currentType: user.profile_type })}
      >
        <Text style={styles.secondaryText}>Change Profile Type</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryAction}
        onPress={async () => {
          await AsyncStorage.removeItem('token');
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        }}
      >
        <Text style={styles.logout}>Logout</Text>
      </TouchableOpacity>

      <Text style={styles.subHeader}>Members</Text>

      {members.length < 2 && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.push('AddDuoMember', {
            step: members.length + 1,
            sharedData: {
              location: user.location,
              interests: user.interests,
              looking_for: user.looking_for,
            },
            member1: members[0] || {},
            _timestamp: Date.now(),
          })}
        >
          <Text style={styles.addButtonText}>
            {members.length === 1 ? 'Add Second Member' : 'Add Member'}
          </Text>
        </TouchableOpacity>
      )}

      {members.length === 0 && (
        <Text style={styles.noMembers}>No members added yet.</Text>
      )}

      {members.map((m) => (
        <View key={m.id} style={styles.memberCard}>
          <View style={styles.infoContainer}>
            <Text style={styles.memberName}>{m.name}</Text>
            <Text>Age: {m.age}</Text>
            <Text>Gender: {m.gender}</Text>
            <Text>Ethnicity: {Array.isArray(m.ethnicity) ? m.ethnicity.join(', ') : m.ethnicity || 'N/A'}</Text>
            <Text>Personality: {Array.isArray(m.personality) ? m.personality.join(', ') : m.personality || 'N/A'}</Text>
            <Text>Occupation: {Array.isArray(m.occupation) ? m.occupation.join(', ') : m.occupation || 'N/A'}</Text>
          </View>

          <TouchableOpacity onPress={() => navigation.push('EditDuoMember', { member: m })}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>

          {photosMap[m.id]?.length > 0 && (
            <View style={styles.miniPhotoGrid}>
              {photosMap[m.id].map((p, idx) => (
                <Image
                  key={p.id || p.photo_url || idx} // ✅ Safe fallback
                  source={{ uri: p.photo_url }}
                  style={styles.miniPhoto}
                />
              ))}
            </View>
          )}

          <TouchableOpacity onPress={() => handleAddPhoto(m.id)}>
            <Text style={styles.editText}>Add Photo</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fdf9ff',
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#B76EFF',
  },
  subHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
    color: '#6C3FB5',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0d6f9',
  },
  label: {
    fontWeight: '600',
    marginTop: 12,
    color: '#444',
  },
  value: {
    marginBottom: 8,
    color: '#555',
  },
  editBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  editText: {
    color: '#B76EFF',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryAction: {
    alignSelf: 'center',
    marginTop: 12,
  },
  secondaryText: {
    color: '#6C3FB5',
    fontWeight: '600',
  },
  logout: {
    color: 'gray',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
  addButton: {
    backgroundColor: '#B76EFF',
    padding: 14,
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 16,
    width: '70%',
  },
  addButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  noMembers: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
  },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  infoContainer: {
    marginBottom: 12,
  },
  memberName: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 6,
  },
  miniPhotoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  miniPhoto: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
  },
});