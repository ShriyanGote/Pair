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
import {
  getMatches,
  deleteMatch,
  getCurrentUser,
} from '../../utils/api';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '@env';

export default function MatchesScreen() {
  const navigation               = useNavigation();
  const [matches,     setMatches] = useState([]);
  const [filtered,    setFiltered] = useState([]);
  const [lastMsgs,    setLastMsgs] = useState({});   // { id : {msg,ts} }
  const [search,      setSearch]  = useState('');
  const [loading,     setLoading] = useState(true);
  const [currentUID,  setCurrentUID] = useState(null);

// inside MatchesScreen.js
const fetchLastMessage = async (me, matchId, token) => {
  try {
    /* 1️⃣ try server-side newest-first (change the param name to match your API) */
    let res   = await fetch(
      `${API_BASE_URL}/messages/${me}/${matchId}?limit=1&order=desc`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    let data  = await res.json();
    if (Array.isArray(data) && data.length) {
      return { msg: data[0].message, ts: data[0].ts };
    }

    /* 2️⃣ otherwise grab the list + take the last entry */
    res  = await fetch(
      `${API_BASE_URL}/messages/${me}/${matchId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    data = await res.json();
    if (Array.isArray(data) && data.length) {
      const last = data.at(-1);            // newest message
      return { msg: last.message, ts: last.ts };
    }
  } catch (e) {
    console.warn('preview-fetch failed', e);
  }
  return null;
};


  /* ───────── load matches (+ preview text) ────────────────── */
  const loadMatches = useCallback(async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return;

    const matchRes = await getMatches(token);
    const list     = matchRes.data ?? [];

    setMatches(list);
    setFiltered(list);

    /* fetch previews in parallel */
    const entries = await Promise.all(
      list.map(async (m) => {
        const prev = await fetchLastMessage(currentUID, m.id, token);
        return prev ? [m.id, prev] : null;
      })
    );

    const msgMap = Object.fromEntries(entries.filter(Boolean));
    setLastMsgs(msgMap);
  }, [currentUID]);

  /* ───────── initial mount ───────────────────────────────── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return setLoading(false);

      try {
        const userRes = await getCurrentUser(token);
        setCurrentUID(userRes.data.id);
      } catch {/* ignore */}
      await loadMatches();
      setLoading(false);
    })();
  }, [loadMatches]);

  /* ───────── search filter ───────────────────────────────── */
  const onSearch = (text) => {
    setSearch(text);
    const needle = text.toLowerCase();
    setFiltered(
      matches.filter((m) => m.name.toLowerCase().includes(needle))
    );
  };

  /* ───────── un-match / delete ───────────────────────────── */
  const handleUnmatch = (userId, name) => {
    Alert.alert(`Unconnect ${name}?`, null, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unconnect',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            await deleteMatch(userId, token);
            setMatches((ms) => ms.filter((m) => m.id !== userId));
            setFiltered((ms) => ms.filter((m) => m.id !== userId));
            setLastMsgs((lm) => {
              const copy = { ...lm };
              delete copy[userId];
              return copy;
            });
          } catch {
            Alert.alert('Error', 'Failed to unmatch.');
          }
        },
      },
    ]);
  };

  /* ───────── render row ──────────────────────────────────── */
  const renderItem = ({ item }) => {
    const preview = lastMsgs[item.id]?.msg;
    return (
      <View style={styles.card}>
        <Image
          source={{
            uri: item.profile_picture || 'https://placekitten.com/200/200',
          }}
          style={styles.avatar}
        />

        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          {preview ? (
            <Text style={styles.preview} numberOfLines={1}>
              {preview}
            </Text>
          ) : (
            <Text style={styles.newConn}>New Connection</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() =>
            navigation.navigate('ChatScreen', {
              userId:   currentUID,
              matchId:  item.id,
              matchName:item.name,
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
  };

  /* ───────── UI ──────────────────────────────────────────── */
  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search"
        placeholderTextColor="#999"
        style={styles.searchBar}
        value={search}
        onChangeText={onSearch}
      />

      {loading ? (
        <Text style={styles.empty}>Loading connections…</Text>
      ) : filtered.length === 0 ? (
        <Text style={styles.empty}>No connections yet 😢</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

/* ───────── styles ───────────────────────────────────────── */
const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#fff' },
  searchBar:     { margin: 12, paddingHorizontal: 16, paddingVertical: 8,
                   borderRadius: 20, backgroundColor: '#f0f0f0', fontSize: 16 },
  empty:         { textAlign: 'center', marginTop: 40, color: '#666',
                   fontSize: 16 },

  card:          { flexDirection: 'row', alignItems: 'center',
                   paddingVertical: 12, paddingHorizontal: 16,
                   borderBottomColor: '#eee', borderBottomWidth: 1 },
  avatar:        { width: 50, height: 50, borderRadius: 25 },
  info:          { flex: 1, marginLeft: 12 },
  name:          { fontSize: 17, fontWeight: '600', color: '#333' },
  preview:       { fontSize: 13, color: '#888', marginTop: 2 },
  newConn:       { fontSize: 13, fontWeight: '700', color: '#6C3FB5',
                   marginTop: 2 },

  chatBtn:       { backgroundColor: '#f0f0f0', paddingHorizontal: 12,
                   paddingVertical: 6, borderRadius: 16, marginRight: 12 },
  chatText:      { fontSize: 14, color: '#333' },

  unmatchBtn:    { padding: 6 },
  unmatchText:   { fontSize: 18, color: 'red' },
});
