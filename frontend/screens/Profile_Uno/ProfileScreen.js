// screens/ProfileScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import GestureRecognizer from 'react-native-swipe-gestures';
import EditProfileView from './EditProfileView';
import PreviewProfileView from './PreviewProfileView';
import { getCurrentUser } from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const [mode, setMode] = useState('edit');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const token = await AsyncStorage.getItem('token');
    if (!token) return setLoading(false);
    try {
      const { data } = await getCurrentUser(token);
      setUser(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C3FB5"/>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Unable to load profile.</Text>
      </View>
    );
  }

  return (
    <GestureRecognizer
      onSwipeLeft={() => setMode('edit')}
      onSwipeRight={() => setMode('preview')}
      style={styles.flex}
      config={{ velocityThreshold: 0.3, directionalOffsetThreshold: 80 }}
    >
      {/* ——— Mode Toggle ——— */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            mode === 'edit'    && styles.toggleBtnActive
          ]}
          onPress={() => setMode('edit')}
        >
          <Text
            style={[
              styles.toggleText,
              mode === 'edit' && styles.toggleTextActive
            ]}
          >
            ✏️ Edit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            mode === 'preview' && styles.toggleBtnActive
          ]}
          onPress={() => setMode('preview')}
        >
          <Text
            style={[
              styles.toggleText,
              mode === 'preview' && styles.toggleTextActive
            ]}
          >
            👀 Preview
          </Text>
        </TouchableOpacity>
      </View>

      {/* ——— Content ——— */}
      <ScrollView style={styles.container}>
        {mode === 'edit' ? (
          <EditProfileView user={user} onRefresh={load}/>
        ) : (
          <PreviewProfileView user={user} />
        )}
      </ScrollView>
    </GestureRecognizer>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1 },
  container: { flex: 1, backgroundColor: '#f7f7f7' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  toggleRow: { flexDirection: 'row', margin:        16, borderRadius:  8, backgroundColor: '#e0e0e0', overflow:      'hidden',},
  toggleBtn: {
    flex:         1,
    padding:      12,
    alignItems:   'center',
    justifyContent:'center',
  },
  toggleBtnActive: {
    backgroundColor: '#6C3FB5',
  },
  toggleText: {
    color:       '#333',
    fontWeight:  '600',
  },
  toggleTextActive: {
    color:       '#fff',
  },
});