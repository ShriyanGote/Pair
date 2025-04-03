// navigation/DuoStack.ts

import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type DuoStackParamList = {
  DuoProfileSetup: undefined;
  AddDuoMember: {
    step: number;
    sharedData: {
      location: string;
      interests: string;
      lookingFor: string;
    };
  };
};

export type DuoStackProps<T extends keyof DuoStackParamList> = NativeStackScreenProps<DuoStackParamList, T>;
