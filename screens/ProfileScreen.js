import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DropDownPicker from 'react-native-dropdown-picker';
import * as ImagePicker from 'expo-image-picker';
import { getCurrentUser, updateUser, uploadProfilePhoto } from '../utils/api';
import { useNavigation } from '@react-navigation/native'; // ✅ Add this at the top


const ProfileScreen = () => {
  const navigation = useNavigation(); // ✅ Add this line
  
  const [userInfo, setUserInfo] = useState(null);
  const [editing, setEditing] = useState(false);

  // Gender dropdown
  const [genderOpen, setGenderOpen] = useState(false);
  const [genderItems, setGenderItems] = useState([
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Non-binary', value: 'Non-binary' },
  ]);

  // Height dropdown
  const [heightOpen, setHeightOpen] = useState(false);
  const [heightItems, setHeightItems] = useState([]);

  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await getCurrentUser(token);
      setUserInfo(response.data);
    } catch (error) {
      console.error('Error fetching user:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load user info');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      await updateUser(userInfo.id, userInfo, token);
      Alert.alert('Success', 'Profile updated successfully!');
      setEditing(false); // ✅ Just disable editing
    } catch (err) {
      console.error('Error updating user:', err);
      Alert.alert('Error', 'Could not update profile.');
    }
  };
  

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      });

      try {
        const token = await AsyncStorage.getItem('token');
        const res = await uploadProfilePhoto(formData, token);
        setUserInfo((prev) => ({ ...prev, profile_photo: res.data.photo_url }));
      } catch (error) {
        console.error(error);
        Alert.alert('Upload failed', 'Please try again');
      }
    }
  };

  useEffect(() => {
    fetchUser();

    const options = [];
    for (let feet = 4; feet <= 7; feet++) {
      for (let inches = 0; inches <= 11; inches++) {
        const total = (feet + inches / 12).toFixed(2);
        if (total >= 4.5 && total <= 7.0) {
          options.push({ label: `${feet}'${inches}"`, value: parseFloat(total) });
        }
      }
    }
    setHeightItems(options);
  }, []);

  const handleChange = (field, value) => {
    setUserInfo((prev) => ({ ...prev, [field]: value }));
  };

  if (!userInfo) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Image
          source={{
            uri: userInfo.profile_photo || 'https://placekitten.com/300/300',
          }}
          style={styles.avatar}
        />
        <TouchableOpacity onPress={handleImagePick}>
          <Text style={styles.link}>
            {editing ? 'Change Profile Picture' : 'Upload Profile Picture'}
          </Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Name"
          value={userInfo.name || ''}
          onChangeText={(value) => handleChange('name', value)}
          editable={editing}
        />

        <TextInput
          style={styles.input}
          placeholder="Age"
          value={userInfo.age?.toString() || ''}
          onChangeText={(value) => handleChange('age', value)}
          editable={editing}
          keyboardType="numeric"
        />

        <DropDownPicker
          open={genderOpen}
          setOpen={setGenderOpen}
          items={genderItems}
          setItems={setGenderItems}
          value={userInfo.gender}
          setValue={(cb) => handleChange('gender', cb())}
          disabled={!editing}
          placeholder="Select Gender"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
        />

        <TextInput
          style={styles.input}
          placeholder="Location"
          value={userInfo.location || ''}
          onChangeText={(value) => handleChange('location', value)}
          editable={editing}
        />

        <DropDownPicker
          zIndex={3000}
          zIndexInverse={1000}
          open={heightOpen}
          setOpen={setHeightOpen}
          items={heightItems}
          setItems={setHeightItems}
          value={userInfo.height}
          setValue={(cb) => handleChange('height', cb())}
          disabled={!editing}
          placeholder="Select Height"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
        />

        <TextInput
          style={styles.input}
          placeholder="Bio"
          value={userInfo.bio || ''}
          onChangeText={(value) => handleChange('bio', value)}
          editable={editing}
          multiline
        />

        {editing ? (
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.link}>Save</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Text style={styles.link}>Edit</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity onPress={() => navigation.navigate('Swipe')}>
          <Text style={styles.logout}>Start Swiping</Text>
        </TouchableOpacity> */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#f2f2f2',
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignSelf: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  dropdown: {
    marginBottom: 15,
    borderRadius: 8,
    borderColor: '#ccc',
    zIndex: 1000,
  },
  dropdownContainer: {
    borderRadius: 8,
    borderColor: '#ccc',
    zIndex: 1000,
  },
  link: {
    color: 'blue',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  logout: {
    color: 'gray',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
});
