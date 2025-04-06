import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DropDownPicker from 'react-native-dropdown-picker';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

import { GOOGLE_API_KEY } from '@env';
import {
  getCurrentUser,
  updateUser,
  uploadProfilePhoto,
  uploadUnoPhoto,
  getUserPhotos,
  deleteUserPhoto,
  deleteUserPhotoByUrl,  // <-- import the delete function
} from '../../utils/api';

const ProfileScreen = () => {
  const navigation = useNavigation();
  
  const [userInfo, setUserInfo] = useState(null);
  const [editing, setEditing] = useState(false);
  const [photos, setPhotos] = useState([]);

  // Gender dropdown
  const [genderOpen, setGenderOpen] = useState(false);
  const [genderItems, setGenderItems] = useState([
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Non-binary', value: 'Non-binary' },
  ]);

  // Height dropdown
  const [heightOpen, setHeightOpen] = useState(false);
  const [heightItems, setHeightItems] = useState([]);

  // Type profile
  const [profileTypeOpen, setProfileTypeOpen] = useState(false);
  const [profileTypeItems, setProfileTypeItems] = useState([
    { label: '🧍 Uno', value: 'uno' },
    { label: '🧑‍🤝‍🧑 Duo', value: 'duo' },
    { label: '👯 Group', value: 'group' },
  ]);

  // 1) Fetch user + photos
  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await getCurrentUser(token);
      setUserInfo(response.data);

      // If UNO, fetch the photo objects (id + url)
      if (response.data.profile_type === 'uno') {
        const userPhotos = await getUserPhotos(response.data.id, token);
        // userPhotos.data is something like: [{ id: 1, photo_url: "..."}, ...]
        setPhotos(userPhotos.data);
      }
    } catch (error) {
      console.error('Error fetching user:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load user info');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await updateUser(userInfo.id, userInfo, token);
      Alert.alert('Success', 'Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      console.error('Error updating user:', err);
      Alert.alert('Error', 'Could not update profile.');
    }
  };

  // 2) Profile Photo (for main userInfo.profile_photo)
  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      });
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await uploadProfilePhoto(formData, token);
        setUserInfo((prev) => ({ ...prev, profile_photo: res.data.photo_url }));
      } catch (error) {
        console.error(error);
        Alert.alert('Upload failed', 'Please try again');
      }
    }
  };

  async function handleDeleteByUrl(photoUrl) {
    const token = await AsyncStorage.getItem('token');
    await deleteUserPhotoByUrl(userInfo.id, photoUrl, token);
    setPhotos(prev => prev.filter(p => p !== photoUrl));
  }

  // 3) Additional Photos for UNO
  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      });

      try {
        const token = await AsyncStorage.getItem('token');
        const res = await uploadUnoPhoto(formData, token);
        // Expect res.data to have { photo_id, photo_url }
        setPhotos((prev) => [...prev, {
          id: res.data.photo_id,
          photo_url: res.data.photo_url,
        }]);
      } catch (error) {
        Alert.alert('Upload failed', error.response?.data?.detail || 'Please try again');
      }
    }
  };

  console.log('Photos array:', photos);

  // 4) Delete a photo
  const handleDeletePhoto = async (photoId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      // userInfo.id is the current user’s ID
      await deleteUserPhoto(userInfo.id, photoId, token);

      // Remove the photo locally
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not delete photo.');
    }
  };

  // 5) Setup once the component mounts
  useEffect(() => {
    fetchUser();

    // Build height dropdown (4ft0in to 7ft0in)
    const options = [];
    for (let feet = 4; feet <= 7; feet++) {
      for (let inches = 0; inches <= 11; inches++) {
        const total = (feet + inches / 12).toFixed(2);
        if (total >= 4.5 && total <= 7.0) {
          options.push({ label: `${feet}'${inches}"`, value: parseFloat(total) });
        }
      }
    }
    setHeightItems(options);
  }, []);

  // update userInfo
  const handleChange = (field, value) => {
    setUserInfo((prev) => ({ ...prev, [field]: value }));
  };

  // If user info not loaded, show spinner
  if (!userInfo) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

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

        {/* Show up to 5 additional photos for UNO */}
        {userInfo.profile_type === 'uno' && (
          <>
            {photos.length === 0 ? (
              <Text style={styles.noPhotosText}>No photos yet</Text>
            ) : (
              <View style={styles.photoGrid}>
                {photos.map((photo) => (
                  <View key={photo.id} style={styles.photoWrapper}>

                    {/* Show the image via photo.photo_url */}
                    <Image
                      source={{ uri: photo.photo_url }}
                      style={styles.photoImage}
                    />

                    {/* Delete by ID */}
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeletePhoto(photo.id)}
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
          onChangeText={(value) => handleChange('name', value)}
          editable={editing}
        />
        
        {/* Age */}
        <TextInput
          style={styles.input}
          placeholder="Age"
          value={userInfo.age?.toString() || ''}
          onChangeText={(value) => handleChange('age', value)}
          editable={editing}
          keyboardType="numeric"
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

        {/* Location - if editing, show google autocomplete */}
        {editing ? (
          <GooglePlacesAutocomplete
            placeholder="Search for location"
            minLength={2}
            fetchDetails={true}
            onPress={(data) => {
              handleChange('location', data.description);
            }}
            query={{
              key: GOOGLE_API_KEY,
              language: 'en',
            }}
            styles={{
              textInput: styles.input,
            }}
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
          zIndexInverse={1000}
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
          onChangeText={(value) => handleChange('bio', value)}
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

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout}>
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
    padding: 30,
    backgroundColor: '#f2f2f2',
  },
  profileType: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  noPhotosText: {
    textAlign: 'center',
    marginBottom: 10,
    color: '#555',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  photoWrapper: {
    width: 90,
    height: 90,
    margin: 5,
    position: 'relative', // for the delete button
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  deleteBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  placeholderAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ddd',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  link: {
    color: 'blue',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  logout: {
    color: 'gray',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  dropdown: {
    marginBottom: 15,
    borderRadius: 8,
    borderColor: '#ccc',
    zIndex: 1000,
  },
  dropdownContainer: {
    borderRadius: 8,
    borderColor: '#ccc',
    zIndex: 1000,
  },
});
