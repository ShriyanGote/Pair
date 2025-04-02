// screens/MatchesScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMatches } from '../utils/api';

const MatchesScreen = () => {
  const [matches, setMatches] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const res = await getMatches(token);
        setMatches(res.data);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to load matches');
      } finally {
        setLoading(false);
      }
    };
  
    loadMatches();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.profile_photo || 'https://placekitten.com/200/200' }}
        style={styles.avatar}
      />
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text>{item.age} • {item.location}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
        {loading ? (
            <Text style={styles.empty}>Loading matches...</Text>
            ) : matches?.length === 0 ? (
            <Text style={styles.empty}>No matches yet 😢</Text>
            ) : (
            <FlatList
                data={matches}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
            />
        )}
    </View>
  );  
};

export default MatchesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  empty: { textAlign: 'center', marginTop: 30, color: 'gray' },
  card: {
    flexDirection: 'row',
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  name: { fontSize: 18, fontWeight: '600' },
});
