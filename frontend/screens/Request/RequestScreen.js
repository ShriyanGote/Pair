// screens/RequestScreen.js
import React, { useEffect, useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getIncomingRequests, sendSwipe, getMatches } from '../../utils/api';

export default function RequestScreen({ navigation }) {
  /* ────────────── state ────────────── */
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);

  /* ────────────── header ───────────── */
  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Requests' });
  }, [navigation]);

  /* ────────────── load requests ─────── */
  const loadRequests = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res   = await getIncomingRequests(token);   // <‑‑ you add this route in utils/api
      setRequests(res.data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not load requests.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadRequests();
  }, []);

  /* ────────────── accept / pass ─────── */
  const respond = async (userId, dir) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await sendSwipe(userId, dir, token);

      // optimistic UI
      setRequests((prev) => prev.filter((u) => u.id !== userId));

      // check if it’s now a match
      if (dir === 'right') {
        const m = await getMatches(token);
        if (m.data.find((x) => x.id === userId)) {
          Alert.alert('🎉 It’s a match!', 'Say hi!');
      
          navigation.navigate('Connections', { refresh: true });
        }
      }
    } catch {
      Alert.alert('Error', 'Action failed.');
    }
  };

  /* ────────────── render card ───────── */
  const Card = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{
          uri: item.profile_photo || 'https://placekitten.com/300/300',
        }}
        style={styles.photo}
      />
      <Text style={styles.name}>
        {item.name}{item.age ? `, ${item.age}` : ''}
      </Text>
      <Text style={styles.meta}>📍 {item.location}</Text>
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.btn, styles.pass]}
          onPress={() => respond(item.id, 'left')}
        >
          <Text style={styles.passText}>Pass</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.accept]}
          onPress={() => respond(item.id, 'right')}
        >
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /* ────────────── body ──────────────── */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading…</Text>
      </View>
    );
  }

  if (!requests.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Nobody has liked you yet 😢</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={requests}
      keyExtractor={(u) => String(u.id)}
      renderItem={Card}
      refreshing={loading}
      onRefresh={loadRequests}
    />
  );
}

/* ────────────── styles ─────────────── */
const styles = StyleSheet.create({
  list:       { padding: 16 },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty:      { fontSize: 18, color: 'gray' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    alignItems: 'center',
  },
  photo:      { width: 250, height: 250, borderRadius: 12, marginBottom: 12 },
  name:       { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  meta:       { fontSize: 14, color: 'gray', marginBottom: 8 },
  btnRow:     { flexDirection: 'row', gap: 12 },
  btn:        {
                flex: 1,
                paddingVertical: 10,
                borderRadius: 6,
                alignItems: 'center',
              },
  pass:       { backgroundColor: '#f2f2f2' },
  passText:   { color: '#444' },
  accept:     { backgroundColor: '#B76EFF' },
  acceptText: { color: '#fff' },
});