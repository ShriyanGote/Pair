import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@env';

const EditGroupMember = ({ route, navigation }) => {
  const { member } = route.params;

  const [name, setName] = useState(member.name || '');
  const [age, setAge] = useState(String(member.age || ''));
  const [height, setHeight] = useState(member.height || null);
  const [heightOpen, setHeightOpen] = useState(false);
  const [heightItems, setHeightItems] = useState([]);

  useEffect(() => {
    const options = [];
    for (let feet = 4; feet <= 7; feet++) {
      for (let inches = 0; inches <= 11; inches++) {
        const total = (feet + inches / 12).toFixed(2);
        if (total >= 4.5 && total <= 7.0) {
          options.push({ label: `${feet}'${inches}"`, value: parseFloat(total) });
        }
      }
    }
    setHeightItems(options);
  }, []);

  const handleSave = async () => {
    if (!name || !age || !height) {
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
          height,
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
});