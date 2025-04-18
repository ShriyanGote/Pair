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
  uploadProfilePhoto,
  uploadUnoPhoto,
  getUserPhotos,
  deleteUserPhoto,
  deleteUserPhotoByUrl,
} from '../../utils/api';
import axios from 'axios';
import { API_URL } from '../../utils/api';

const ProfileScreen = () => {
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

  // height dropdown
  const [heightOpen, setHeightOpen] = useState(false);
  const [heightItems, setHeightItems] = useState([]);

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
  const handleImagePick = async () => {
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
        const res = await uploadProfilePhoto(formData, token);
        setUserInfo((u) => ({ ...u, profile_photo: res.data.photo_url }));
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

  // 6) Save UNO profile edits
  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_URL}/uno-profile`,
        {
          age: userInfo.age,
          gender: userInfo.gender,
          bio: userInfo.bio,
          occupation: userInfo.occupation || [],
          ethnicity: userInfo.ethnicity || [],
          personality: userInfo.personality || [],
          past_activities: userInfo.past_activities || [],
          social_media_use: userInfo.social_media_use,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Profile updated!');
      setEditing(false);
    } catch {
      Alert.alert('Error', 'Could not update profile.');
    }
  };

  // 7) Go to the “Edit Profile Details” sub‑screen
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

  // on mount: load user & build height options
  useEffect(() => {
    fetchUser();
    const opts = [];
    for (let ft = 4; ft <= 7; ft++) {
      for (let inch = 0; inch < 12; inch++) {
        const val = (ft + inch / 12).toFixed(2);
        if (val >= 4.5 && val <= 7.0) opts.push({ label: `${ft}'${inch}"`, value: parseFloat(val) });
      }
    }
    setHeightItems(opts);
  }, []);

  // update a single field
  const handleChange = (field, val) =>
    setUserInfo((u) => ({ ...u, [field]: val }));

  if (!userInfo) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <KeyboardAwareScrollView contentContainerStyle={styles.container}>
        <Text style={styles.profileType}>
          {userInfo.profile_type === 'uno' && '🧍 Uno'}
          {userInfo.profile_type === 'duo' && '🧑‍🤝‍🧑 Duo'}
          {userInfo.profile_type === 'group' && '👯 Group'}
        </Text>

        {/* UNO additional photos */}
        {userInfo.profile_type === 'uno' && (
          <>
            {photos.length === 0 ? (
              <Text style={styles.noPhotosText}>No photos yet</Text>
            ) : (
              <View style={styles.photoGrid}>
                {photos.map((p) => (
                  <View key={p.id} style={styles.photoWrapper}>
                    <Image source={{ uri: p.photo_url }} style={styles.photoImage} />
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeletePhoto(p.id)}
                    >
                      <Text style={styles.deleteBtnText}>X</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity onPress={handleAddPhoto}>
              <Text style={styles.link}>Add Another Photo</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Name */}
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={userInfo.name || ''}
          onChangeText={(v) => handleChange('name', v)}
          editable={editing}
        />

        {/* Age */}
        <TextInput
          style={styles.input}
          placeholder="Age"
          keyboardType="numeric"
          value={userInfo.age?.toString() || ''}
          onChangeText={(v) => handleChange('age', v)}
          editable={editing}
        />

        {/* Gender */}
        <DropDownPicker
          open={genderOpen}
          setOpen={setGenderOpen}
          items={genderItems}
          setItems={setGenderItems}
          value={userInfo.gender}
          setValue={(cb) => handleChange('gender', cb())}
          disabled={!editing}
          placeholder="Select Gender"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
        />

        {/* Location */}
        {editing ? (
          <GooglePlacesAutocomplete
            placeholder="Search location"
            minLength={2}
            fetchDetails
            onPress={(_, details) =>
              handleChange('location', details.formatted_address)
            }
            query={{ key: GOOGLE_API_KEY, language: 'en' }}
            styles={{ textInput: styles.input }}
          />
        ) : (
          <TextInput
            style={styles.input}
            placeholder="Location"
            value={userInfo.location || ''}
            editable={false}
          />
        )}

        {/* Height */}
        <DropDownPicker
          zIndex={3000}
          open={heightOpen}
          setOpen={setHeightOpen}
          items={heightItems}
          setItems={setHeightItems}
          value={userInfo.height}
          setValue={(cb) => handleChange('height', cb())}
          disabled={!editing}
          placeholder="Select Height"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
        />

        {/* Bio */}
        <TextInput
          style={styles.input}
          placeholder="Bio"
          value={userInfo.bio || ''}
          onChangeText={(v) => handleChange('bio', v)}
          editable={editing}
          multiline
        />

        {/* Save / Edit */}
        {editing ? (
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.link}>Save</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Text style={styles.link}>Edit</Text>
          </TouchableOpacity>
        )}

        {/* Change profile type */}
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('EditProfileType', {
              currentType: userInfo.profile_type,
            })
          }
        >
          <Text style={styles.link}>Change Profile Type</Text>
        </TouchableOpacity>

        {/* Edit Profile Details */}
        <TouchableOpacity onPress={handleEditProfileDetails}>
          <Text style={styles.link}>Edit Profile Details</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity
          onPress={() => {
            AsyncStorage.removeItem('token');
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          }}
        >
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
};

export default ProfileScreen;
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fdf9ff', // light lavender background
  },
  profileType: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
    color: '#6c2bb9',
  },
  noPhotosText: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#666',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
  },
  photoWrapper: {
    width: 90,
    height: 90,
    margin: 6,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  deleteBtn: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: 'rgba(183, 110, 255, 0.8)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dropdown: {
    marginBottom: 15,
    borderRadius: 10,
    borderColor: '#ddd',
    zIndex: 1000,
  },
  dropdownContainer: {
    borderRadius: 10,
    borderColor: '#ddd',
    zIndex: 1000,
  },
  link: {
    color: '#B76EFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  logout: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
});