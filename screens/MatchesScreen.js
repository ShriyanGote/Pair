import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMatches, deleteMatch } from '../utils/api';

const MatchesScreen = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadMatches();
  }, []);


  
  const handleUnmatch = (userId, name) => {
    Alert.alert(
      `Unmatch ${name}?`,
      "Are you sure you want to remove this match?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unmatch",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await deleteMatch(userId, token);
              setMatches((prev) => prev.filter((m) => m.id !== userId));
            } catch (err) {
              console.error('Unmatch error', err);
              Alert.alert("Error", "Failed to unmatch.");
            }
          },
        },
      ]
    );
  };
  

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.profile_photo || 'https://placekitten.com/200/200' }}
        style={styles.avatar}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.name}</Text>
        <Text>{item.age} • {item.location}</Text>
      </View>
      <TouchableOpacity onPress={() => handleUnmatch(item.id, item.name)}>
        <Text style={styles.unmatchText}>Unmatch</Text>
      </TouchableOpacity>
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
  unmatchText: {
    color: 'red',
    fontSize: 14,
    marginLeft: 10,
  },  
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  name: { fontSize: 18, fontWeight: '600' },
  unmatch: { color: 'red', marginLeft: 10 },
});
