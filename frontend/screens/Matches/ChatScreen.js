// screens/ChatScreen.js
import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '@env';

export default function ChatScreen({ route }) {
  const { userId, matchId, matchName } = route.params;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const socket = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    // fetch history
    (async () => {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(
        `${API_BASE_URL}/messages/${userId}/${matchId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setMessages(data);
    })();

    // open WS
    const host = API_BASE_URL.replace(/^https?:\/\//, '');
    socket.current = new WebSocket(`ws://${host}/ws/chat/${userId}`);
    socket.current.onmessage = evt => {
      const incoming = JSON.parse(evt.data);
      setMessages(prev => [...prev, incoming]);
    };
    return () => socket.current?.close();
  }, [userId, matchId]);

  const sendMessage = () => {
    if (!input.trim()) return;
    socket.current.send(
      JSON.stringify({ to: matchId, message: input.trim() })
    );
    setInput('');
  };

  const renderItem = ({ item }) => {
    const isMe = item.from === userId;
    return (
      <View
        style={[
          styles.bubble,
          isMe ? styles.bubbleOut : styles.bubbleIn,
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            isMe && styles.bubbleTextOut,
          ]}
        >
          {item.message}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* — Header — */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="chevron-back"
            size={24}
            color="#6C3FB5"
          />
        </TouchableOpacity>
        <Text style={styles.title}>{matchName}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* — Chat messages — */}
      <FlatList
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.chatList}
      />

      {/* — Input row (keyboard aware) — */}
      <KeyboardAvoidingView
        style={styles.avoider}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={styles.sendBtn}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    backgroundColor: '#fff',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  chatList: {
    padding: 16,
    flexGrow: 1,
  },
  bubble: {
    maxWidth: '75%',
    padding: 10,
    marginVertical: 6,
    borderRadius: 16,
  },
  bubbleIn: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
  },
  bubbleOut: {
    backgroundColor: '#6C3FB5',
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
  },
  bubbleText: {
    color: '#333',
    fontSize: 15,
  },
  bubbleTextOut: {
    color: '#fff',
  },
  avoider: {
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopColor: '#eee',
    borderTopWidth: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    fontSize: 16,
    marginRight: 8,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6C3FB5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});