// RegistrationFlow.js

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

const RegistrationFlow = () => {
  const navigation = useNavigation();
  const { setRegistrationData } = useContext(RegistrationContext);
  const [currentStep, setCurrentStep] = useState(1);
  const [openDropdowns, setOpenDropdowns] = useState({});

  const [formData, setFormData] = useState({
    profileType: '',
    ethnicity: null,
    gender: null,
    interests: [],
    pastActivities: [],
    personality: [],
    socialMediaUse: 5,
    occupation: '',
    shared: { bio: '', location: '', lookingFor: '', interests: [], pastActivities: [] },
  });

  const isUno = formData.profileType === 'uno';
  const isShared = formData.profileType === 'duo' || formData.profileType === 'group';
  const totalSteps = isUno ? 8 : 13;

  useEffect(() => {
    if (formData.profileType) {
      setCurrentStep(2);
      handleNext();
    }
  }, [formData.profileType]);

  const handleSelect = (type) => {
    setFormData((prev) => ({ ...prev, profileType: type }));
  };

  const handleGoHome = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const handleNext = () => {
    const skipSteps = {
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

    let nextStep = currentStep + 1;
    while (skipSteps[nextStep]) nextStep++;

    if (nextStep <= totalSteps) {
      setCurrentStep(nextStep);
    } else {
      let payload = {
        profile_type: formData.profileType,
        ethnicity: formData.ethnicity,
        gender: formData.gender,
        interests: formData.interests,
        past_activities: formData.pastActivities,
        personality: formData.personality,
        social_media_use: formData.socialMediaUse,
        occupation: formData.occupation,
        ...(isShared && formData.shared),
      };
      setRegistrationData(formData);
      navigation.navigate('Register', { allFields: payload });
    }
  };

  const handleBack = () => {
    const skipSteps = {
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

    let prevStep = currentStep - 1;
    while (skipSteps[prevStep] && prevStep > 1) prevStep--;
    if (prevStep >= 1) setCurrentStep(prevStep);
  };

  const dropdownProps = (fieldKey, items, multiple = false, isSharedField = false) => {
    const value = isSharedField ? formData.shared[fieldKey] : formData[fieldKey];
    return {
      open: openDropdowns[fieldKey] || false,
      value,
      items,
      setOpen: (open) => setOpenDropdowns((prev) => ({ ...prev, [fieldKey]: open })),
      setValue: (callback) => {
        if (isSharedField) {
          setFormData((prev) => ({
            ...prev,
            shared: { ...prev.shared, [fieldKey]: callback(prev.shared[fieldKey]) },
          }));
        } else {
          setFormData((prev) => ({ ...prev, [fieldKey]: callback(prev[fieldKey]) }));
        }
      },
      multiple,
      mode: multiple ? 'BADGE' : 'SIMPLE',
      style: styles.dropdown,
      dropDownContainerStyle: styles.dropdownContainer,
      listMode: 'MODAL',
      searchable: true,
      placeholder: `Select ${fieldKey}...`,
    };
  };

  const renderStep = () => {
    const sharedInput = (key, placeholder) => (
      <TextInput
        style={styles.input}
        value={formData.shared[key]}
        onChangeText={(text) =>
          setFormData((prev) => ({ ...prev, shared: { ...prev.shared, [key]: text } }))
        }
        placeholder={placeholder}
      />
    );
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.contentContainer}>
            <TouchableOpacity onPress={handleGoHome}>
              <Text style={styles.link}>Go Home</Text>
            </TouchableOpacity>
            <Text style={styles.header}>How are you using the app?</Text>
            {['uno', 'duo', 'group'].map((type, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.card, formData.profileType === type && styles.selectedCard]}
                onPress={() => handleSelect(type)}
              >
                <Text style={styles.emoji}>{['🧍', '🧑‍🤝‍🧑', '👯'][i]}</Text>
                <Text style={styles.text}>{['Uno (Solo)', 'Duo (Couple)', 'Group (3+ People)'][i]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 2:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.header}>Select Ethnicity</Text>
            <DropDownPicker
              {...dropdownProps('ethnicity', [
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
              ])}
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.header}>Select Gender</Text>
            <DropDownPicker
              {...dropdownProps('gender', [
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Non-binary', value: 'non-binary' },
                { label: 'Other', value: 'other' },
              ])}
            />
          </View>
        );

      case 4:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.header}>Select Interests</Text>
            <DropDownPicker
              {...dropdownProps(
                'interests',
                [
                  { label: 'Movies & TV', value: 'movies_tv' },
                  { label: 'Gaming', value: 'gaming' },
                  { label: 'Photography', value: 'photography' },
                  { label: 'Fashion', value: 'fashion' },
                  { label: 'Writing', value: 'writing' },
                  { label: 'Nature', value: 'nature' },
                  { label: 'Animals', value: 'animals' },
                  { label: 'Volunteering', value: 'volunteering' },
                  { label: 'History', value: 'history' },
                  { label: 'Science', value: 'science' },
                  { label: 'Cars & Motorcycles', value: 'cars_motorcycles' },
                  { label: 'Podcasts', value: 'podcasts' },
                  { label: 'Crafts & DIY', value: 'crafts_diy' },
                  { label: 'Spirituality', value: 'spirituality' },
                  { label: 'Board Games', value: 'board_games' },
                  { label: 'Languages', value: 'languages' },
                  { label: 'Politics', value: 'politics' },
                  { label: 'Comedy', value: 'comedy' },
                  { label: 'Entrepreneurship', value: 'entrepreneurship' },
                  { label: 'Collecting', value: 'collecting' },
                ],
                true  // multiple selection
              )}
            />
          </View>
        );

      case 5:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.header}>Select Past Activities</Text>
            <DropDownPicker
              {...dropdownProps(
                'pastActivities',
                [
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
                ],
                true  // multiple selection
              )}
            />
          </View>
        );

      case 6:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.header}>Select Personality</Text>
            <DropDownPicker
              {...dropdownProps(
                'personality',
                [
                  { label: 'Curious', value: 'Curious' },
                  { label: 'Empathetic', value: 'Empathetic' },
                  { label: 'Adventurous', value: 'Adventurous' },
                  { label: 'Thoughtful', value: 'Thoughtful' },
                  { label: 'Creative', value: 'Creative' },
                  { label: 'Analytical', value: 'Analytical' },
                  { label: 'Spontaneous', value: 'Spontaneous' },
                  { label: 'Organized', value: 'Organized' },
                  { label: 'Playful', value: 'Playful' },
                  { label: 'Calm', value: 'Calm' },
                  { label: 'Driven', value: 'Driven' },
                  { label: 'Loyal', value: 'Loyal' },
                  { label: 'Independent', value: 'Independent' },
                  { label: 'Funny', value: 'Funny' },
                  { label: 'Romantic', value: 'Romantic' },
                  { label: 'Open-Minded', value: 'Open-Minded' },
                  { label: 'Optimistic', value: 'Optimistic' },
                  { label: 'Realistic', value: 'Realistic' },
                  { label: 'Cautious', value: 'Cautious' },
                  { label: 'Chill', value: 'Chill' },
                ],
                true  // multiple selection
              )}
            />
          </View>
        );

      case 7:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.header}>Social Media Usage</Text>
            <Text style={styles.sliderValue}>{formData.socialMediaUse}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={formData.socialMediaUse}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, socialMediaUse: value }))
              }
            />
          </View>
        );
        case 8:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.header}>Input Occupation Field</Text>
            <DropDownPicker
              {...dropdownProps(
                'occupation',
                [
                  { label: 'Technology', value: 'technology' },
                  { label: 'Healthcare & Medicine', value: 'healthcare_medicine' },
                  { label: 'Education', value: 'education' },
                  { label: 'Finance & Accounting', value: 'finance_accounting' },
                  { label: 'Arts & Entertainment', value: 'arts_entertainment' },
                  { label: 'Engineering', value: 'engineering' },
                  { label: 'Law & Government', value: 'law_government' },
                  { label: 'Marketing & Advertising', value: 'marketing_advertising' },
                  { label: 'Retail & Sales', value: 'retail_sales' },
                  { label: 'Science & Research', value: 'science_research' },
                  { label: 'Hospitality & Tourism', value: 'hospitality_tourism' },
                  { label: 'Construction & Trade', value: 'construction_trade' },
                  { label: 'Transportation & Logistics', value: 'transportation_logistics' },
                  { label: 'Non-Profit & Advocacy', value: 'nonprofit_advocacy' },
                  { label: 'Media & Communication', value: 'media_communication' },
                  { label: 'Real Estate', value: 'real_estate' },
                  { label: 'Sports & Recreation', value: 'sports_recreation' },
                  { label: 'Business & Entrepreneurship', value: 'business_entrepreneurship' },
                  { label: 'Agriculture & Environment', value: 'agriculture_environment' },
                  { label: 'Other', value: 'other' },
                ],
                true  // multiple selection
              )}
            />
          </View>
        );
        case 9:
          return <View style={styles.contentContainer}><Text style={styles.header}>Shared Bio</Text>{sharedInput('bio', 'Enter bio')}</View>;
        case 10:
          return <View style={styles.contentContainer}><Text style={styles.header}>Shared Location</Text>{sharedInput('location', 'Enter location')}</View>;
        case 11:
          return <View style={styles.contentContainer}><Text style={styles.header}>Shared Looking For</Text>{sharedInput('lookingFor', 'Enter preference')}</View>;
        case 12:
          return (
            <View style={styles.contentContainer}>
              <Text style={styles.header}>Shared Interests</Text>
              <DropDownPicker {...dropdownProps('interests',
                [
                  { label: 'Movies & TV', value: 'movies_tv' },
                  { label: 'Gaming', value: 'gaming' },
                  { label: 'Photography', value: 'photography' },
                  { label: 'Fashion', value: 'fashion' },
                  { label: 'Writing', value: 'writing' },
                  { label: 'Nature', value: 'nature' },
                  { label: 'Animals', value: 'animals' },
                  { label: 'Volunteering', value: 'volunteering' },
                  { label: 'History', value: 'history' },
                  { label: 'Science', value: 'science' },
                  { label: 'Cars & Motorcycles', value: 'cars_motorcycles' },
                  { label: 'Podcasts', value: 'podcasts' },
                  { label: 'Crafts & DIY', value: 'crafts_diy' },
                  { label: 'Spirituality', value: 'spirituality' },
                  { label: 'Board Games', value: 'board_games' },
                  { label: 'Languages', value: 'languages' },
                  { label: 'Politics', value: 'politics' },
                  { label: 'Comedy', value: 'comedy' },
                  { label: 'Entrepreneurship', value: 'entrepreneurship' },
                  { label: 'Collecting', value: 'collecting' },
                ], true, true)} />
            </View>
          );
        case 13:
          return (
            <View style={styles.contentContainer}>
              <Text style={styles.header}>Shared Past Activities</Text>
              <DropDownPicker {...dropdownProps('pastActivities',
                [
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
                ], true, true)} />
            </View>
          );

        default:
          return <Text style={styles.text}>Add other steps here...</Text>;
      }
    };
  
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContentContainer}
            bounces={false}
          >
            {renderStep()}
          </ScrollView>
  
          <View style={styles.buttonContainer}>
            {currentStep > 1 && (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.buttonText}>Back</Text>
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
    safeArea: { flex: 1, backgroundColor: '#fff' },
    scrollView: { flex: 1, backgroundColor: '#fff' },
    scrollContentContainer: { paddingHorizontal: 20, paddingBottom: 50 },
    contentContainer: { marginTop: 20 },
    header: { fontSize: 24, fontWeight: '600', textAlign: 'center', marginBottom: 30 },
    card: { padding: 20, borderRadius: 10, backgroundColor: '#f2f2f2', marginBottom: 20, alignItems: 'center' },
    selectedCard: { backgroundColor: '#DB4437' },
    emoji: { fontSize: 40, marginBottom: 10 },
    text: { fontSize: 16, fontWeight: '500' },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, fontSize: 16, marginBottom: 20 },
    link: { color: 'gray', fontSize: 14, textAlign: 'center', marginBottom: 20 },
    dropdown: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
    dropdownContainer: { borderWidth: 1, borderColor: '#ddd' },
    buttonContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 30, paddingTop: 10, backgroundColor: '#fff' },
    backButton: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 8, marginRight: 10, borderWidth: 1, borderColor: '#ddd' },
    nextButton: { flex: 1, backgroundColor: '#DB4437', padding: 15, borderRadius: 8, marginLeft: 10 },
    buttonText: { textAlign: 'center', color: '#000', fontSize: 16, fontWeight: '500' },
  });
  