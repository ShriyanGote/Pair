// screens/Profile_Duo/EditDuoMember.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import {
  getDuoMemberPhotos,
  uploadDuoMemberPhoto,
  deleteDuoMemberPhoto,
  updateDuoMember,
} from '../../utils/api';
import {
  ethnicityOptions,
  personalityOptions,
  occupationOptions,
} from '../constants/Dropdowns';

export default function EditDuoMember({ route, navigation }) {
  const { member } = route.params;

  // basic fields
  const [name, setName] = useState(member.name || '');
  const [age, setAge]   = useState(member.age ? String(member.age) : '');

  // Gender (single)
  const [genderOpen, setGenderOpen] = useState(false);
  const [genderValue, setGenderValue] = useState(member.gender || '');
  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Non-binary', value: 'non-binary' },
    { label: 'Other', value: 'other' },
  ];

  // Ethnicity (multi)
  const [ethnicityOpen, setEthnicityOpen] = useState(false);
  const [ethnicityValue, setEthnicityValue] = useState(
    Array.isArray(member.ethnicity) ? member.ethnicity : []
  );

  // Personality (multi)
  const [personalityOpen, setPersonalityOpen] = useState(false);
  const [personalityValue, setPersonalityValue] = useState(
    Array.isArray(member.personality) ? member.personality : []
  );

  // Occupation (multi)
  const [occupationOpen, setOccupationOpen] = useState(false);
  const [occupationValue, setOccupationValue] = useState(
    Array.isArray(member.occupation) ? member.occupation : []
  );

  // Photos
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    fetchMemberPhotos();
  }, []);

  const fetchMemberPhotos = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await getDuoMemberPhotos(member.id, token);
      setPhotos(res.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Couldn’t load photos');
    }
  };

  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (result.canceled) return;

    const uri = result.assets[0].uri;
    const formData = new FormData();
    formData.append('file', { uri, name: 'photo.jpg', type: 'image/jpeg' });

    try {
      const token = await AsyncStorage.getItem('token');
      const up = await uploadDuoMemberPhoto(member.id, formData, token);
      setPhotos(p => [
        ...p,
        { id: up.data.photo_id, photo_url: up.data.photo_url },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Upload failed');
    }
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await deleteDuoMemberPhoto(member.id, photoId, token);
      setPhotos(p => p.filter(x => x.id !== photoId));
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Delete failed');
    }
  };

  const handleSave = async () => {
    if (!name || !age || !genderValue) {
      Alert.alert('Missing Fields', 'Name, age & gender are required');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      await updateDuoMember(
        member.id,
        {
          name,
          age: parseInt(age, 10),
          gender: genderValue,
          ethnicity: ethnicityValue,
          personality: personalityValue,
          occupation: occupationValue,
        },
        token
      );
      Alert.alert('Saved', 'Member updated');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Update failed');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Edit Duo Member</Text>

      <View style={styles.photoContainer}>
        {photos.map(p => (
          <View key={p.id} style={styles.photoWrapper}>
            <Image source={{ uri: p.photo_url }} style={styles.photoImage} />
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDeletePhoto(p.id)}
            >
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.addPhotoBtn} onPress={handleAddPhoto}>
        <Text style={styles.addPhotoText}>Add Photo</Text>
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

      <Text style={styles.label}>Gender</Text>
      <DropDownPicker
        listMode="MODAL"
        searchable
        placeholder="Select gender"
        open={genderOpen}
        value={genderValue}
        items={genderOptions}
        setOpen={setGenderOpen}
        setValue={setGenderValue}
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      <Text style={styles.label}>Ethnicity</Text>
      <DropDownPicker
        listMode="MODAL"
        searchable
        multiple
        mode="BADGE"
        placeholder="Select ethnicity"
        open={ethnicityOpen}
        value={ethnicityValue}
        items={ethnicityOptions}
        setOpen={setEthnicityOpen}
        setValue={setEthnicityValue}
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      <Text style={styles.label}>Personality</Text>
      <DropDownPicker
        listMode="MODAL"
        searchable
        multiple
        mode="BADGE"
        placeholder="Select traits"
        open={personalityOpen}
        value={personalityValue}
        items={personalityOptions}
        setOpen={setPersonalityOpen}
        setValue={setPersonalityValue}
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      <Text style={styles.label}>Occupation</Text>
      <DropDownPicker
        listMode="MODAL"
        searchable
        multiple
        mode="BADGE"
        placeholder="Select occupation"
        open={occupationOpen}
        value={occupationValue}
        items={occupationOptions}
        setOpen={setOccupationOpen}
        setValue={setOccupationValue}
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Member</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f7f7f7' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },

  photoContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  photoWrapper: { width: 80, height: 80, margin: 4, position: 'relative' },
  photoImage: { width: '100%', height: '100%', borderRadius: 8 },
  deleteBtn: {
    position: 'absolute',
    top: 2, right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 20, height: 20,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center'
  },
  deleteBtnText: { color: '#fff', fontWeight: 'bold' },
  addPhotoBtn: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 6
  },
  addPhotoText: { color: '#fff', textAlign: 'center' },

  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc'
  },
  label: { marginBottom: 6, fontWeight: '600' },
  dropdown: { marginBottom: 16, borderColor: '#ccc' },
  dropdownContainer: { borderColor: '#ccc' },

  button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});