import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';

export default function App() {
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch('http://192.168.87.48:8000/') // replace with your machine's IP
      .then((res) => res.json())
      .then((data) => setMsg(data.message))
      .catch((err) => console.log('API error:', err));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Backend says: {msg}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 18 },
});
