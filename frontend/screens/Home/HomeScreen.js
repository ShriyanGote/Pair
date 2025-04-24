import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

const HomeScreen = ({ navigation }) => {
  const route = useRoute();

  useEffect(() => {
    if (route.params?.registered) {
      Alert.alert('🎉 Success', 'User successfully registered!');
    }
  }, [route.params?.registered]);

  return (
    <View style={styles.container}>
      {/* Pair Header */}
      <Text style={styles.title}>Pair</Text>
      <Text style={styles.subtitle}>Where connections start together.</Text>

      {/* Icon */}
      <Ionicons name="people-circle-outline" size={120} color="#B76EFF" style={styles.icon} />

      {/* Buttons */}
      <TouchableOpacity
        style={styles.buttonPrimary}
        onPress={() => navigation.navigate('RegistrationFlow')}
      >
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={() => navigation.navigate('EmailLogin')}
      >
        <Text style={styles.buttonText}>Sign in with Email</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.link}
        onPress={() => navigation.navigate('MoreInfo')}
      >
        <Text style={styles.linkText}>Learn more about Pair</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#B76EFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 40,
    textAlign: 'center',
  },
  icon: {
    marginBottom: 50,
  },
  buttonPrimary: {
    backgroundColor: '#B76EFF',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
  },
  buttonSecondary: {
    backgroundColor: '#8E44AD',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 25,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  link: {
    marginTop: 10,
  },
  linkText: {
    color: '#7D3C98',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});