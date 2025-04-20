// screens/SwipeScreen.js

import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Platform,
  InteractionManager,
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DropDownPicker from 'react-native-dropdown-picker';
import { getPotentialMatches, sendSwipe, getMatches } from '../../utils/api';
import {
  interestsOptions,
  ethnicityOptions,
  personalityOptions,
} from '../constants/Dropdowns';
import { Ionicons } from '@expo/vector-icons';

export default function SwipeScreen({ navigation }) {
  // full vs filtered
  const [allCards, setAllCards] = useState([]);
  const [cards, setCards] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // filters
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState(null);
  const [ethnicityFilter, setEthnicityFilter] = useState([]);
  const [personalityFilter, setPersonalityFilter] = useState([]);
  const [interestsFilter, setInterestsFilter] = useState([]);

  // dropdown opens
  const [gOpen, setGOpen] = useState(false);
  const [eOpen, setEOpen] = useState(false);
  const [pOpen, setPOpen] = useState(false);
  const [iOpen, setIOpen] = useState(false);

  // derived interests dropdown
  const [interestsItems, setInterestsItems] = useState([]);

  // header button
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Discover',
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setFiltersVisible(true)}
          style={{ marginRight: 16 }}
        >
          <Ionicons 
            name="filter-outline" 
            size={24} 
            color="#B76EFF" 
          />
        </TouchableOpacity>
      ),
    });
  }); // no deps so always up to date

  // clear any open pickers whenever modal finally closes
  useEffect(() => {
    if (!filtersVisible) {
      setGOpen(false);
      setEOpen(false);
      setPOpen(false);
      setIOpen(false);
    }
  }, [filtersVisible]);

  // load pages

  const hideFiltersModal = () => {
    // close pickers
    setGOpen(false);
    setEOpen(false);
    setPOpen(false);
    setIOpen(false);

    setTimeout(() => setFiltersVisible(false), 0);
  };

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await getPotentialMatches(token, page);
      const next = page === 0 ? res.data : [...allCards, ...res.data];
      setAllCards(next);
      setCards(next);
      setPage((p) => p + 1);

      // build interest options
      const allI = new Set();
      next.forEach((u) =>
        Array.isArray(u.interests) && u.interests.forEach((i) => allI.add(i))
      );
      setInterestsItems([...allI].map((i) => ({ label: i, value: i })));
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not load matches.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadRecommendations();
  }, []);

  // swipe handler
  const handleSwipe = async (idx, dir) => {
    const user = cards[idx];
    try {
      const token = await AsyncStorage.getItem('token');
      await sendSwipe(user.id, dir, token);
      if (dir === 'right') {
        const m = await getMatches(token);
        if (m.data.find((x) => x.id === user.id)) {
          Alert.alert('🎉 It is a match!', `You matched with ${user.name}`);
        }
      }
      setCards((cs) => cs.filter((_, i) => i !== idx));
    } catch {
      Alert.alert('Error', 'Swipe failed.');
    }
  };

  // apply / clear
  const applyFilters = () => {
  const filtered = allCards.filter((u) => {
    if (locationFilter && u.location !== locationFilter) return false;
    if (genderFilter   && u.gender   !== genderFilter)   return false;

    if (
      ethnicityFilter.length &&
      !ethnicityFilter.some((e) => (u.ethnicity || []).includes(e))
    ) return false;

    if (
      personalityFilter.length &&
      !personalityFilter.some((p) => (u.personality || []).includes(p))
    ) return false;

    if (
      interestsFilter.length &&
      !interestsFilter.some((i) => (u.interests || []).includes(i))
    ) return false;

    return true;
  });

  setCards(filtered);
  hideFiltersModal();        // <<—
};

