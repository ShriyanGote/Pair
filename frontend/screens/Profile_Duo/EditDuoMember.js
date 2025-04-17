import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Alert,
  TouchableOpacity, ScrollView, StyleSheet, Image,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { uploadDuoMemberPhoto, deleteDuoMemberPhoto, updateDuoMember } from '../../utils/api';

export default function EditDuoMember({ route, navigation }) {
  const { member } = route.params;

  // form state
  const [name, setName] = useState(member.name || '');
  const [age, setAge]   = useState(String(member.age || ''));
  const [gender, setGender]       = useState(member.gender || '');
  const [ethnicity, setEthnicity] = useState(member.ethnicity || '');
  const [personality, setPersonality] = useState(
    Array.isArray(member.personality)
      ? member.personality
      : (member.personality || '').split(',').filter(Boolean)
  );

  // dropdown opens
  const [gOpen, setGOpen] = useState(false);
  const [eOpen, setEOpen] = useState(false);
  const [pOpen, setPOpen] = useState(false);

  // dropdown items
  const genderItems = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Non‑binary', value: 'non-binary' },
    { label: 'Other', value: 'other' },
  ];
  const ethnicityItems = [
    { label: 'Middle Eastern', value: 'middle_eastern' },
    { label: 'Native American', value: 'native_american' },
    { label: 'Pacific Islander', value: 'pacific_islander' },
    { label: 'South Asian', value: 'south_asian' },
    { label: 'Southeast Asian', value: 'southeast_asian' },
    { label: 'East Asian', value: 'east_asian' },
    { label: 'Central Asian', value: 'central_asian' },
    { label: 'North African', value: 'north_african' },
    { label: 'Afro‑Caribbean', value: 'afro_caribbean' },
    { label: 'Latinx', value: 'latinx' },
    { label: 'Multiracial', value: 'multiracial' },
    { label: 'Prefer Not to Say', value: 'prefer_not_to_say' },
  ];
  const personalityItems = [
    { label: 'Curious', value: 'Curious' },
    { label: 'Empathetic', value: 'Empathetic' },
    { label: 'Adventurous', value: 'Adventurous' },
    { label: 'Thoughtful', value: 'Thoughtful' },
    { label: 'Creative', value: 'Creative' },
    { label: 'Analytical', value: 'Analytical' },
    { label: 'Spontaneous', value: 'Spontaneous' },
    { label: 'Organized', value: 'Organized' },
    { label: 'Playful', value: 'Playful' },
    { label: 'Calm', value: 'Calm' },
    { label: 'Driven', value: 'Driven' },
    { label: 'Loyal', value: 'Loyal' },
    { label: 'Independent', value: 'Independent' },
    { label: 'Funny', value: 'Funny' },
    { label: 'Romantic', value: 'Romantic' },
    { label: 'Open‑Minded', value: 'Open-Minded' },
    { label: 'Optimistic', value: 'Optimistic' },
    { label: 'Realistic', value: 'Realistic' },
    { label: 'Cautious', value: 'Cautious' },
    { label: 'Chill', value: 'Chill' },
  ];

  // photos
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    fetchMemberPhotos();
  }, []);

  const fetchMemberPhotos = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await getGroupMemberPhotos(member.id, token);
      setPhotos(res.data);
    } catch {
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
      const up = await uploadGroupMemberPhoto(member.id, formData, token);
      setPhotos(p => [...p, { id: up.data.photo_id, photo_url: up.data.photo_url }]);
    } catch {
      Alert.alert('Error', 'Upload failed');
    }
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await deleteGroupMemberPhoto(member.id, photoId, token);
      setPhotos(p => p.filter(x => x.id !== photoId));
    } catch {
      Alert.alert('Error', 'Delete failed');
    }
  };

  const handleSave = async () => {
    if (!name || !age || !gender) {
      Alert.alert('Missing Fields', 'Name, age & gender are required');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      await updateDuoMember(member.id, {
        name,
        age: parseInt(age),
        gender,
        ethnicity,
        personality,
      }, token);
      Alert.alert('Saved', 'Member updated');
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Update failed');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Edit Member</Text>

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
        open={gOpen}
        value={gender}
        items={genderItems}
        setOpen={setGOpen}
        setValue={setGender}
        placeholder="Select gender"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      <Text style={styles.label}>Ethnicity</Text>
      <DropDownPicker
        open={eOpen}
        value={ethnicity}
        items={ethnicityItems}
        setOpen={setEOpen}
        setValue={setEthnicity}
        placeholder="Select ethnicity"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      <Text style={styles.label}>Personality</Text>
      <DropDownPicker
        open={pOpen}
        value={personality}
        items={personalityItems}
        setOpen={setPOpen}
        setValue={setPersonality}
        multiple
        mode="BADGE"
        listMode="MODAL"
        placeholder="Select traits"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
        searchable
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
    position: 'absolute', top: 2, right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)', width: 20, height: 20,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center'
  },
  deleteBtnText: { color: '#fff', fontWeight: 'bold' },
  addPhotoBtn: { marginBottom: 16, padding: 10, backgroundColor: '#007AFF', borderRadius: 6 },
  addPhotoText: { color: '#fff', textAlign: 'center' },

  input: {
    backgroundColor: '#fff', padding: 12, borderRadius: 6,
    marginBottom: 16, borderWidth: 1, borderColor: '#ccc'
  },
  label: { marginBottom: 6, fontWeight: '600' },
  dropdown: { marginBottom: 16, borderColor: '#ccc' },
  dropdownContainer: { borderColor: '#ccc' },

  button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
});