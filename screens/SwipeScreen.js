import React, { useEffect, useState } from 'react';
import { View, Text, Alert, StyleSheet, ActivityIndicator, Image } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPotentialMatches, sendSwipe } from '../utils/api';

const SwipeScreen = () => {
  const [userCards, setUserCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await getPotentialMatches(token);
      setUserCards(res.data);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Could not load potential matches');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (index, direction) => {
    const token = await AsyncStorage.getItem('token');
    const swipee = userCards[index];

    try {
      const res = await sendSwipe(swipee.id, direction, token);
      if (res.data.matched) {
        Alert.alert("💘 It's a Match!", `You and ${swipee.name} like each other!`);
      }
    } catch (error) {
      console.error('Swipe error:', error.response?.data || error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  if (userCards.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.noMoreText}>No more users to swipe on 😢</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Swiper
        cards={userCards}
        renderCard={(user) => (
          <View style={styles.card}>
            <Image
              source={{ uri: user.profile_photo || 'https://placekitten.com/300/300' }}
              style={styles.photo}
            />
            <Text style={styles.name}>{user.name}, {user.age}</Text>
            <Text style={styles.bio}>{user.bio}</Text>
          </View>
        )}
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
    backgroundColor: 'white',
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
});
