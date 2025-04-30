import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import DropDownPicker from 'react-native-dropdown-picker';
import EditProfileDetails from './EditProfileDetails.js';
import { GOOGLE_API_KEY } from '@env';
import {
  getCurrentUser,
  updateUser,
  uploadUnoPhoto,
  getUserPhotos,
  deleteUserPhoto,
  deleteUserPhotoByUrl,
  uploadUnoProfilePhoto
} from '../../utils/api';
import axios from 'axios';
import { API_URL } from '../../utils/api';
import { Ionicons } from '@expo/vector-icons';

const EditProfileView = () => {
  const navigation = useNavigation();
  const [userInfo, setUserInfo] = useState(null);
  const [editing, setEditing] = useState(false);
  const [photos, setPhotos] = useState([]);

  // gender dropdown
  const [genderOpen, setGenderOpen] = useState(false);
  const [genderItems, setGenderItems] = useState([
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Non-binary', value: 'Non-binary' },
  ]);


  // profile‐type dropdown (if you ever allow inline change)
  const [profileTypeOpen, setProfileTypeOpen] = useState(false);
  const [profileTypeItems, setProfileTypeItems] = useState([
    { label: '🧍 Uno', value: 'uno' },
    { label: '🧑‍🤝‍🧑 Duo', value: 'duo' },
    { label: '👯 Group', value: 'group' },
  ]);

  // 1) Fetch user + UNO photos
const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await getCurrentUser(token);
      setUserInfo(response.data);

      if (response.data.profile_type === 'uno') {
        const userPhotos = await getUserPhotos(response.data.id, token);
        setPhotos(userPhotos.data);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load user info');
    }
  };

  // 2) Upload main profile photo
  const handleProfilePic = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const formData = new FormData();
      formData.append('file', { uri, name: 'profile.jpg', type: 'image/jpeg' });
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await uploadUnoProfilePhoto(formData, token);
        setUserInfo((u) => ({ ...u, profile_picture: res.profile_picture }));
      } catch {
        Alert.alert('Upload failed', 'Please try again');
      }
    }
  };


  // 3) Add another UNO photo
  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const formData = new FormData();
      formData.append('file', { uri, name: 'photo.jpg', type: 'image/jpeg' });
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await uploadUnoPhoto(formData, token);
        setPhotos((ps) => [
          ...ps,
          { id: res.data.photo_id, photo_url: res.data.photo_url },
        ]);
      } catch (err) {
        Alert.alert('Upload failed', err.response?.data?.detail || 'Please try again');
      }
    }
  };

  // 4) Delete a UNO photo by ID
  const handleDeletePhoto = async (photoId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await deleteUserPhoto(userInfo.id, photoId, token);
      setPhotos((ps) => ps.filter((p) => p.id !== photoId));
    } catch {
      Alert.alert('Error', 'Could not delete photo.');
    }
  };

  // 5) Delete profile photo by URL
  const handleDeleteByUrl = async (url) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await deleteUserPhotoByUrl(userInfo.id, url, token);
      setPhotos((ps) => ps.filter((p) => p.photo_url !== url));
    } catch {
      Alert.alert('Error', 'Could not delete photo by URL.');
    }
  };

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
  
      // Update uno_profile fields
      await axios.post(
        `${API_URL}/uno-profile`,
        {
          age: userInfo.age,
          gender: userInfo.gender,
          bio: userInfo.bio,
          location: userInfo.location,   // <-- add this
          name: userInfo.name, 
          occupation: userInfo.occupation || [],
          ethnicity: userInfo.ethnicity || [],
          personality: userInfo.personality || [],
          past_activities: userInfo.past_activities || [],
          social_media_use: userInfo.social_media_use,
          interests: userInfo.interests || [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      // Update base user table (name and location)
      await axios.put(
        `${API_URL}/users/${userInfo.id}`,
        {
          name: userInfo.name,
          location: userInfo.location,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      Alert.alert('Success', 'Profile updated!');
      setEditing(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not update profile.');
    }
  };

  // 7) Go to the "Edit Profile Details" sub‑screen
  const handleEditProfileDetails = () => {
    navigation.navigate('EditProfileDetails', {
      ethnicity: userInfo.ethnicity || [],
      socialMediaUse: userInfo.social_media_use,
      pastActivities: userInfo.past_activities || [],
      occupation: userInfo.occupation || [],
      onSave: async (fields) => {
        try {
          const token = await AsyncStorage.getItem('token');
          await updateUser(
            userInfo.id,
            {
              ...userInfo,
              ethnicity: fields.ethnicity,
              social_media_use: fields.socialMediaUse,
              past_activities: fields.pastActivities,
              occupation: fields.occupation,
            },
            token
          );
          Alert.alert('Success', 'Details updated!');
          fetchUser();
        } catch {
          Alert.alert('Error', 'Failed to update details.');
        }
      },
    });
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // update a single field
  const handleChange = (field, val) =>
    setUserInfo((u) => ({ ...u, [field]: val }));

  if (!userInfo) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C3FB5" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <KeyboardAwareScrollView contentContainerStyle={styles.screen}>
        {/* — HEADER CARD */}
        <View style={styles.photoCard}>
          <Image
            source={{ uri: userInfo.profile_picture || 'https://placekitten.com/200/200' }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.uploadPill} onPress={handleProfilePic}>
            <Text style={styles.uploadText}>Upload New Profile Photo</Text>
          </TouchableOpacity>
          <Text style={styles.profileType}>
            {userInfo.profile_type === 'uno' && '🧍 Uno'}
            {userInfo.profile_type === 'duo' && '🧑‍🤝‍🧑 Duo'}
            {userInfo.profile_type === 'group' && '👯 Group'}
          </Text>
        </View>


      {/* <View style={styles.photoSection}>
        <Image
          source={{ uri: user.profile_picture || 'https://placekitten.com/200/200' }}
          style={styles.groupPhoto}
        />
        <Text style={styles.profileType}>Duo</Text>
        <TouchableOpacity style={styles.pillButton} onPress={handleAddPhoto}>
          <Text style={styles.pillText}>Upload New Profile Picture</Text>
        </TouchableOpacity>
      </View> */}

        {/* — UNO EXTRA PHOTOS */}
        {userInfo.profile_type === 'uno' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your Photos</Text>
            {photos.length === 0 ? (
              <Text style={styles.noPhotos}>No photos yet</Text>
            ) : (
              <View style={styles.photoGrid}>
                {photos.map((p) => (
                  <View key={p.id} style={styles.photoWrapper}>
                    <Image source={{ uri: p.photo_url }} style={styles.photoImage} />
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeletePhoto(p.id)}
                    >
                      <Text style={styles.deleteX}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity style={styles.primaryPill} onPress={handleAddPhoto}>
              <Text style={styles.primaryText}>Add Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* — BASIC INFO FORM */}
        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={userInfo.name}
            onChangeText={(v) => setUserInfo(u => ({ ...u, name: v }))}
            editable={editing}
          />
          <TextInput
            style={styles.input}
            placeholder="Age"
            keyboardType="numeric"
            value={userInfo.age?.toString()}
            onChangeText={(v) => setUserInfo(u => ({ ...u, age: v }))}
            editable={editing}
          />
          <DropDownPicker
            open={genderOpen}
            setOpen={setGenderOpen}
            items={genderItems}
            setItems={setGenderItems}
            value={userInfo.gender}
            setValue={cb => setUserInfo(u => ({ ...u, gender: cb() }))}
            disabled={!editing}
            placeholder="Select Gender"
            style={styles.input}
            dropDownContainerStyle={[styles.input, { zIndex: 1000 }]}
          />
          {editing ? (
            <GooglePlacesAutocomplete
              placeholder="Location"
              fetchDetails
              onPress={(_, details) =>
                setUserInfo(u => ({ ...u, location: details.formatted_address }))
              }
              query={{ key: GOOGLE_API_KEY, language: 'en' }}
              styles={{ textInput: styles.input }}
            />
          ) : (
            <TextInput
              style={styles.input}
              placeholder="Location"
              value={userInfo.location}
              editable={false}
            />
          )}
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Bio"
            value={userInfo.bio}
            onChangeText={v => setUserInfo(u => ({ ...u, bio: v }))}
            editable={editing}
            multiline
          />

        <View style={styles.buttonRow}>
            {editing ? (
              <TouchableOpacity style={styles.primaryPill} onPress={handleSave}>
                <Text style={styles.primaryText}>Save</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.primaryPill} onPress={() => setEditing(true)}>
                <Text style={styles.primaryText}>Edit</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.secondaryPill} onPress={handleEditProfileDetails}>
              <Text style={styles.secondaryText}>Edit Profile Details</Text>
            </TouchableOpacity>
          </View>
        </View>

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
            onPress={() => navigation.navigate('EditProfileType', { currentType: userInfo.profile_type })}
          >
            <Ionicons name="swap-horizontal-outline" size={24} color="#6C3FB5" />
            <Text style={styles.actionText}>Change Type</Text>
          </TouchableOpacity>
        </View>

        {/* — Logout Button — */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={async () => {
            await AsyncStorage.removeItem('token');
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          }}
        >
          <Ionicons name="log-out-outline" size={24} color="red" />
          <Text style={styles.actionText}>Logout</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditProfileView;

const styles = StyleSheet.create({
  screen: { backgroundColor: '#f7f7f7', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 3 },
  photoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 3 },
  header: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#333' },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12, borderWidth: 1, borderColor: '#ddd' },
  uploadPill: { backgroundColor: '#F0F0F5', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginBottom: 12 },
  uploadText: { fontSize: 14, fontWeight: '600', color: '#6C3FB5' },
  profileType: { fontSize: 16, fontWeight: '600', color: '#6C3FB5' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  noPhotos: { textAlign: 'center', color: '#888', marginBottom: 12 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  photoWrapper: { width: 80, height: 80, margin: 6, position: 'relative' },
  photoImage: { width: '100%', height: '100%', borderRadius: 8, borderColor: '#ddd', borderWidth: 1 },
  deleteBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(183,110,255,0.8)', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  deleteX: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#ddd' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  primaryPill: { flex: 1, backgroundColor: '#B76EFF', paddingVertical: 12, borderRadius: 20, alignItems: 'center', marginRight: 8 },
  primaryText: { color: '#fff', fontWeight: '600' },
  secondaryPill: { flex: 1, backgroundColor: '#F0F0F5', paddingVertical: 12, borderRadius: 20, alignItems: 'center', marginLeft: 8 },
  secondaryText: { color: '#6C3FB5', fontWeight: '600' },
  topActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 0, marginVertical: 10, paddingHorizontal: 10 },
  actionBtn: { alignItems: 'center', padding: 5 },
  actionText: { marginTop: 4, fontSize: 12, color: '#6C3FB5' },
  logoutButton: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  logoutText: { marginTop: 4, fontSize: 12, color: 'red' }
});