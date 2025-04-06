import React, { useEffect, useState } from 'react';
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
import { getCurrentUser, getGroupMemberPhotos } from '../../utils/api';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const DuoProfileScreen = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const [memberPhotosMap, setMemberPhotosMap] = useState({});

  const fetchUser = async () => {
    setLoading(true);
    const token = await AsyncStorage.getItem('token');
    if (!token) return;
  
    try {
      const response = await getCurrentUser(token);
      const userData = response.data;
      setUser(userData);
  
      if (userData.profile_type === 'duo' && userData.members) {
        const newMap = {};
        for (const mem of userData.members) {
          try {
            const res = await getGroupMemberPhotos(mem.id, token);
            newMap[mem.id] = res.data; 
          } catch (err) {
            console.error('Error fetching photos for member', mem.id, err);
            newMap[mem.id] = []; 
          }
        }
        setMemberPhotosMap(newMap);
      }
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

  const handleEditShared = () => {
    navigation.navigate('EditDuoShared', { user });
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const handleEditMember = (member) => {
    navigation.navigate('EditDuoMember', {
      member,
    });
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
          navigation.navigate('EditProfileType', {
            currentType: user.profile_type,
          })
        }>
        <Text style={styles.changeTypeButton}>Change Profile Type</Text>
      </TouchableOpacity>

      <>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </>


      <Text style={styles.subHeader}>Members</Text>

      {user.members?.length < 2 && (
      <TouchableOpacity
        style={[
          styles.addButton,
          user.members.length === 2 && { backgroundColor: '#ccc' },
        ]}
        onPress={() => {
          if (user.members.length < 2) {
            navigation.navigate('AddDuoMember', {
              step: user.members.length + 1,
              sharedData: {
                location: user.location,
                interests: user.interests,
                lookingFor: user.looking_for,
              },
              member1: user.members[0], // pass existing if present
            });
          }
        }}
        disabled={user.members.length === 2}>
        <Text style={styles.addButtonText}>
          {user.members.length === 1 ? 'Add Second Member' : 'Add Member'}
        </Text>
      </TouchableOpacity>
      )}

    {user.members.map((member) => {
      const memberPics = memberPhotosMap[member.id] || [];  // array of objects: {id, photo_url}

      return (
        <View key={member.id} style={styles.memberCard}>
          {/* Existing block for member’s single profile_photo */}
          {member.profile_photo ? (
            <Image source={{ uri: member.profile_photo }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.initials}>{member.name?.[0]}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text>Age: {member.age}</Text>
            {member.height && <Text>Height: {member.height}"</Text>}
          </View>

          <TouchableOpacity onPress={() => handleEditMember(member)}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>

          {/* Then a mini-grid of that member’s photos */}
          {memberPics.length > 0 && (
            <View style={styles.miniPhotoGrid}>
              {memberPics.map((pic) => (
                <Image
                  key={pic.id}
                  source={{ uri: pic.photo_url }}
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
  container: {
    padding: 24,
    backgroundColor: '#f7f7f7',
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  label: {
    fontWeight: '600',
    marginTop: 12,
  },
  value: {
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
  },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    shadow: 100,
    // any shadow or border you like
  },
  initials: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  memberName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  noMembers: {
    color: 'gray',
    fontStyle: 'italic',
  },
  editBtn: {
    marginTop: 10,
  },
  editText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  changeTypeButton: {
    marginTop: 30,
    alignSelf: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  changeTypeText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 12,
    width: '60%',
  },
  addButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  logout: {
    color: 'gray',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },  miniPhotoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  miniPhoto: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  photoRow: {
    flexDirection: 'row',
    marginTop: 10,
    flexWrap: 'wrap', // if you want them to wrap to new lines
  },
  editText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1, 
    // so text can flow, giving it as much horizontal space as needed
  },
});
