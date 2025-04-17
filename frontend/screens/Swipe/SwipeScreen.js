import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, ActivityIndicator, Image } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPotentialMatches, sendSwipe, getMatches } from '../../utils/api';

const SwipeScreen = () => {
  const [discoverList, setDiscoverList] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);

  const loadRecommendations = async (reset = false) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await getPotentialMatches(token, page); // 👈 pass page here
  
      if (reset) {
        setDiscoverList(res.data);
      } else {
        setDiscoverList((prev) => [...prev, ...res.data]);
      }
  
      setPage(prev => prev + 1);
      setIndex(0);
    } catch (err) {
      console.error('Failed to load matches:', err);
      Alert.alert('Error', 'Could not load matches.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle swipe
  const handleSwipe = async (index, direction) => {
    const token = await AsyncStorage.getItem('token');
    const user = discoverList[index];
  
    console.log(`[SWIPE] User: ${user?.name}, ID: ${user?.id}, Direction: ${direction}`);
  
    try {
      await sendSwipe(user.id, direction, token);
  
      if (direction === 'right') {
        // Check for match
        const res = await getMatches(token);
        const match = res.data.find((m) => m.id === user.id);
        if (match) {
          Alert.alert('✨ It’s a Match!', `You and ${user.name} have matched!`);
        }
  
        const newList = discoverList.filter((u) => u.id !== user.id);
        setDiscoverList(newList);
        setIndex(0);
      } else {
        const nextIndex = index + 1;
        if (nextIndex >= discoverList.length) {
          setIndex(0);
        } else {
          setIndex(nextIndex);
        }
      }
    } catch (err) {
      console.error('[SWIPE ERROR]', err);
      Alert.alert('Swipe failed', 'Something went wrong');
    }
  };
  
  
  
  
  
  
  useEffect(() => {
    loadRecommendations();
  }, []);
  

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading potential matches...</Text>
      </View>
    );
  }

  if (discoverList.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.noMoreText}>No more users to swipe on 😢</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Swiper
        cards={discoverList}
        renderCard={(user) => {
          if (!user) return null;
        
          const isMulti = user.profile_type === 'duo' || user.profile_type === 'group';
        
          return (
            <View style={styles.card}>
              <Image
                source={{ uri: user.profile_photo || 'https://placekitten.com/300/300' }}
                style={styles.photo}
              />
        
              <Text style={styles.profileType}>
                {user.profile_type === 'uno' && '🧍 Uno'}
                {user.profile_type === 'duo' && '🧑‍🤝‍🧑 Duo'}
                {user.profile_type === 'group' && '👯 Group'}
              </Text>
        
              {/* Primary Info – ONLY FOR SOLO */}
              {!isMulti && (
                <>
                  <Text style={styles.name}>
                    {user.name ?? 'Anonymous'}, {user.age ?? 'Unknown Age'}
                  </Text>
                  <Text style={styles.meta}>{user.ethnicity ?? 'No Ethnicity'}</Text>
                </>
              )}
        
              {/* Shared Info for Duo/Group */}
              <Text style={styles.meta}>📍 {user.location ?? 'Unknown location'}</Text>
              <Text style={styles.meta}>🎯 {user.looking_for ?? 'Not specified'}</Text>
              <Text style={styles.meta}>
                🎨 {Array.isArray(user.interests) ? user.interests.join(', ') : user.interests ?? 'None'}
              </Text>
        
              <Text style={styles.bio}>{user.bio ?? 'No bio yet.'}</Text>
        
              {/* Members */}
              {isMulti && (
                <>
                  <Text style={styles.name}>Members</Text>
                  {(user.members ?? []).map((m, i) => (
                    <Text key={m.id || i} style={styles.meta}>
                      {m.name ?? 'Unknown'}, {m.age ?? 'Unknown Age'}, {m.ethnicity ?? 'No Ethnicity'}
                    </Text>
                  ))}
                </>
              )}
            </View>
          );
        }}
        onSwipedLeft={(index) => handleSwipe(index, 'left')}
        onSwipedRight={(index) => handleSwipe(index, 'right')}
        cardIndex={0}
        backgroundColor="white"
        stackSize={3}
      />
    </View>
  );
};

export default SwipeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  card: {
    flex: 0.7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    backgroundColor: '#f9f9f9', // or gray
    padding: 20,
    alignItems: 'center',
  },
  photo: {
    width: 250,
    height: 250,
    borderRadius: 12,
    marginBottom: 20,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMoreText: {
    fontSize: 18,
    color: 'gray',
  },
  profileType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  shared: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  meta: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 3,
    textAlign: 'center',
  },
});
