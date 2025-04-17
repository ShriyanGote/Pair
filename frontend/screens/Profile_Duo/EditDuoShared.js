// EditDuoShared.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import TextInput from 'react-native/Libraries/Components/TextInput/TextInput'; // or your own input
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@env';

export default function EditDuoShared({ route, navigation }) {
  const { user } = route.params;

  const [location, setLocation] = useState(user.location || '');
  const [lookingFor, setLookingFor] = useState(user.looking_for || '');
  const [interests, setInterests] = useState(
    Array.isArray(user.interests) ? user.interests : (user.interests || '').split(',').filter(Boolean)
  );

  // For DropDownPicker
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: 'Movies & TV', value: 'movies_tv' },
    { label: 'Gaming', value: 'gaming' },
    { label: 'Photography', value: 'photography' },
    { label: 'Fashion', value: 'fashion' },
    { label: 'Writing', value: 'writing' },
    { label: 'Nature', value: 'nature' },
    { label: 'Animals', value: 'animals' },
    { label: 'Volunteering', value: 'volunteering' },
    { label: 'History', value: 'history' },
    { label: 'Science', value: 'science' },
    { label: 'Cars & Motorcycles', value: 'cars_motorcycles' },
    { label: 'Podcasts', value: 'podcasts' },
    { label: 'Crafts & DIY', value: 'crafts_diy' },
    { label: 'Spirituality', value: 'spirituality' },
    { label: 'Board Games', value: 'board_games' },
    { label: 'Languages', value: 'languages' },
    { label: 'Politics', value: 'politics' },
    { label: 'Comedy', value: 'comedy' },
    { label: 'Entrepreneurship', value: 'entrepreneurship' },
    { label: 'Collecting', value: 'collecting' },
  ]);

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      // send the array of interests
      await axios.put(
        `${API_BASE_URL}/me`,
        { location, looking_for: lookingFor, interests },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Duo profile updated!');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Edit Duo Profile</Text>

        {/* Location TextInput */}
        <TextInput
          style={styles.input}
          placeholder="Location"
          value={location}
          onChangeText={setLocation}
        />

        {/* Interests Multi‑Select */}
        <Text style={styles.label}>Select Interests</Text>
        <DropDownPicker
          open={open}
          value={interests}
          items={items}
          setOpen={setOpen}
          setValue={setInterests}
          setItems={setItems}
          multiple={true}
          mode="BADGE"
          listMode="MODAL"
          placeholder="Choose interests..."
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          searchable={true}
        />

        {/* Looking For TextInput */}
        <TextInput
          style={styles.input}
          placeholder="Looking For"
          value={lookingFor}
          onChangeText={setLookingFor}
        />

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    backgroundColor: '#f9f9f9',
    flexGrow: 1,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  dropdown: {
    marginBottom: 20,
    borderColor: '#ccc',
  },
  dropdownContainer: {
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
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
});