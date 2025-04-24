// screens/MatchesScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMatches, deleteMatch, getCurrentUser } from '../../utils/api'; 
import { useNavigation } from '@react-navigation/native';

export default function MatchesScreen() {
  const [matches, setMatches] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigation = useNavigation();

  const loadMatches = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const matchRes = await getMatches(token);
      setMatches(matchRes.data);
      setFiltered(matchRes.data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return setLoading(false);

      try {
        const userRes = await getCurrentUser(token);
        setCurrentUserId(userRes.data.id);
      } catch {}
      await loadMatches();
    })();
  }, []);

  const handleUnmatch = (userId, name) => {
    Alert.alert(
      `Unconnect ${name}?`,
      null,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unconnect",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await deleteMatch(userId, token);
              setMatches(ms => ms.filter(m => m.id !== userId));
              setFiltered(ms => ms.filter(m => m.id !== userId));
            } catch {
              Alert.alert("Error", "Failed to unmatch.");
            }
          },
        },
      ]
    );
  };

  const onSearch = text => {
    setSearch(text);
    const low = text.toLowerCase();
    setFiltered(
      matches.filter(m =>
        m.name.toLowerCase().includes(low)
      )
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{ uri: item.profile_photo || 'https://placekitten.com/200/200' }}
        style={styles.avatar}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.sub}>{`Sent ${item.last_swipe_time_ago}`}</Text>
      </View>
      <TouchableOpacity
        style={styles.chatBtn}
        onPress={() =>
          navigation.navigate('ChatScreen', {
            userId: currentUserId,
            matchId: item.id,
            matchName: item.name,
          })
        }
      >
        <Text style={styles.chatText}>Chat</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.unmatchBtn}
        onPress={() => handleUnmatch(item.id, item.name)}
      >
        <Text style={styles.unmatchText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search"
        value={search}
        onChangeText={onSearch}
        style={styles.searchBar}
        placeholderTextColor="#999"
      />

      {loading ? (
        <Text style={styles.empty}>Loading connections...</Text>
      ) : filtered.length === 0 ? (
        <Text style={styles.empty}>No connections yet 😢</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchBar: { margin: 12, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0', fontSize: 16 },
  empty: { textAlign: 'center', marginTop: 40, color: '#666', fontSize: 16 },
  card: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomColor: '#eee', borderBottomWidth: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 17, fontWeight: '600', color: '#333' },
  sub: { fontSize: 13, color: '#888', marginTop: 2 },
  chatBtn: { backgroundColor: '#f0f0f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 12 },
  chatText: { fontSize: 14, color: '#333' },
  unmatchBtn: { padding: 6 },
  unmatchText: { fontSize: 18, color: 'red' }
});