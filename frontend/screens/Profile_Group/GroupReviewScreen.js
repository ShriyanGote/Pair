import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@env';

const GroupReviewScreen = ({ route }) => {
  const navigation = useNavigation();
  const { sharedData, members } = route.params;

  const handleConfirm = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      await axios.post(
        `${API_BASE_URL}/group-profile`,
        {
          location: sharedData.location,
          interests: sharedData.interests,
          looking_for: sharedData.lookingFor,
          members,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      Alert.alert('Success', 'Group profile setup complete!');
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'MainTabs',
            params: { screen: 'Profile' }, 
          },
        ],
      });
    } catch (error) {
      console.error('Failed to create group profile:', error);
      Alert.alert('Error', 'There was a problem submitting your group.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Review Your Group Profile</Text>

      <Text style={styles.sectionTitle}>Shared Info</Text>
      <View style={styles.card}>
        <Text style={styles.label}>📍 Location:</Text>
        <Text style={styles.value}>{sharedData.location}</Text>

        <Text style={styles.label}>🎯 Looking For:</Text>
        <Text style={styles.value}>{sharedData.lookingFor}</Text>

        <Text style={styles.label}>🎨 Interests:</Text>
        <Text style={styles.value}>{sharedData.interests}</Text>
      </View>

      {members.map((member, index) => (
        <View key={index}>
          <Text style={styles.sectionTitle}>Member {index + 1}</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{member.name}</Text>

            <Text style={styles.label}>Age:</Text>
            <Text style={styles.value}>{member.age}</Text>

            <Text style={styles.label}>Height:</Text>
            <Text style={styles.value}>{member.height}'</Text>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.button} onPress={handleConfirm}>
        <Text style={styles.buttonText}>Confirm & Finish</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default GroupReviewScreen;

const styles = StyleSheet.create({
  container: {
    padding: 30,
    backgroundColor: '#f9f9f9',
    flexGrow: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 25,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
  },
  label: {
    fontWeight: '600',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
});