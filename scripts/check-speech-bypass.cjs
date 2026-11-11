// Local configuration/fixture checks only: no APK build, AI or network requests.
// Run after export: node scripts/check-speech-bypass.cjs
// Optional generated-file checks: node scripts/check-speech-bypass.cjs --verify-native
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const appConfig = require('../app.json');
const rnConfig = require('../react-native.config.js');
const { patchAndroidAutolinking, patchIosAutolinking } = require('../plugins/withSpeechCompatibility');
const speechPackage = 'expo-speech-recognition';

assert.equal(appConfig.expo.extra.voiceInputMode, 'keyboard');
assert.equal(appConfig.expo.plugins.includes('./plugins/withSpeechCompatibility'), true);
assert.equal(appConfig.expo.plugins.some(plugin => (Array.isArray(plugin) ? plugin[0] : plugin) === speechPackage), false);
assert.equal(rnConfig.dependencies[speechPackage].platforms.android, null);
assert.equal(rnConfig.dependencies[speechPackage].platforms.ios, null);

const android = [
  'pluginManagement { /* existing plugin settings */ }',
  'plugins { id("expo-autolinking-settings") }',
  'expoAutolinking.useExpoModules()',
  'rootProject.name = "KosztorysMechanika"',
  'include ":app"',
  '',
].join('\n');
const patchedAndroid = patchAndroidAutolinking(android);
assert.match(patchedAndroid, /expoAutolinking\.exclude = \["expo-speech-recognition"\]/);
assert.match(patchedAndroid, /expoAutolinking\.useExpoModules\(\)/);
assert.match(patchedAndroid, /existing plugin settings/);
assert.match(patchedAndroid, /rootProject.name = "KosztorysMechanika"/);
assert.equal(patchAndroidAutolinking(patchedAndroid), patchedAndroid, 'Android transform must be idempotent');
assert.equal((patchedAndroid.match(/@generated begin keyboard-dictation-exclusion/g) || []).length, 1);
assert.equal(patchAndroidAutolinking(patchAndroidAutolinking(android.replace(/\n/g, '\r\n'))), patchAndroidAutolinking(android.replace(/\n/g, '\r\n')));
assert.throws(() => patchAndroidAutolinking('unknown template'), /nieznany układ/);

const legacy = 'rootProject.name = "Mechanik"\nuseExpoModules()\ninclude ":app"\n';
const patchedLegacy = patchAndroidAutolinking(legacy);
assert.match(patchedLegacy, /useExpoModules\(\[exclude:/);
assert.equal(patchAndroidAutolinking(patchedLegacy), patchedLegacy);

const ios = "platform :ios, '15.1'\ntarget 'Mechanik' do\n  use_expo_modules!\n  use_native_modules!(config_command)\nend\n";
const patchedIos = patchIosAutolinking(ios);
assert.match(patchedIos, /use_expo_modules!\(:exclude => \['expo-speech-recognition'\]\)/);
assert.match(patchedIos, /use_native_modules!\(config_command\)/);
assert.equal(patchIosAutolinking(patchedIos), patchedIos, 'iOS transform must be idempotent');
assert.equal(patchIosAutolinking(patchIosAutolinking(ios.replace(/\n/g, '\r\n'))), patchIosAutolinking(ios.replace(/\n/g, '\r\n')));
assert.throws(() => patchIosAutolinking('unknown template'), /nieznany układ/);

const nativeService = fs.readFileSync(path.join(root, 'services/systemSpeech.ts'), 'utf8');
assert.doesNotMatch(nativeService, /requireOptionalNativeModule|requireNativeModule|typeof import\('expo-speech-recognition'\)/);
assert.match(nativeService, /available: false/);
assert.match(fs.readFileSync(path.join(root, 'constants/voice.ts'), 'utf8'), /appConfig\.expo\.extra\.voiceInputMode/);

if (process.argv.includes('--verify-native')) {
  const settingsFile = path.join(root, 'android/settings.gradle');
  assert.equal(fs.existsSync(settingsFile), true, 'Generate the native project first; this script does not run prebuild.');
  const generatedAndroid = fs.readFileSync(settingsFile, 'utf8');
  assert.match(generatedAndroid, /keyboard-dictation-exclusion/);
  assert.equal(patchAndroidAutolinking(generatedAndroid), generatedAndroid, 'Generated settings.gradle is missing the current bypass');
  const podfile = path.join(root, 'ios/Podfile');
  if (fs.existsSync(podfile)) {
    const generatedIos = fs.readFileSync(podfile, 'utf8');
    assert.equal(patchIosAutolinking(generatedIos), generatedIos, 'Generated Podfile is missing the current bypass');
  }
}
console.log('OK: keyboard mode, retained plugin, native exclusions and idempotent fixture transforms.');
console.log('Not verified: installed dependency versions, actual Gradle module resolution, Kotlin compilation, APK or device dictation.');
