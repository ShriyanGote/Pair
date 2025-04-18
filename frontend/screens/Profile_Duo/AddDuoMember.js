// screens/Profile_Duo/AddDuoMember.js

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Button,
  Alert,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { addDuoMember } from '../../utils/api';
import {
  ethnicityOptions,
  personalityOptions,
  occupationOptions,
} from '../constants/Dropdowns';

export default function AddDuoMember() {
  const navigation = useNavigation();
  const { step, sharedData, member1 } = useRoute().params;

  // text inputs
  const [name, setName] = useState(member1.name || '');
  const [age, setAge] = useState(member1.age ? String(member1.age) : '');

  // gender dropdown
  const [genderOpen, setGenderOpen] = useState(false);
  const [genderValue, setGenderValue] = useState(member1.gender || null);
  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Non-binary', value: 'non-binary' },
    { label: 'Other', value: 'other' },
  ];

  // multi‑select dropdowns
  const [ethnicityOpen, setEthnicityOpen] = useState(false);
  const [ethnicityValue, setEthnicityValue] = useState(member1.ethnicity || []);
  const [personalityOpen, setPersonalityOpen] = useState(false);
  const [personalityValue, setPersonalityValue] = useState(member1.personality || []);
  const [occupationOpen, setOccupationOpen] = useState(false);
  const [occupationValue, setOccupationValue] = useState(member1.occupation || []);

  const handleDone = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const payload = {
        name,
        age: parseInt(age, 10),
        gender: genderValue,
        ethnicity: ethnicityValue,
        personality: personalityValue,
        occupation: occupationValue,
      };

      await addDuoMember(payload, token);
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to add member');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Add Duo Member — Step #{step}</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />

      <DropDownPicker
        listMode="MODAL"
        searchable
        placeholder="Select Gender"
        open={genderOpen}
        value={genderValue}
        items={genderOptions}
        setOpen={setGenderOpen}
        setValue={setGenderValue}
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      <DropDownPicker
        listMode="MODAL"
        searchable
        placeholder="Select Ethnicity"
        multiple
        mode="BADGE"
        open={ethnicityOpen}
        value={ethnicityValue}
        items={ethnicityOptions}
        setOpen={setEthnicityOpen}
        setValue={setEthnicityValue}
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      <DropDownPicker
        listMode="MODAL"
        searchable
        placeholder="Select Personality"
        multiple
        mode="BADGE"
        open={personalityOpen}
        value={personalityValue}
        items={personalityOptions}
        setOpen={setPersonalityOpen}
        setValue={setPersonalityValue}
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      <DropDownPicker
        listMode="MODAL"
        searchable
        placeholder="Select Occupation"
        multiple
        mode="BADGE"
        open={occupationOpen}
        value={occupationValue}
        items={occupationOptions}
        setOpen={setOccupationOpen}
        setValue={setOccupationValue}
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      <Button title="Done" onPress={handleDone} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  header: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  dropdown: {
    borderColor: '#ddd',
    borderRadius: 6,
    marginBottom: 16,
  },
  dropdownContainer: {
    borderColor: '#ddd',
    borderRadius: 6,
  },
});