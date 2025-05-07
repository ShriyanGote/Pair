// screens/EditGroupMember.js
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
} from '../../utils/api';

export default function EditGroupMember({ route, navigation }) {
  const { member } = route.params;

  // --- form state ---
  const [name, setName] = useState(member.name || '');
  const [age, setAge]   = useState(String(member.age ?? ''));
  const [photos, setPhotos] = useState([]);

  // single‑selects use null default
  const [gender,   setGender]   = useState(member.gender || null);
  const [ethnicity,setEthnicity]= useState(
    Array.isArray(member.ethnicity) && member.ethnicity.length > 0 
      ? member.ethnicity[0]
      : null
  );

  // multi‑select
  const [personality, setPersonality] = useState(
    Array.isArray(member.personality)
      ? member.personality
      : []
  );

  // --- items state for each picker ---
  const [gOpen, setGOpen] = useState(false);
  const [genderItems, setGenderItems] = useState([
    { label: 'Male',     value: 'male' },
    { label: 'Female',   value: 'female' },
    { label: 'Non‑binary', value: 'non-binary' },
    { label: 'Other',    value: 'other' },
  ]);

  const [eOpen, setEOpen] = useState(false);
  const [ethnicityItems, setEthnicityItems] = useState([
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
  ]);

  const [pOpen, setPOpen] = useState(false);
  const [personalityItems, setPersonalityItems] = useState([
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
  ]);

  // --- load existing photos ---
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await getGroupMemberPhotos(member.id, token);
        setPhotos(res.data);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Could not load photos');
      }
    })();
  }, []);

  // --- photo handlers ---
  const handleAddPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (result.canceled) return;

    const uri = result.assets[0].uri;
    const formData = new FormData();
    const ext  = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const file = { uri, name: `photo.${ext}`, type: `image/${ext}` };

    try {
      const token = await AsyncStorage.getItem('token');
      const res = await uploadGroupMemberPhoto(member.id, file, token);
      setPhotos((p) => [...p, res]);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        console.log('❌ Axios status :', err.response.status);
        console.log('❌ Axios data   :', err.response.data);
        Alert.alert('Upload failed',
                    err.response.data?.detail ||
                    `Server replied ${err.response.status}`);
      } else {
        console.log('❌ JS/Network err:', err.message || err);
        Alert.alert('Upload failed', err.message || 'Unknown error');
      }
    }
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await deleteGroupMemberPhoto(member.id, photoId, token);
      setPhotos((p) => p.filter((x) => x.id !== photoId));
    } catch {
      Alert.alert('Error', 'Delete failed');
    }
  };

  // --- save handler ---
  const handleSave = async () => {
    if (!name || !age || !gender || !ethnicity || personality.length === 0) {
      Alert.alert('Missing Fields', 'Name, age, gender, ethnicity & personality are required');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      await updateGroupMember(member.id, {
        name,
        age: parseInt(age, 10),
        gender,
        ethnicity: [ethnicity],        // server expects a list
        personality,
      }, token);
      Alert.alert('Saved', 'Member updated');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Update failed');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Edit Group Member</Text>

      {/* {photos.length === 0
        ? <Text>No photos yet</Text>
        : <View style={styles.photoContainer}>
            {photos.filter(Boolean).map((p, idx) => (
              <View key={p.id} style={styles.photoWrapper}>
                <Image
                  source={{ uri: p.photo_url ?? p.uri }}   // ← works for both shapes
                  style={styles.photoImage}
                />
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeletePhoto(p.id)}>
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
      }
      <TouchableOpacity style={styles.addPhotoBtn} onPress={handleAddPhoto}>
        <Text style={styles.addPhotoText}>Add Photo</Text>
      </TouchableOpacity> */}

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
        placeholder="Select gender"
        open={gOpen}
        value={gender}
        items={genderItems}
        setOpen={setGOpen}
        setValue={setGender}
        setItems={setGenderItems}
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      <Text style={styles.label}>Ethnicity</Text>
      <DropDownPicker
        listMode="MODAL"
        placeholder="Select ethnicity"
        open={eOpen}
        value={ethnicity}
        items={ethnicityItems}
        setOpen={setEOpen}
        setValue={setEthnicity}
        setItems={setEthnicityItems}
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      <Text style={styles.label}>Personality</Text>
      <DropDownPicker
        listMode="MODAL"
        placeholder="Select traits"
        open={pOpen}
        value={personality}
        items={personalityItems}
        setOpen={setPOpen}
        setValue={setPersonality}
        setItems={setPersonalityItems}
        multiple
        mode="BADGE"
        searchable
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
  container: { padding: 20, backgroundColor: '#f7f7f7', flexGrow: 1 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  photoContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  photoWrapper: { width: 80, height: 80, margin: 4, position: 'relative' },
  photoImage: { width: '100%', height: '100%', borderRadius: 8 },
  deleteBtn: { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.6)', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { color: '#fff', fontWeight: 'bold' },
  addPhotoBtn: { marginBottom: 16, padding: 10, backgroundColor: '#007AFF', borderRadius: 6 },
  addPhotoText: { color: '#fff', textAlign: 'center' },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 6, marginBottom: 16, borderWidth: 1, borderColor: '#ccc' },
  label: { marginBottom: 6, fontWeight: '600' },
  dropdown: { marginBottom: 16, borderColor: '#ccc' },
  dropdownContainer: { borderColor: '#ccc' },
  button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600' }
});