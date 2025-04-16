import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Slider from '@react-native-community/slider';

const ethnicityOptions = [
  { label: 'Middle Eastern', value: 'middle_eastern' },
  { label: 'Native American', value: 'native_american' },
  { label: 'Pacific Islander', value: 'pacific_islander' },
  { label: 'South Asian', value: 'south_asian' },
  { label: 'Southeast Asian', value: 'southeast_asian' },
  { label: 'East Asian', value: 'east_asian' },
  { label: 'Central Asian', value: 'central_asian' },
  { label: 'North African', value: 'north_african' },
  { label: 'Afro-Caribbean', value: 'afro_caribbean' },
  { label: 'Latinx', value: 'latinx' },
  { label: 'Multiracial', value: 'multiracial' },
  { label: 'Prefer Not to Say', value: 'prefer_not_to_say' },
];

const pastActivitiesOptions = [
  { label: 'Cardio', value: 'Cardio' },
  { label: 'Board Games', value: 'Board Games' },
  { label: 'Martial Arts', value: 'Martial Arts' },
  { label: 'Climbing', value: 'Climbing' },
  { label: 'Skating', value: 'Skating' },
  { label: 'Winter Sports', value: 'Winter Sports' },
  { label: 'Running', value: 'Running' },
  { label: 'Cycling', value: 'Cycling' },
  { label: 'Yoga', value: 'Yoga' },
  { label: 'Pilates', value: 'Pilates' },
  { label: 'Hiking', value: 'Hiking' },
  { label: 'Fishing', value: 'Fishing' },
  { label: 'Camping', value: 'Camping' },
  { label: 'Traveling', value: 'Traveling' },
  { label: 'DIY Projects', value: 'DIY Projects' },
  { label: 'Esports', value: 'Esports' },
  { label: 'Parkour', value: 'Parkour' },
  { label: 'Archery', value: 'Archery' },
  { label: 'Surfing', value: 'Surfing' },
  { label: 'Horseback Riding', value: 'Horseback Riding' },
];

const EditProfileDetails = ({ route, navigation }) => {
  const { ethnicity, socialMediaUse, pastActivities, occupation, onSave } = route.params || {};
  const [ethnicityOpen, setEthnicityOpen] = useState(false);
  const [pastOpen, setPastOpen] = useState(false);
  const [ethnicityValue, setEthnicityValue] = useState(ethnicity || null);
  const [pastValue, setPastValue] = useState(() => {
    if (Array.isArray(pastActivities)) return pastActivities;
    if (typeof pastActivities === 'string') {
      try {
        const parsed = JSON.parse(pastActivities);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  });  const [socialValue, setSocialValue] = useState(socialMediaUse || 5);
  const [occupationValue, setOccupationValue] = useState(occupation || '');

  const handleSave = () => {
    if (!ethnicityValue || pastValue.length === 0 || !occupationValue) {
      Alert.alert('Please fill all fields.');
      return;
    }
    if (onSave) {
      onSave({
        ethnicity: ethnicityValue,
        socialMediaUse: socialValue,
        pastActivities: pastValue,
        occupation: occupationValue,
      });
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Edit Profile Details</Text>
      <Text style={styles.label}>Ethnicity</Text>
      <DropDownPicker
        open={ethnicityOpen}
        setOpen={setEthnicityOpen}
        value={ethnicityValue}
        setValue={setEthnicityValue}
        items={ethnicityOptions}
        placeholder="Select Ethnicity"
        style={styles.dropdown}
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
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />
      <Text style={styles.label}>Occupation</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Occupation"
        value={occupationValue}
        onChangeText={setOccupationValue}
      />
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, marginTop: 15, marginBottom: 5 },
  dropdown: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
  dropdownContainer: { borderWidth: 1, borderColor: '#ddd' },
  slider: { width: '100%', height: 40 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginTop: 5 },
  saveButton: { backgroundColor: '#DB4437', padding: 15, borderRadius: 8, marginTop: 30 },
  saveButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
});

export default EditProfileDetails; 