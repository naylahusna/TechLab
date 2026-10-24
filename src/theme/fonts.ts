import type { FontFamilyDefinition } from 'expo-font';

import { typography } from './tokens';

/** All weights load together under one family before the app renders. */
export const appFonts: FontFamilyDefinition[] = [
  {
    fontFamily: typography.family,
    fontDefinitions: [
      { path: require('../../assets/fonts/Nunito-Regular.ttf'), weight: 400 },
      { path: require('../../assets/fonts/Nunito-SemiBold.ttf'), weight: 600 },
      { path: require('../../assets/fonts/Nunito-Bold.ttf'), weight: 700 },
      { path: require('../../assets/fonts/Nunito-ExtraBold.ttf'), weight: 800 },
    ],
  },
];
