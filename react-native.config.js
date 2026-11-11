// Keep React Native autolinking consistent with Expo's native exclusion.
// No dependency files or installed packages are modified.
const appConfig = require('./app.json');

module.exports = {
  dependencies: appConfig.expo.extra?.voiceInputMode === 'keyboard'
    ? {
        'expo-speech-recognition': {
          platforms: { android: null, ios: null },
        },
      }
    : {},
};
