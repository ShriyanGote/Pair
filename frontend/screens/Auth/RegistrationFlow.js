import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, SafeAreaView,
  Platform, KeyboardAvoidingView
} from 'react-native';
import Slider from '@react-native-community/slider';
import DropDownPicker from 'react-native-dropdown-picker';
import { useNavigation } from '@react-navigation/native';
import { RegistrationContext } from '../Auth/RegistrationContext';
import {
  ethnicityOptions,
  interestsOptions,
  pastActivitiesOptions,
  personalityOptions,
  occupationOptions,
} from '../constants/Dropdowns';

const RegistrationFlow = () => {
  const navigation = useNavigation();
  const { setRegistrationData } = useContext(RegistrationContext);
  const [currentStep, setCurrentStep] = useState(1);
  const [openDropdowns, setOpenDropdowns] = useState({});

  const [formData, setFormData] = useState({
    profileType: '',
    ethnicity: [],
    gender: null,
    interests: [],
    pastActivities: [],
    personality: [],
    socialMediaUse: 5,
    occupation: [],
    shared: {
      bio: '',
      location: '',
      lookingFor: '',
      interests: [],
      pastActivities: []
    },
  });

  const isUno   = formData.profileType === 'uno';
  const isShared = formData.profileType === 'duo' || formData.profileType === 'group';
  const totalSteps = isUno ? 8 : 13;

  // auto-advance when profileType chosen
  useEffect(() => {
    if (formData.profileType) {
      setCurrentStep(2);
      handleNext();
    }
  }, [formData.profileType]);

  const handleSelect = type =>
    setFormData(prev => ({ ...prev, profileType: type }));

  const handleNext = () => {
    const skip = {
      2: !isUno,
      3: !isUno,
      4: !isUno,
      5: !isUno,
      6: !isUno,
      7: !isUno,
      8: !isUno,
      9: !isShared,
      10: !isShared,
      11: !isShared,
      12: !isShared,
      13: !isShared,
    };
    let next = currentStep + 1;
    while (skip[next]) next++;

    if (next <= totalSteps) {
      setCurrentStep(next);
    } else {
      // build payload with snake_case keys
      const payload = {
        profile_type: formData.profileType,
        ethnicity: formData.ethnicity,
        gender: formData.gender,
        interests: formData.interests,
        past_activities: formData.pastActivities,
        personality: formData.personality,
        social_media_use: formData.socialMediaUse,
        occupation: formData.occupation,
        ...(isShared && {
          bio: formData.shared.bio,
          location: formData.shared.location,
          looking_for: formData.shared.lookingFor,
          interests: formData.shared.interests,
          past_activities: formData.shared.pastActivities,
        }),
      };

      setRegistrationData(formData);
      navigation.navigate('Register', { allFields: payload });
    }
  };

  const handleBack = () => {
    const skip = {
      2: !isUno,
      3: !isUno,
      4: !isUno,
      5: !isUno,
      6: !isUno,
      7: !isUno,
      8: !isUno,
      9: !isShared,
      10: !isShared,
      11: !isShared,
      12: !isShared,
      13: !isShared,
    };
    let prev = currentStep - 1;
    while (skip[prev] && prev > 1) prev--;
    if (prev >= 1) setCurrentStep(prev);
  };

  // helper for all dropdowns
  const dropdownProps = (key, items, multiple = false, shared = false) => {
    let value = shared
      ? formData.shared[key]
      : formData[key];
    if (multiple && !Array.isArray(value)) value = [];

    return {
      open: openDropdowns[key] || false,
      value,
      items,
      multiple,
      mode: multiple ? 'BADGE' : 'SIMPLE',
      listMode: 'MODAL',
      searchable: true,
      placeholder: `Select ${key}`,
      style: styles.dropdown,
      dropDownContainerStyle: styles.dropdownContainer,
      setOpen: o => setOpenDropdowns(prev => ({ ...prev, [key]: o })),
      setValue: cb => {
        if (shared) {
          setFormData(prev => ({
            ...prev,
            shared: {
              ...prev.shared,
              [key]: cb(prev.shared[key])
            }
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            [key]: cb(prev[key])
          }));
        }
      }
    };
  };

  // simple text‑input for shared fields
  const sharedInput = (key, placeholder) => (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={formData.shared[key]}
      onChangeText={text =>
        setFormData(prev => ({
          ...prev,
          shared: { ...prev.shared, [key]: text }
        }))
      }
    />
  );

  // render each step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.header}>How are you using the app?</Text>
            {['uno','duo','group'].map((t,i) => (
              <TouchableOpacity
                key={t}
                style={[styles.card, formData.profileType===t && styles.selectedCard]}
                onPress={() => handleSelect(t)}
              >
                <Text style={styles.emoji}>{['🧍','🧑‍🤝‍🧑','👯'][i]}</Text>
                <Text style={styles.text}>{['Uno','Duo','Group'][i]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      // UNO‑only steps
      case 2:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.header}>Select Ethnicity</Text>
            <DropDownPicker {...dropdownProps('ethnicity', ethnicityOptions, true)} />
          </View>
        );
      case 3:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.header}>Select Gender</Text>
            <DropDownPicker {...dropdownProps('gender', [
              { label:'Male',value:'male'},
              { label:'Female',value:'female'},
              { label:'Non‑binary',value:'non-binary'},
              { label:'Other',value:'other'},
            ])} />
          </View>
        );
      case 4:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.header}>Select Interests</Text>
            <DropDownPicker {...dropdownProps('interests', interestsOptions, true)} />
          </View>
        );
      case 5:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.header}>Select Past Activities</Text>
            <DropDownPicker {...dropdownProps('pastActivities', pastActivitiesOptions, true)} />
          </View>
        );
      case 6:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.header}>Select Personality</Text>
            <DropDownPicker {...dropdownProps('personality', personalityOptions, true)} />
          </View>
        );
      case 7:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.header}>Social Media Usage: {formData.socialMediaUse}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={formData.socialMediaUse}
              onValueChange={v => setFormData(prev => ({ ...prev, socialMediaUse: v }))}
            />
          </View>
        );
      case 8:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.header}>Select Occupation</Text>
            <DropDownPicker {...dropdownProps('occupation', occupationOptions, true)} />
          </View>
        );

      // Shared “duo/group” steps
      case 9:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.header}>Shared Bio</Text>
            {sharedInput('bio','Enter bio')}
          </View>
        );
      case 10:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.header}>Shared Location</Text>
            {sharedInput('location','Enter location')}
          </View>
        );
      case 11:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.header}>Looking For</Text>
            {sharedInput('lookingFor','Enter what you’re looking for')}
          </View>
        );
      case 12:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.header}>Shared Interests</Text>
            <DropDownPicker {...dropdownProps('interests', interestsOptions, true, true)} />
          </View>
        );
      case 13:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.header}>Shared Past Activities</Text>
            <DropDownPicker {...dropdownProps('pastActivities', pastActivitiesOptions, true, true)} />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContentContainer}>
          {renderStep()}
        </ScrollView>
        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegistrationFlow;

