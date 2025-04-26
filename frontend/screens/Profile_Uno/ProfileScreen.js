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

  useEffect(() => {
    load();
  }, [load]);

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
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {mode === 'edit' ? (
          <EditProfileView user={user} onRefresh={load} />
        ) : (
          <PreviewProfileView user={user} />
        )}
      </ScrollView>
    </GestureRecognizer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  // outer ScrollView style
  container: {
    flex: 1,
    backgroundColor: '#F7F3FF',
  },

  // inner content layout for centering
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  toggleRow: {
    flexDirection: 'row',
    margin: 16,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  toggleBtn: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#6C3FB5',
  },
  toggleText: {
    color: '#333',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
  },

  // (you can keep your other button/text styles below)
  title: { fontSize: 40, fontWeight: 'bold', color: '#B76EFF', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#555', marginBottom: 40, textAlign: 'center' },
  icon: { marginBottom: 50 },
  buttonPrimary: { backgroundColor: '#B76EFF', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 10, marginBottom: 15, width: '100%' },
  buttonSecondary: { backgroundColor: '#8E44AD', paddingVertical: 14, paddingHorizontal: 30, borderRadius: 10, marginBottom: 25, width: '100%' },
  buttonText: { color: '#fff', fontSize: 16, textAlign: 'center', fontWeight: '600' },
  link: { marginTop: 10 },
  linkText: { color: '#7D3C98', fontSize: 14, textDecorationLine: 'underline' },
});