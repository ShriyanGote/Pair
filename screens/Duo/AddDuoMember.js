import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@env';

const AddDuoMember = ({ route }) => {
  const { step, sharedData, member1 } = route.params;
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [heightOpen, setHeightOpen] = useState(false);
  const [heightItems, setHeightItems] = useState([]);
  const [height, setHeight] = useState(null);

  useEffect(() => {
    const options = [];
    for (let feet = 4; feet <= 7; feet++) {
      for (let inches = 0; inches <= 11; inches++) {
        const total = (feet + inches / 12).toFixed(2);
        if (total >= 4.5 && total <= 7.0) {
          options.push({ label: `${feet}'${inches}\"`, value: parseFloat(total) });
        }
      }
    }
    setHeightItems(options);
  }, []);

  const handleNext = async () => {
    if (!name || !age || !height) {
      Alert.alert('Missing info', 'Please fill out all member fields.');
      return;
    }

    const member = {
      name,
      age: parseInt(age),
      height,
    };

    if (step === 1) {
      navigation.navigate('AddDuoMember', {
        step: 2,
        sharedData,
        member1: member,
      });
    } else {
      // Submit duo profile to backend
      const token = await AsyncStorage.getItem('token');
      try {
        await axios.post(
          `${API_BASE_URL}/duo-profile`,
          {
            location: sharedData.location,
            interests: sharedData.interests,
            looking_for: sharedData.lookingFor,
            members: [member1, member],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        Alert.alert('Success', 'Duo profile created!');
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      } catch (error) {
        console.error(error);
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
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />

      <DropDownPicker
        open={heightOpen}
        setOpen={setHeightOpen}
        items={heightItems}
        setItems={setHeightItems}
        value={height}
        setValue={setHeight}
        placeholder="Select Height"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>
          {step === 1 ? 'Next: Add Member' : 'Finish and Submit'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddDuoMember;

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
});
