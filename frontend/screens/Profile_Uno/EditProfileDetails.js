import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Slider from '@react-native-community/slider';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  ethnicityOptions,
  personalityOptions,
  occupationOptions,
  pastActivitiesOptions,
  interestsOptions,
} from '../constants/Dropdowns';

const EditProfileDetails = ({ route, navigation }) => {
  const {
    ethnicity = [],
    socialMediaUse,
    pastActivities = [],
    occupation = [],
    personality = [],
    interests = [],
    onSave,
  } = route.params || {};

  // Dropdown open states
  const [ethnicityOpen, setEthnicityOpen] = useState(false);
  const [pastOpen, setPastOpen] = useState(false);
  const [occupationOpen, setOccupationOpen] = useState(false);
  const [personalityOpen, setPersonalityOpen] = useState(false);
  const [interestOpen, setInterestOpen] = useState(false);

  // Values
  const [ethnicityValue, setEthnicityValue] = useState(
    Array.isArray(ethnicity) ? ethnicity : [ethnicity]
  );
  const [pastValue, setPastValue] = useState(
    Array.isArray(pastActivities) ? pastActivities : []
  );
  const [socialValue, setSocialValue] = useState(
    typeof socialMediaUse === 'number' ? socialMediaUse : 5
  );
  const [occupationValue, setOccupationValue] = useState(
    Array.isArray(occupation) ? occupation : [occupation]
  );
  const [personalityValue, setPersonalityValue] = useState(
    Array.isArray(personality) ? personality : [personality]
  );
  const [interestValue, setInterestValue] = useState(
    Array.isArray(interests) ? interests : [interests]
  );

  const handleSave = () => {
    if (
      ethnicityValue.length === 0 ||
      pastValue.length === 0 ||
      occupationValue.length === 0 ||
      personalityValue.length === 0 ||
      interestValue.length === 0
    ) {
      Alert.alert('Please fill all fields.');
      return;
    }
    onSave?.({
      ethnicity: ethnicityValue,
      socialMediaUse: socialValue,
      pastActivities: pastValue,
      occupation: occupationValue,
      personality: personalityValue,
      interests: interestValue,
    });
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.screen}
    >
      <KeyboardAwareScrollView>
        <View style={styles.card}>
          <Text style={styles.header}>Details & Preferences</Text>

          <Text style={styles.label}>Ethnicity</Text>
          <DropDownPicker
            open={ethnicityOpen}
            setOpen={setEthnicityOpen}
            value={ethnicityValue}
            setValue={setEthnicityValue}
            items={ethnicityOptions}
            multiple={true}
            min={1}
            max={5}
            mode="BADGE"
            placeholder="Select Ethnicity"
            style={styles.input}
            dropDownContainerStyle={styles.dropdownContainer}
          />

          <Text style={styles.label}>Social Media Use: {socialValue}</Text>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={socialValue}
            onValueChange={setSocialValue}
          />

          <Text style={styles.label}>Past Activities</Text>
          <DropDownPicker
            open={pastOpen}
            setOpen={setPastOpen}
            value={pastValue}
            setValue={setPastValue}
            items={pastActivitiesOptions}
            multiple={true}
            min={1}
            max={5}
            mode="BADGE"
            placeholder="Select Past Activities"
            style={styles.input}
            dropDownContainerStyle={styles.dropdownContainer}
          />

          <Text style={styles.label}>Occupation</Text>
          <DropDownPicker
            open={occupationOpen}
            setOpen={setOccupationOpen}
            value={occupationValue}
            setValue={setOccupationValue}
            items={occupationOptions}
            multiple={true}
            min={1}
            max={5}
            mode="BADGE"
            placeholder="Select Occupation"
            style={styles.input}
            dropDownContainerStyle={styles.dropdownContainer}
          />

          <Text style={styles.label}>Personality</Text>
          <DropDownPicker
            open={personalityOpen}
            setOpen={setPersonalityOpen}
            value={personalityValue}
            setValue={setPersonalityValue}
            items={personalityOptions}
            multiple={true}
            min={1}
            max={5}
            mode="BADGE"
            placeholder="Select Personality"
            style={styles.input}
            dropDownContainerStyle={styles.dropdownContainer}
          />

          <Text style={styles.label}>Interests</Text>
          <DropDownPicker
            open={interestOpen}
            setOpen={setInterestOpen}
            value={interestValue}
            setValue={setInterestValue}
            items={interestsOptions}
            multiple={true}
            min={1}
            max={5}
            mode="BADGE"
            placeholder="Select Interests"
            style={styles.input}
            dropDownContainerStyle={styles.dropdownContainer}
          />

          <TouchableOpacity style={styles.primaryPill} onPress={handleSave}>
            <Text style={styles.primaryText}>Save Details</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditProfileDetails;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7f7f7', padding: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
    zIndex: 1000,
  },
  slider: { width: '100%', height: 40, marginBottom: 20 },
  primaryPill: {
    backgroundColor: '#B76EFF',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
