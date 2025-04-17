import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@env';

export default function AddGroupMember({ route, navigation }) {
  const { step = 1, sharedData, members = [] } = route.params || {};

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [personality, setPersonality] = useState([]);
  // const [height, setHeight] = useState(null);

  const [gOpen, setGOpen] = useState(false);
  const [eOpen, setEOpen] = useState(false);
  const [pOpen, setPOpen] = useState(false);
  const [hOpen, setHOpen] = useState(false);

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

  // const heightItems = [];
  // for (let feet = 4; feet <= 7; feet++) {
  //   for (let inches = 0; inches <= 11; inches++) {
  //     const total = (feet + inches / 12).toFixed(2);
  //     if (total >= 4.5 && total <= 7.0) {
  //       heightItems.push({ label: `${feet}'${inches}\"`, value: parseFloat(total) });
  //     }
  //   }
  // }

  const handleNext = async () => {
    if (!name || !age || !gender || !ethnicity || personality.length === 0 ) {
      Alert.alert('Missing info', 'Please fill out all fields.');
      return;
    }

    const newMember = {
      name,
      age: parseInt(age, 10),
      gender,
      ethnicity,
      personality,
    };

    const updatedMembers = [...members, newMember];
    const totalCount = updatedMembers.length;

    if (totalCount < 3) {
      navigation.navigate('AddGroupMember', {
        step: step + 1,
        sharedData,
        members: updatedMembers,
      });
    } else if (totalCount >= 3 && totalCount < 6) {
      Alert.alert('Add another member?', 'Would you like to add another member or finish?', [
        {
          text: 'Add More',
          onPress: () =>
            navigation.navigate('AddGroupMember', {
              step: step + 1,
              sharedData,
              members: updatedMembers,
            }),
        },
        {
          text: 'Finish',
          onPress: () => submitGroupProfile(updatedMembers),
        },
      ]);
    } else {
      submitGroupProfile(updatedMembers);
    }
  };

  const submitGroupProfile = async (finalMembers) => {
    const token = await AsyncStorage.getItem('token');
    try {
      await axios.post(
        `${API_BASE_URL}/group-profile`,
        {
          location: sharedData.location,
          interests: sharedData.interests,
          looking_for: sharedData.lookingFor,
          members: finalMembers.map((m) => ({
            ...m,
            personality: Array.isArray(m.personality)
              ? m.personality
              : m.personality.split(',').map((p) => p.trim()),
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Group profile created!');
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create group profile.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Add Group Member {step}</Text>

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
        multiple={true}
        mode="BADGE"
        listMode="MODAL"
        placeholder="Select traits"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
        searchable={true}
      />

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>
          {members.length + 1 < 3 ? 'Next: Add Member' : 'Add More or Finish'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f7f7f7', flexGrow: 1 },
  header:    { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  input:     { backgroundColor: '#fff', padding: 12, borderRadius: 6, marginBottom: 16, borderWidth: 1, borderColor: '#ccc' },
  label:     { marginBottom: 6, fontWeight: '600' },
  dropdown:  { marginBottom: 16, borderRadius: 6, borderColor: '#ccc' },
  dropdownContainer: { borderColor: '#ccc', borderRadius: 6 },
  button:    { backgroundColor: '#007AFF', padding: 14, borderRadius: 6 },
  buttonText:{ color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 },
});
