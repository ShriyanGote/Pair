import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

import { API_BASE_URL } from '@env';
// or your other imports...
import {
  getGroupMemberPhotos,
  uploadGroupMemberPhoto,
  deleteGroupMemberPhoto,
} from '../../utils/api'; // you'll define these

const EditDuoMember = ({ route, navigation }) => {
  const { member } = route.params;

  const [name, setName] = useState(member.name || '');
  const [age, setAge] = useState(String(member.age || ''));
  const [height, setHeight] = useState(member.height || null);
  const [heightOpen, setHeightOpen] = useState(false);
  const [heightItems, setHeightItems] = useState([]);

  // NEW photo state
  const [photos, setPhotos] = useState([]);

  // 1. fetch member photos
  useEffect(() => {
    fetchMemberPhotos();

    // build height dropdown options
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

  const fetchMemberPhotos = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await getGroupMemberPhotos(member.id, token);
      // res.data should be: [{ id, photo_url }, ...]
      setPhotos(res.data);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load member photos');
    }
  };

  // 2. handle "Add Photo"
  const handleAddPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
      });
      if (result.canceled) return;

      const uri = result.assets[0].uri;
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'member_photo.jpg',
        type: 'image/jpeg',
      });

      const token = await AsyncStorage.getItem('token');
      const uploadRes = await uploadGroupMemberPhoto(member.id, formData, token);
      // uploadRes.data => { photo_id, photo_url }
      setPhotos((prev) => [
        ...prev,
        { id: uploadRes.data.photo_id, photo_url: uploadRes.data.photo_url },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not upload photo');
    }
  };

  // 3. handle "Delete Photo"
  const handleDeletePhoto = async (photoId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await deleteGroupMemberPhoto(member.id, photoId, token);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not delete photo');
    }
  };

  // Save changes for name/age/height
  const handleSave = async () => {
    if (!name || !age || !height) {
      Alert.alert('Missing Fields', 'Please fill out all fields.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      // normal update call
      // ...
      Alert.alert('Updated', 'Member info saved.');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not update member.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Edit Member</Text>

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <Text>No photos yet</Text>
      ) : (
        <View style={styles.photoContainer}>
          {photos.map((photo) => (
            <View key={photo.id} style={styles.photoWrapper}>
              <Image source={{ uri: photo.photo_url }} style={styles.photoImage} />
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
      {/* Button to add new photo */}
      <TouchableOpacity onPress={handleAddPhoto} style={styles.addPhotoBtn}>
        <Text style={styles.addPhotoText}>Add Member Photo</Text>
      </TouchableOpacity>

      {/* Name/Age/Height Inputs */}
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Age"
        keyboardType="numeric"
        value={age}
        onChangeText={setAge}
      />

      <DropDownPicker
        open={heightOpen}
        setOpen={setHeightOpen}
        items={heightItems}
        setItems={setHeightItems}
        value={height}
        setValue={setHeight}
        placeholder="Select Height"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default EditDuoMember;

const styles = StyleSheet.create({
  container: {
    padding: 30,
    backgroundColor: '#f2f2f2',
    flexGrow: 1,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  photoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoWrapper: {
    width: 90,
    height: 90,
    margin: 5,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
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
    fontWeight: 'bold',
  },
  addPhotoBtn: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  addPhotoText: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  dropdown: {
    marginBottom: 15,
    borderRadius: 8,
    borderColor: '#ccc',
  },
  dropdownContainer: {
    borderRadius: 8,
    borderColor: '#ccc',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
});