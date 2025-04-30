// screens/PreviewProfileView.js
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PreviewProfileView({ user }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* — Profile Photo & Name — */}
      <View style={styles.photoSection}>
        <Image
          source={{ uri: user.profile_photo || 'https://placekitten.com/200/200' }}
          style={styles.profilePhoto}
        />
        <Text style={styles.name}>
          {user.name}{user.age ? `, ${user.age}` : ''}
        </Text>
        <Text style={styles.profileType}>
          {user.profile_type === 'uno'  && '🧍 Uno'}
          {user.profile_type === 'duo'  && '🧑‍🤝‍🧑 Duo'}
          {user.profile_type === 'group'&& '👯 Group'}
        </Text>
      </View>

      {/* — Shared / Basic Info — */}
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color="#6C3FB5" />
          <Text style={styles.infoText}>{user.location || 'No location'}</Text>
        </View>
        {user.looking_for && (
          <View style={styles.infoRow}>
            <Ionicons name="search-outline" size={18} color="#6C3FB5" />
            <Text style={styles.infoText}>{user.looking_for}</Text>
          </View>
        )}
        {user.bio && (
          <View style={styles.infoRow}>
            <Ionicons name="reader-outline" size={18} color="#6C3FB5" />
            <Text style={styles.infoText}>{user.bio}</Text>
          </View>
        )}
        {user.interests?.length > 0 && (
          <View style={styles.infoRow}>
            <Ionicons name="star-outline" size={18} color="#6C3FB5" />
            <Text style={styles.infoText}>{user.interests.join(', ')}</Text>
          </View>
        )}
        {user.past_activities?.length > 0 && (
          <View style={styles.infoRow}>
            <Ionicons name="albums-outline" size={18} color="#6C3FB5" />
            <Text style={styles.infoText}>{user.past_activities.join(', ')}</Text>
          </View>
        )}
      </View>

      {/* — Members (for Duo & Group) — */}
      {Array.isArray(user.members) && user.members.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Members</Text>
          {user.members.map(m => (
            <View key={m.id} style={styles.memberRow}>
              <Image
                source={{ uri: m.profile_photo || 'https://placekitten.com/100/100' }}
                style={styles.memberAvatar}
              />
              <Text style={styles.memberName}>
                {m.name}{m.age ? `, ${m.age}` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#F7F7F7' },
  photoSection: { alignItems: 'center', marginBottom: 16 },
  profilePhoto: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '600', color: '#333' },
  profileType: { marginTop: 4, fontSize: 14, color: '#6C3FB5' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  infoText: { marginLeft: 8, color: '#333', flexShrink: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  memberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  memberName: { fontSize: 15, color: '#333' }
});