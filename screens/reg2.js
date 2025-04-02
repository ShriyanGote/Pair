// // screens/RegisterScreen.js

// import React, { useState } from 'react';
// import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
// import { register } from '../utils/api';

// const RegisterScreen = ({ navigation }) => {
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [bio, setBio] = useState('');
//   const [interests, setInterests] = useState('');
//   const [age, setAge] = useState('');
//   const [gender, setGender] = useState('');
//   const [location, setLocation] = useState('');
//   const [profilePhoto, setProfilePhoto] = useState('');


// /*
//   const handleRegister = async () => {
//     if (!email.includes('@') || !email.includes('.')){
//       Alert.alert('Invalid Email', 'Please enter a valid email address.');
//       return;
//     }
//     if (password.length() < 6 || password.includes(name)){
//       Alert.alert('Invalid Password', 'Please enter a valid password (Longer than 6 char, does not include name).');
//       return;
//     }
//     try {
//       const response = await register({
//         name,
//         email,
//         password, 
//       });
  
//       if (response.data.error) {
//         Alert.alert('Error', response.data.error);
//       } else {
//         Alert.alert('Success', 'Registered successfully!');
//         navigation.navigate('Login');
//       }
//     } catch (err) {
//       console.error(err);
//       Alert.alert('Error', 'Something went wrong. Please try again.');
//     }
//   };
//   */
//   const handleRegister = async () => {
//     if (!email.includes('@') || !email.includes('.')){
//       Alert.alert('Invalid Email', 'Please enter a valid email address.');
//       return;
//     }
//     if (password.length < 6){
//       Alert.alert('Invalid Password', 'Please enter a valid password (Longer than 6 char, does not include name).');
//       return;
//     }
//     try {
//       const response = await register({
//         name,
//         email,
//         password,
//       });
  
//       if (response.data.error) {
//         Alert.alert('Error', response.data.error);
//       } else {
//         Alert.alert('Success', 'Registered successfully!');
//         navigation.navigate('Login');
//       }
//     } catch (err) {
//       console.error('Register error:', err.response?.data || err.message);
//       Alert.alert('Error', 'Something went wrong. Please try again.');
//     }
//   };
  

//   return (
//     <View style={styles.container}>
//       <Text style={styles.header}>Register</Text>

//       <TextInput
//         style={styles.input}
//         placeholder="Full Name"
//         value={name}
//         onChangeText={setName}
//       />

//       <TextInput
//         style={styles.input}
//         placeholder="Email"
//         value={email}
//         onChangeText={setEmail}
//         autoCapitalize="none"
//         keyboardType="email-address"
//       />

//       <TextInput
//         style={styles.input}
//         placeholder="Password"
//         value={password}
//         onChangeText={setPassword}
//         secureTextEntry
//       />

//       <Button title="Register" onPress={handleRegister} />
//       <Button title="Back to Login" onPress={() => navigation.navigate('Login')} />
//       <Button title="Back to Home" onPress={() => navigation.navigate('Home')} />


//     </View>
//   );
// };

// export default RegisterScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 30,
//     justifyContent: 'center',
//     backgroundColor: '#f9f9f9',
//   },
//   header: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     marginBottom: 32,
//     textAlign: 'center',
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: '#ccc',
//     padding: 12,
//     borderRadius: 6,
//     marginBottom: 16,
//     backgroundColor: '#fff',
//   },
//   link: {
//     color: 'gray',
//     textAlign: 'center',
//     marginTop: 20,
//   },
// });