const clearFilters = () => {
  setLocationFilter('');
  setGenderFilter(null);
  setEthnicityFilter([]);
  setPersonalityFilter([]);
  setInterestsFilter([]);

  setCards(allCards);
  hideFiltersModal();        // <<—
};

  return (
    <View style={styles.container}>
      {/* ───────────── 𝟙. Filters Modal ───────────── */}
      <Modal
        key={String(filtersVisible)}
        visible={filtersVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFiltersVisible(false)}
        onDismiss={() => {
          setGOpen(false);
          setEOpen(false);
          setPOpen(false);
          setIOpen(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.filterHeader}>Filters</Text>
  
              {/* Location */}
              <Text style={styles.label}>Location (city)</Text>
              <TextInput
                style={styles.input}
                placeholder="Exact city"
                value={locationFilter}
                onChangeText={setLocationFilter}
              />
  
              {/* Gender */}
              <Text style={styles.label}>Gender</Text>
              <DropDownPicker
                open={gOpen}
                value={genderFilter}
                items={[
                  { label: 'Male',        value: 'male' },
                  { label: 'Female',      value: 'female' },
                  { label: 'Non‑binary',  value: 'non-binary' },
                  { label: 'Other',       value: 'other' },
                ]}
                setOpen={setGOpen}
                setValue={setGenderFilter}
                placeholder="Any"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
              />
  
              {/* Ethnicity */}
              <Text style={styles.label}>Ethnicity</Text>
              <DropDownPicker
                open={eOpen}
                value={ethnicityFilter}
                items={ethnicityOptions}
                setOpen={setEOpen}
                setValue={setEthnicityFilter}
                multiple
                mode="BADGE"
                listMode="MODAL"
                placeholder="Any"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
              />
  
              {/* Personality */}
              <Text style={styles.label}>Personality</Text>
              <DropDownPicker
                open={pOpen}
                value={personalityFilter}
                items={personalityOptions}
                setOpen={setPOpen}
                setValue={setPersonalityFilter}
                multiple
                mode="BADGE"
                listMode="MODAL"
                placeholder="Any"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
              />
  
              {/* Interests */}
              <Text style={styles.label}>Interests</Text>
              <DropDownPicker
                open={iOpen}
                value={interestsFilter}
                items={interestsItems}
                setOpen={setIOpen}
                setValue={setInterestsFilter}
                multiple
                mode="BADGE"
                listMode="MODAL"
                searchable
                placeholder="Any"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
              />
  
              {/* Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                  <Text style={styles.clearText}>Turn Off All Filters</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                  <Text style={styles.applyText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
  
      {/* ───────────── 𝟚. Main Body ───────────── */}
      {loading ? (
        /* Loading state */
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text>Loading…</Text>
        </View>
      ) : cards.length ? (
        /* Swiper state */
        <Swiper
          cards={cards}
          renderCard={(u) => {
            // 🧠 Flatten all member photos into a single array
            const allPhotos = Array.isArray(u.photos) && u.photos.length > 0
              ? u.photos // uno or profile-level photos
              : u.members?.flatMap((m) => m.photos || []) || [];
          
            return (
              <View style={styles.card}>
                {/* 🖼️ Scrollable image row at the top */}
                {allPhotos.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.carousel}
                  >
                    {allPhotos.map((photoUrl, idx) => (
                      <Image
                        key={`photo-${idx}`}
                        source={{ uri: photoUrl }}
                        style={styles.carouselImage}
                      />
                    ))}
                  </ScrollView>
                ) : (
                  <Image
                    source={{ uri: u.profile_photo || 'https://placekitten.com/300/300' }}
                    style={styles.carouselImage}
                  />
                )}
          
                {/* Name + rest */}
                <Text style={styles.name}>
                  {u.name}
                  {u.age ? `, ${u.age}` : ''}
                </Text>
          
                <View style={styles.infoRow}><Text style={styles.meta}>📍 {u.location || 'Unknown'}</Text></View>
                <View style={styles.infoRow}><Text style={styles.meta}>🧠 {u.bio || u.shared_bio || 'No bio yet'}</Text></View>
                <View style={styles.infoRow}><Text style={styles.meta}>🎯 {u.looking_for || 'Not specified'}</Text></View>
                <View style={styles.infoRow}><Text style={styles.meta}>🎨 {(u.interests || []).join(', ') || 'No interests yet'}</Text></View>
          
                {/* Optional: keep member names below */}
                {u.members && u.members.length > 0 && (
                  <View style={{ width: '100%', marginTop: 10 }}>
                    <Text style={styles.memberHeader}>👥 Members</Text>
                    {u.members.map((m) => (
                      <Text key={m.id} style={styles.meta}>
                        • {m.name}{m.age ? `, ${m.age}` : ''}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            );
          }}
          onSwipedLeft={(i) => handleSwipe(i, 'left')}
          onSwipedRight={(i) => handleSwipe(i, 'right')}
          stackSize={3}
          backgroundColor="#fff"
        />
      ) : (
        /* Empty‑results state */
        <View style={styles.center}>
          <Text style={styles.noMore}>No users match your filters 😢</Text>
          <TouchableOpacity onPress={clearFilters} style={{ marginTop: 8 }}>
            <Text style={{ color: '#B76EFF' }}>Clear filters</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noMore: { fontSize: 18, color: 'black' },
  photo: { width: 250, height: 250, borderRadius: 12, marginBottom: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
  modalContent: { margin: 20, backgroundColor: '#fff', borderRadius: 10, padding: 16, maxHeight: '80%' },
  filterHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  label: { fontWeight: '600', marginBottom: 4 },
  input: { backgroundColor: '#f2f2f2', padding: 8, borderRadius: 6, marginBottom: 12 },
  dropdown: { marginBottom: 12, borderColor: '#ccc' },
  dropdownContainer: { borderColor: '#ccc' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  clearBtn: { padding: 10 },
  clearText: { color: 'red' },
  applyBtn: { backgroundColor: '#B76EFF', padding: 10, borderRadius: 6 },
  applyText: { color: '#fff' },
  card: { flex: 0.75, backgroundColor: '#fdf9ff', borderRadius: 20, padding: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 4 },
  carousel: { width: '100%', marginBottom: 20 },
  carouselImage: { width: 260, height: 260, marginRight: 12, borderRadius: 16, borderColor: '#ddd', borderWidth: 1, flexShrink: 0, },
  name: { fontSize: 22, fontWeight: '600', color: '#333', marginBottom: 10 },
  infoRow: { width: '100%', marginBottom: 6 },
  meta: { fontSize: 15, color: '#555', textAlign: 'left' },
  memberHeader: { fontSize: 16, fontWeight: '600', color: '#6c2bb9', marginTop: 10, marginBottom: 4 },
});