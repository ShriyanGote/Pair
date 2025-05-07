import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getCurrentUser,
  getUserPhotos,
} from '../../utils/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * PreviewProfileView renders a quick preview of the *current* user. It fetches the
 * freshest data from the backend on mount so the UI is always in‑sync after edits.
 *
 * Improvements over the previous version
 *  • hero image is now a LARGE rounded‑square (160×160) for a more modern look
 *  • horizontal carousel shows up to 5 extra pictures the user uploaded
 *  • details section now lists gender, ethnicity & personality when present
 */
export default function PreviewProfileView({ user: navUser }) {
  const [user, setUser] = useState(navUser);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const { data: freshUser } = await getCurrentUser(token);
        setUser(freshUser);

        if (freshUser.profile_type === 'uno') {
          const { data: userPhotos } = await getUserPhotos(freshUser.id, token);
          // exclude hero / profile_picture and keep max 5 extras
          const extras = userPhotos.filter(p => p.photo_url !== freshUser.profile_picture).slice(0, 5);
          setPhotos(extras);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  /* ───────────────────────── helpers ───────────────────────── */
  const renderExtraPhoto = ({ item }) => (
    <Image
      source={{ uri: item.photo_url }}
      style={styles.extraPhoto}
    />
  );

  const join = (arr) => Array.isArray(arr) && arr.length ? arr.join(', ') : '—';

  /* ───────────────────────── render ───────────────────────── */
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* HERO */}
      <View style={styles.photoSection}>
        <Image
          source={{ uri: user.profile_picture || 'https://placekitten.com/300' }}
          style={styles.profilePhoto}
        />
        <Text style={styles.name}>
          {user.name}{user.age ? `, ${user.age}` : ''}
        </Text>
        <Text style={styles.profileType}>
          {user.profile_type === 'uno'   && '🧍 Uno'}
          {user.profile_type === 'duo'   && '🧑‍🤝‍🧑 Duo'}
          {user.profile_type === 'group' && '👯 Group'}
        </Text>

        {photos.length > 0 && (
          <FlatList
            horizontal
            data={photos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderExtraPhoto}
            showsHorizontalScrollIndicator={false}
            style={styles.carousel}
          />
        )}
      </View>

      {/* DETAILS */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile Details</Text>
        <DetailRow icon="location-outline" text={user.location || '—'} />
        <DetailRow icon="search-outline"  text={user.looking_for || '—'} />
        {user.gender && <DetailRow icon="male-female" text={user.gender} />}
        {user.ethnicity && <DetailRow icon="earth" text={join(user.ethnicity)} />}
        {user.personality && <DetailRow icon="happy" text={join(user.personality)} />}
        {user.occupation && <DetailRow icon="briefcase" text={join(user.occupation)} />}
        {user.interests && user.interests.length > 0 && (
          <DetailRow icon="star-outline" text={join(user.interests)} />
        )}
        {user.past_activities && user.past_activities.length > 0 && (
          <DetailRow icon="albums-outline" text={join(user.past_activities)} />
        )}
        {user.bio && <DetailRow icon="reader-outline" text={user.bio} />}
      </View>
    </ScrollView>
  );
}

/* ───────────────────────── sub‑components ───────────────────────── */
function DetailRow({ icon, text }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color="#6C3FB5" />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

/* ───────────────────────── styles ───────────────────────── */
const PHOTO_SIZE = 160;
const EXTRA_SIZE = 90;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    backgroundColor: '#F7F7F7',
  },
  /* hero */
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profilePhoto: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 24,   // rounded‑square instead of circle
    marginBottom: 12,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  profileType: {
    marginTop: 4,
    fontSize: 15,
    color: '#6C3FB5',
  },
  carousel: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
  extraPhoto: {
    width: EXTRA_SIZE,
    height: EXTRA_SIZE,
    borderRadius: 16,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  /* card */
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    color: '#333',
    flexShrink: 1,
  },
});