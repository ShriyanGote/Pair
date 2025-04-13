// import React, { createContext, useState } from 'react';

// // Create the context
// export const RegistrationContext = createContext({
//   registrationData: {},
//   setRegistrationData: () => {},
// });

// // Create a provider component
// export const RegistrationProvider = ({ children }) => {
//   const [registrationData, setRegistrationData] = useState({
//     profileType: '',
//     ethnicity: null,
//     gender: null,
//     interests: [],
//     pastActivities: [],
//     personality: null,
//     experience: 5,
//     socialMediaUse: 5,
//     occupation: '',
//     name: '',
//     email: '',
//     password: '',
//   });

//   return (
//     <RegistrationContext.Provider value={{ registrationData, setRegistrationData }}>
//       {children}
//     </RegistrationContext.Provider>
//   );
// }; 