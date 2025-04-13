import React, { createContext, useState } from 'react';

// Define a TypeScript type for your registration data
type RegistrationData = {
  profileType?: string;
  ethnicity?: string | null;
  gender?: string | null;
  interests?: string[]; 
  pastActivities?: string[];
  personality?: string | null;
  experience?: number;
  socialMediaUse?: number;
  occupation?: string;
  name?: string;
  email?: string;
  password?: string;
  // etc. if more fields
};

// Define a context interface
interface RegistrationContextType {
  registrationData: RegistrationData;
  setRegistrationData: React.Dispatch<React.SetStateAction<RegistrationData>>;
}

// Create the context
export const RegistrationContext = createContext<RegistrationContextType>({
  registrationData: {},
  setRegistrationData: () => {},
});

// Create a provider component
export const RegistrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    profileType: '',
    ethnicity: null,
    gender: null,
    interests: [],
    pastActivities: [],
    personality: null,
    experience: 5,
    socialMediaUse: 5,
    occupation: '',
    name: '',
    email: '',
    password: '',
  });

  return (
    <RegistrationContext.Provider value={{ registrationData, setRegistrationData }}>
      {children}
    </RegistrationContext.Provider>
  );
};