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

const DuoReviewScreen = ({ route }) => {
  const navigation = useNavigation();
  const { sharedData, member1, member2 } = route.params;

  const handleConfirm = () => {
    // TODO: send `sharedData`, `member1`, and `member2` to backend here
    Alert.alert('Success', 'Duo profile setup complete!');
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'MainTabs',
          params: { screen: 'Profile' }, 
        },
      ],
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Review Your Duo Profile</Text>

      <Text style={styles.sectionTitle}>Shared Info</Text>
      <View style={styles.card}>
        <Text style={styles.label}>📍 Location:</Text>
        <Text style={styles.value}>{sharedData.location}</Text>

        <Text style={styles.label}>🎯 Looking For:</Text>
        <Text style={styles.value}>{sharedData.lookingFor}</Text>

        <Text style={styles.label}>🎨 Interests:</Text>
        <Text style={styles.value}>{sharedData.interests}</Text>
      </View>

      <Text style={styles.sectionTitle}>Member 1</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{member1.name}</Text>

        <Text style={styles.label}>Age:</Text>
        <Text style={styles.value}>{member1.age}</Text>

        <Text style={styles.label}>Height:</Text>
        <Text style={styles.value}>{member1.height}'</Text>
      </View>

      <Text style={styles.sectionTitle}>Member 2</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{member2.name}</Text>

        <Text style={styles.label}>Age:</Text>
        <Text style={styles.value}>{member2.age}</Text>

        <Text style={styles.label}>Height:</Text>
        <Text style={styles.value}>{member2.height}'</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleConfirm}>
        <Text style={styles.buttonText}>Confirm & Finish</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default DuoReviewScreen;

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
