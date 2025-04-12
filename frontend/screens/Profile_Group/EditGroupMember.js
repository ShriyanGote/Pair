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
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@env';
import {
  getGroupMemberPhotos,
  uploadGroupMemberPhoto,
  deleteGroupMemberPhoto,
  updateGroupMember,
} from '../../utils/api'; // you'll define these

const EditGroupMember = ({ route, navigation }) => {
  const { member } = route.params;

  const [name, setName] = useState(member.name || '');
  const [age, setAge] = useState(String(member.age || ''));
  const [height, setHeight] = useState(member.height || null);
  const [heightOpen, setHeightOpen] = useState(false);
  const [heightItems, setHeightItems] = useState([]);
  const [photos, setPhotos] = useState([]);


  useEffect(() => {
    fetchMemberPhotos();
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
    const token = await AsyncStorage.getItem('token');
    try {
      const res = await getGroupMemberPhotos(member.id, token);
      setPhotos(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not load photos');
    }
  };

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
        name: 'photo.jpg',
        type: 'image/jpeg',
      });
  
      const token = await AsyncStorage.getItem('token');
      const res = await uploadGroupMemberPhoto(member.id, formData, token);
      setPhotos((prev) => [...prev, res.data]);
    } catch (error) {
      console.error('[PHOTO UPLOAD ERROR]', error);
      Alert.alert('Error', 'Could not upload photo');
    }
  };

  const handleDeletePhoto = async (photoId) => {
    const token = await AsyncStorage.getItem('token');
    try {
      await deleteGroupMemberPhoto(member.id, photoId, token);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to delete');
    }
  };
  
  const handleSave = async () => {
    if (!name || !age || !height) {
      Alert.alert('Missing Fields', 'Please fill out all fields.');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/group-members/${member.id}`,
        {
          name,
          age: parseInt(age),
          height,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Alert.alert('Updated', 'Group member info saved.');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not update group member.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Edit Group Member</Text>

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

      <TouchableOpacity onPress={handleAddPhoto} style={styles.addPhotoBtn}>
        <Text style={styles.addPhotoText}>Add Member Photo</Text>
      </TouchableOpacity>

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

export default EditGroupMember;

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
  photoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  addPhotoText: {
    color: '#aaa',
    fontWeight: '600',
  },
  photoWrapper: {
    width: 90,
    height: 90,
    margin: 5,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  deleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  
  deleteBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
});