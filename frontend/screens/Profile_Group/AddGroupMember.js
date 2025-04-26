// screens/Profile_Group/AddGroupMember.js

import React, { useState } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_BASE_URL } from '@env';
import {
  ethnicityOptions,
  personalityOptions,
  occupationOptions,
} from '../constants/Dropdowns';

export default function AddGroupMember() {
  const navigation = useNavigation();
  const route = useRoute();
  const { step = 1, sharedData, members = [] } = route.params || {};

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [personality, setPersonality] = useState([]);
  const [occupation, setOccupation] = useState([]);

  const [gOpen, setGOpen] = useState(false);
  const [eOpen, setEOpen] = useState(false);
  const [pOpen, setPOpen] = useState(false);
  const [oOpen, setOOpen] = useState(false);

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Non‑binary', value: 'non-binary' },
    { label: 'Other', value: 'other' },
  ];

  const handleNext = () => {
    if (
      !name ||
      !age ||
      !gender ||
      !ethnicity ||
      personality.length === 0 ||
      occupation.length === 0
    ) {
      Alert.alert('Missing info', 'Please fill out all fields.');
      return;
    }

    const newMember = {
      name,
      age: parseInt(age, 10),
      gender,
      ethnicity,
      personality,
      occupation,
    };

    const updated = [...members, newMember];
    if (updated.length < 3) {
      navigation.navigate('AddGroupMember', {
        step: step + 1,
        sharedData,
        members: updated,
      });
    } else {
      Alert.alert(
        'Almost there!',
        'Add another member or finish your group?',
        [
          {
            text: 'Add More',
            onPress: () =>
              navigation.navigate('AddGroupMember', {
                step: step + 1,
                sharedData,
                members: updated,
              }),
          },
          {
            text: 'Finish',
            onPress: () => submitGroupProfile(updated),
          },
        ]
      );
    }
  };

  const submitGroupProfile = async (finalMembers) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/group-profile`,
        {
          location:    sharedData.location,
          interests:   sharedData.interests,
          looking_for: sharedData.looking_for,
          members: finalMembers.map(m => ({
            ...m,
            personality: Array.isArray(m.personality)
              ? m.personality
              : m.personality.split(',').map(p => p.trim()),
            occupation: m.occupation, // send as array
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Your group profile is live!');
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create group profile.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Add Group Member #{step}</Text>

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
        items={genderOptions}
        setOpen={setGOpen}
        setValue={setGender}
        placeholder="Select gender"
        listMode="MODAL"
        searchable
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      <Text style={styles.label}>Ethnicity</Text>
      <DropDownPicker
        open={eOpen}
        value={ethnicity}
        items={ethnicityOptions}
        setOpen={setEOpen}
        setValue={setEthnicity}
        placeholder="Select ethnicity"
        listMode="MODAL"
        searchable
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      <Text style={styles.label}>Personality</Text>
      <DropDownPicker
        open={pOpen}
        value={personality}
        items={personalityOptions}
        setOpen={setPOpen}
        setValue={setPersonality}
        multiple
        mode="BADGE"
        listMode="MODAL"
        searchable
        placeholder="Select traits"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      <Text style={styles.label}>Occupation</Text>
      <DropDownPicker
        open={oOpen}
        value={occupation}
        items={occupationOptions}
        setOpen={setOOpen}
        setValue={setOccupation}
        multiple
        mode="BADGE"
        listMode="MODAL"
        searchable
        placeholder="Select occupation"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>
          {members.length + 1 < 3 ? 'Next Member' : 'Add / Finish'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f7f7f7', flexGrow: 1 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 6, marginBottom: 16, borderWidth: 1, borderColor: '#ccc' },
  label: { marginBottom: 6, fontWeight: '600' },
  dropdown: { marginBottom: 16, borderRadius: 6, borderColor: '#ccc' },
  dropdownContainer: { borderRadius: 6, borderColor: '#ccc' },
  button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 6, marginTop: 8 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 }
});