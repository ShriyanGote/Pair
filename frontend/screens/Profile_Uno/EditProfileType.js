import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@env';

const EditProfileType = ({ route, navigation }) => {
  const { currentType } = route.params;

  const [selected, setSelected] = useState(currentType);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (selected === currentType) {
      return navigation.goBack();
    }

    Alert.alert(
      'Confirm Change',
      `Switching to '${selected}' will remove any existing members/account information. Are you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, change it',
          onPress: async () => {
            setSaving(true);
            try {
              const token = await AsyncStorage.getItem('token');
              const res = await axios.put(
                `${API_BASE_URL}/profile-type`,
                { new_type: selected },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert('Success', 'Profile type updated.');
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: 'MainTabs',
                    params: { screen: 'Profile' }, 
                  },
                ],
              });
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to update profile type.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Change Profile Type</Text>

      {['uno', 'duo', 'group'].map((type) => (
        <TouchableOpacity
          key={type}
          style={[
            styles.option,
            selected === type && styles.selectedOption,
          ]}
          onPress={() => setSelected(type)}
        >
          <Text
            style={[
              styles.optionText,
              selected === type && styles.selectedText,
            ]}
          >
            {type.toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default EditProfileType;

const styles = StyleSheet.create({
  container: {
    padding: 30,
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
  },
  option: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  selectedOption: {
    backgroundColor: '#007AFF',
  },
  optionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  selectedText: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 30,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
  },
  saveText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
});