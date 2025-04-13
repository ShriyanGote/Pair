// screens/HomeScreen.js

import React, {useEffect} from 'react';
import { View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import { useRoute } from '@react-navigation/native';

const HomeScreen = ({ navigation }) => {
  const route = useRoute();

  useEffect(() => {
    if (route.params?.registered) {
      Alert.alert('🎉 Success', 'User successfully registered!');
    }
  }, [route.params?.registered]);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Pairs</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('RegistrationFlow')}>
        <Text style={styles.buttonText}>Register with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('EmailLogin')}>
        <Text style={styles.buttonText}>Email Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('MoreInfo')}>
        <Text style={styles.buttonText}>More Info</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#f2f2f2',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});