const styles = StyleSheet.create({
  safeArea:{ flex:1, backgroundColor:'#fff' },
  scrollContentContainer:{ padding:20 },
  contentContainer:{ marginTop:20 },
  header:{ fontSize:24, fontWeight:'600', textAlign:'center', marginBottom:20 },
  card:{ padding:20, backgroundColor:'#eee', borderRadius:10, marginBottom:15, alignItems:'center' },
  selectedCard:{ backgroundColor:'#c33' },
  emoji:{ fontSize:36, marginBottom:10 },
  text:{ fontSize:16 },
  input:{ borderWidth:1, borderColor:'#ddd', borderRadius:6, padding:12, marginBottom:20 },
  dropdown:{ borderColor:'#ddd', borderRadius:6, marginBottom:20 },
  dropdownContainer:{ borderColor:'#ddd', borderRadius:6 },
  slider:{ width:'100%', height:40, marginBottom:20 },
  buttonContainer:{ flexDirection:'row', padding:20, justifyContent:'space-between' },
  backButton:{ flex:1, backgroundColor:'#ddd', padding:15, borderRadius:6, marginRight:10 },
  nextButton:{ flex:1, backgroundColor:'#c33', padding:15, borderRadius:6 },
  buttonText:{ color:'#fff', textAlign:'center', fontWeight:'600' },
});