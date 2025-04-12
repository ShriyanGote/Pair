import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  Button,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '@env';

const ChatScreen = ({ route }) => {
  const { userId, matchId, matchName } = route.params;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const socket = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchMessages = async () => {
      const res = await fetch(`${API_BASE_URL}/messages/${userId}/${matchId}`);
      const data = await res.json();
      setMessages(data);
    };

    fetchMessages();

    // Open WebSocket
    const baseUrlNoProtocol = API_BASE_URL.replace(/^http(s)?:\/\//, '');
    socket.current = new WebSocket(`ws://${baseUrlNoProtocol}/ws/chat/${userId}`);

    // Listen for messages
    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    // Clean up
    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, []);

  const sendMessage = () => {
    if (socket.current && input.trim()) {
      const message = input.trim();

      // Send JSON to server (the server will store it and echo it back)
      socket.current.send(JSON.stringify({ to: matchId, message }));

      // Clear local input
      setInput('');
      // NOTE: Do NOT append to messages here 
      // to avoid double-pushing the same message.
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.matchName}>{String(matchName || 'Match')}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <Text
            style={[
              styles.message,
              item.from === userId ? styles.outgoing : styles.incoming,
            ]}
          >
            {`${item.from === userId ? 'You' : String(matchName)}: ${String(
              item.message
            )}`}
          </Text>
        )}
        contentContainerStyle={{ paddingBottom: 10 }}
      />

      {/* Input */}
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="Type a message..."
        style={styles.input}
      />
      <Button title="Send" onPress={sendMessage} />
    </View>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  backBtn: {
    fontSize: 16,
    color: '#007AFF',
  },
  matchName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  message: {
    padding: 10,
    marginVertical: 4,
    borderRadius: 10,
    maxWidth: '80%',
  },
  incoming: {
    backgroundColor: '#eee',
    alignSelf: 'flex-start',
  },
  outgoing: {
    backgroundColor: '#007AFF',
    color: 'white',
    alignSelf: 'flex-end',
  },
  input: {
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
    borderRadius: 5,
  },
});