// Build-time config plugin only. Never installs packages or edits dependencies.
// Keyboard mode excludes the speech package from generated native projects.
// System mode retains the original dependency compatibility guard.
const speechPackage = 'expo-speech-recognition';
const marker = 'keyboard-dictation-exclusion';

function patchAndroidAutolinking(contents) {
  // Regeneration and repeated prebuilds must not duplicate the exclusion.
  const clean = contents.replace(/^[ \t]*\/\/ @generated begin keyboard-dictation-exclusion\r?\n[\s\S]*?^[ \t]*\/\/ @generated end keyboard-dictation-exclusion\r?\n/gm, '');
  const modern = /^([ \t]*)expoAutolinking\.useExpoModules\(\)[ \t]*\r?$/m;
  if (modern.test(clean)) {
    return clean.replace(modern, (_line, indent) => [
      `${indent}// @generated begin ${marker}`,
      // SDK 53 passes a list of exclusions as one CLI argument. A single
      // package name avoids that SDK's multi-package exclusion bug.
      `${indent}if ((expoAutolinking.exclude ?: []).any { it != "${speechPackage}" }) {`,
      `${indent}  throw new GradleException("Keyboard speech bypass requires a single Expo exclusion on SDK 53; preserve and review other exclusions before building.")`,
      `${indent}}`,
      `${indent}expoAutolinking.exclude = ["${speechPackage}"]`,
      `${indent}// @generated end ${marker}`,
      `${indent}expoAutolinking.useExpoModules()`,
    ].join('\n'));
  }
  // Older Expo templates use the Groovy helper rather than the settings plugin.
  const legacyPatched = `useExpoModules([exclude: ["${speechPackage}"]]) // ${marker}`;
  if (clean.includes(legacyPatched)) return clean;
  const legacy = /^([ \t]*)useExpoModules\(\)[ \t]*\r?$/m;
  if (legacy.test(clean)) {
    return clean.replace(legacy, (_line, indent) => `${indent}${legacyPatched}`);
  }
  throw new Error('Nie można bezpiecznie wykluczyć modułu mowy: nieznany układ android/settings.gradle. Przerwano prebuild zamiast dopuścić wadliwy moduł do kompilacji.');
}

function patchIosAutolinking(contents) {
  const replacement = `use_expo_modules!(:exclude => ['${speechPackage}']) # ${marker}`;
  if (contents.includes(replacement)) return contents;
  const pattern = /^([ \t]*)use_expo_modules![ \t]*\r?$/m;
  if (!pattern.test(contents)) {
    throw new Error('Nie można bezpiecznie wykluczyć modułu mowy: nieznany układ ios/Podfile. Przerwano prebuild.');
  }
  return contents.replace(pattern, (_line, indent) => `${indent}${replacement}`);
}

module.exports = function withSpeechCompatibility(config) {
  const { withDangerousMod, withSettingsGradle, withPodfile } = require('@expo/config-plugins');
  if (config.extra?.voiceInputMode === 'keyboard') {
    config = withSettingsGradle(config, modConfig => {
      modConfig.modResults.contents = patchAndroidAutolinking(modConfig.modResults.contents);
      console.log('[withSpeechCompatibility] Tryb klawiatury: expo-speech-recognition wykluczony z autolinkowania Android.');
      return modConfig;
    });
    return withPodfile(config, modConfig => {
      modConfig.modResults.contents = patchIosAutolinking(modConfig.modResults.contents);
      console.log('[withSpeechCompatibility] Tryb klawiatury: expo-speech-recognition wykluczony z autolinkowania iOS.');
      return modConfig;
    });
  }

  const validate = async modConfig => {
    const root = modConfig.modRequest.projectRoot;
    const packageVersion = name => {
      const file = require.resolve(`${name}/package.json`, { paths: [root] });
      return require(file).version;
    };
    const expoVersion = packageVersion('expo');
    const speechVersion = packageVersion(speechPackage);
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
  return withDangerousMod(withDangerousMod(config, ['android', validate]), ['ios', validate]);
};

// Pure transforms are exposed for local fixture tests without running prebuild.
module.exports.patchAndroidAutolinking = patchAndroidAutolinking;
module.exports.patchIosAutolinking = patchIosAutolinking;
