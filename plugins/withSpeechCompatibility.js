// Build-time config plugin only: no network requests, installs or package edits.
// Stop incompatible dependencies BEFORE spending time compiling Android/Kotlin.
module.exports = function withSpeechCompatibility(config) {
  const { withDangerousMod } = require('@expo/config-plugins');
  const validate = async modConfig => {
    const root = modConfig.modRequest.projectRoot;
    const packageVersion = name => {
      const file = require.resolve(`${name}/package.json`, { paths: [root] });
      return require(file).version;
    };
    const expoVersion = packageVersion('expo');
    const speechVersion = packageVersion('expo-speech-recognition');
    const sdk = Number(expoVersion.split('.')[0]);
    const speechMajor = Number(speechVersion.split('.')[0]);
    const expected = { 50: 0, 51: 0, 52: 1, 53: 2, 54: 3, 55: 3 }[sdk];
    const compatible = expected === undefined ? sdk < 56 || speechMajor === sdk : speechMajor === expected;
    if (!compatible) {
      const release = sdk === 53 ? '2.1.5' : sdk >= 56 ? `^${sdk}.0.0` : `sdk-${sdk}`;
      throw new Error(`Niezgodne zależności mowy: Expo ${expoVersion}, expo-speech-recognition ${speechVersion}. Przerwano przed kompilacją Kotlin. Dla SDK ${sdk} zainstaluj właściwą wersję: npm install --save-exact expo-speech-recognition@${release}. Sama zmiana konfiguracji nie zmienia zainstalowanej wersji pakietu.`);
    }
    return modConfig;
  };
  // Mods run only during native prebuild, never in browser Live Preview.
  return withDangerousMod(withDangerousMod(config, ['android', validate]), ['ios', validate]);
};
