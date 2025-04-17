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
  const [photos, setPhotos] = useState([]);
  const [gender, setGender] = useState(member.gender || '');
  const [ethnicity, setEthnicity] = useState(member.ethnicity || '');
  const [personality, setPersonality] = useState(
    Array.isArray(member.personality) ? member.personality : (member.personality?.split(',') || [])
  );
  
  const [gOpen, setGOpen] = useState(false);
  const [eOpen, setEOpen] = useState(false);
  const [pOpen, setPOpen] = useState(false);
  
  const genderItems = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Non-binary', value: 'non-binary' },
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
    { label: 'Afro-Caribbean', value: 'afro_caribbean' },
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
    { label: 'Open-Minded', value: 'Open-Minded' },
    { label: 'Optimistic', value: 'Optimistic' },
    { label: 'Realistic', value: 'Realistic' },
    { label: 'Cautious', value: 'Cautious' },
    { label: 'Chill', value: 'Chill' },
  ];


  useEffect(() => {
    fetchMemberPhotos();
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
    if (!name || !age || !gender || !ethnicity || personality.length === 0) {
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
          gender,
          ethnicity,
          personality,
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

      <Text style={styles.label}>Personality Traits</Text>
      <DropDownPicker
        open={pOpen}
        value={personality}
        items={personalityItems}
        setOpen={setPOpen}
        setValue={setPersonality}
        multiple={true}
        mode="BADGE"
        listMode="MODAL"
        placeholder="Select traits"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
        searchable={true}
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