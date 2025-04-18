import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import Slider from '@react-native-community/slider';
import {
  ethnicityOptions,
  personalityOptions,
  occupationOptions,
  pastActivitiesOptions,
} from '../constants/Dropdowns';

const EditProfileDetails = ({ route, navigation }) => {
  const {
    ethnicity = [],
    socialMediaUse,
    pastActivities = [],
    occupation = [],
    onSave,
  } = route.params || {};

  // Dropdown open states
  const [ethnicityOpen, setEthnicityOpen] = useState(false);
  const [pastOpen, setPastOpen] = useState(false);
  const [occupationOpen, setOccupationOpen] = useState(false);

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

  const handleSave = () => {
    if (
      ethnicityValue.length === 0 ||
      pastValue.length === 0 ||
      occupationValue.length === 0
    ) {
      Alert.alert('Please fill all fields.');
      return;
    }
    onSave?.({
      ethnicity: ethnicityValue,
      socialMediaUse: socialValue,
      pastActivities: pastValue,
      occupation: occupationValue,
    });
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
        multiple={true}
        min={1}
        max={5}
        mode="BADGE"
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
        placeholder="Select Occupation Category"
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EditProfileDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 5,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  saveButton: {
    backgroundColor: '#DB4437',
    padding: 15,
    borderRadius: 8,
    marginTop: 30,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
