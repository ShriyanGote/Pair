import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { GOOGLE_API_KEY } from '@env';
// import { DuoStackProps } from '../navigation/DuoStack'; // Only needed if using TS

const DuoProfileSetup = () => {
  const navigation = useNavigation();
  const [location, setLocation] = useState('');
  const [interests, setInterests] = useState('');
  const [lookingFor, setLookingFor] = useState('');

  const handleNext = () => {
    if (!location || !interests || !lookingFor) {
      Alert.alert('Missing fields', 'Please fill out all the shared information.');
      return;
    }

    navigation.navigate('AddDuoMember', {
      step: 1,
      sharedData: {
        location,
        interests,
        lookingFor,
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Set up your Duo Profile</Text>

      <GooglePlacesAutocomplete
        placeholder="Search Location"
        minLength={2}
        fetchDetails={true}
        onPress={(data) => setLocation(data.description)}
        query={{
          key: GOOGLE_API_KEY,
          language: 'en',
        }}
        styles={{ textInput: styles.input }}
      />

      <TextInput
        style={styles.input}
        placeholder="Interests"
        value={interests}
        onChangeText={setInterests}
      />

      <TextInput
        style={styles.input}
        placeholder="What are you looking for?"
        value={lookingFor}
        onChangeText={setLookingFor}
      />

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Next: Add Member 1</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default DuoProfileSetup;

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
});
