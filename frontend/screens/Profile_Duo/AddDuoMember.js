// screens/AddDuoMember.js

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

export default function AddDuoMember({ route, navigation }) {
  const { step, sharedData, member1 } = route.params;

  // form state
  const [name, setName]         = useState('');
  const [age, setAge]           = useState('');
  const [gender, setGender]     = useState('');
  const [ethnicity, setEthnicity]       = useState('');
  const [personality, setPersonality]   = useState([]);

  // dropdown open states
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

  const handleNext = async () => {
    if (!name || !age || !gender || !ethnicity || personality.length === 0) {
      Alert.alert('Missing info', 'Please fill out all fields.');
      return;
    }

    const thisMember = {
      name,
      age: parseInt(age, 10),
      gender,
      ethnicity,
      personality,
    };

    if (step === 1) {
      navigation.replace('AddDuoMember', {
        step: 2,
        sharedData,
        member1: thisMember,
      });
    } else {
      // finish & submit both members
      const token = await AsyncStorage.getItem('token');
      try {
        await axios.post(
          `${API_BASE_URL}/duo-profile`,
          {
            location:   sharedData.location,
            interests:  sharedData.interests,
            looking_for: sharedData.looking_for,
            members:    [member1, thisMember],
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert('Success', 'Duo profile is live!');
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs', params: { screen: 'Profile' } }],
        });
      } catch (err) {
        console.error(err.response || err);
        Alert.alert('Error', 'Failed to create duo profile.');
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Add Duo Member {step}</Text>

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
          {step === 1 ? 'Next: Add Member 2' : 'Finish & Submit'}
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