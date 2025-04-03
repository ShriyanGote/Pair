import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ProfileTypeScreen = ({ navigation }) => {
  const handleSelect = (type) => {
    navigation.navigate('Register', { profileType: type });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>How are you using the app?</Text>

      <TouchableOpacity style={styles.card} onPress={() => handleSelect('uno')}>
        <Text style={styles.emoji}>🧍</Text>
        <Text style={styles.text}>Uno (Solo)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => handleSelect('duo')}>
        <Text style={styles.emoji}>🧑‍🤝‍🧑</Text>
        <Text style={styles.text}>Duo (Couple / Friends)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => handleSelect('group')}>
        <Text style={styles.emoji}>👯</Text>
        <Text style={styles.text}>Group (3+ People)</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileTypeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 30,
  },
  card: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
    marginBottom: 20,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
});
