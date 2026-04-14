import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, StatusBar, Switch
} from 'react-native';
import * as Speech from 'expo-speech';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_URL      = 'http://10.0.2.2:8080/darija-translator/api/translate'; // Android emulator
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin123';

const LANGUAGES = ['English','French','Spanish','Arabic (Modern Standard)','German','Italian'];

export default function App() {
  const [inputText,   setInputText]   = useState('');
  const [outputText,  setOutputText]  = useState('');
  const [sourceLang,  setSourceLang]  = useState('English');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [showSettings,setShowSettings]= useState(false);
  const [serverUrl,   setServerUrl]   = useState(DEFAULT_URL);
  const [username,    setUsername]    = useState(DEFAULT_USERNAME);
  const [password,    setPassword]    = useState(DEFAULT_PASSWORD);
  const [isSpeaking,  setIsSpeaking]  = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    AsyncStorage.multiGet(['serverUrl','username','password']).then(pairs => {
      const map = Object.fromEntries(pairs.map(([k,v]) => [k, v]));
      if (map.serverUrl) setServerUrl(map.serverUrl);
      if (map.username)  setUsername(map.username);
      if (map.password)  setPassword(map.password);
    });
  }, []);

  const saveSettings = async () => {
    await AsyncStorage.multiSet([
      ['serverUrl', serverUrl],
      ['username',  username],
      ['password',  password],
    ]);
    setShowSettings(false);
    Alert.alert('Saved', 'Settings saved successfully.');
  };

  const translate = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to translate.');
      return;
    }
    setLoading(true);
    setError('');
    setOutputText('');

    const credentials = btoa(`${username}:${password}`);
    try {
      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({ text: inputText.trim(), sourceLanguage: sourceLang }),
      });

      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        setError(data.errorMessage || `Server error: ${response.status}`);
      } else {
        setOutputText(data.translatedText || '');
      }
    } catch (e) {
      setError(`Network error: ${e.message}\n\nMake sure the server is running and the URL is correct.`);
    } finally {
      setLoading(false);
    }
  };

  const speakDarija = () => {
    if (!outputText) return;
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    setIsSpeaking(true);
    Speech.speak(outputText, {
      language: 'ar',
      rate: 0.85,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const copyToClipboard = async () => {
    if (!outputText) return;
    await Clipboard.setStringAsync(outputText);
    Alert.alert('Copied', 'Translation copied to clipboard.');
  };

  const clearAll = () => {
    setInputText('');
    setOutputText('');
    setError('');
    Speech.stop();
    setIsSpeaking(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar backgroundColor="#2d6a4f" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🇲🇦 Darija Translator</Text>
        <Text style={styles.headerSub}>English → Moroccan Arabic Dialect</Text>
        <TouchableOpacity onPress={() => setShowSettings(!showSettings)} style={styles.settingsBtn}>
          <Text style={styles.settingsBtnText}>⚙️ Settings</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Settings Panel */}
        {showSettings && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Server Settings</Text>
            <Text style={styles.label}>REST URL</Text>
            <TextInput style={styles.input} value={serverUrl}
              onChangeText={setServerUrl} autoCapitalize="none" autoCorrect={false} />
            <Text style={styles.label}>Username</Text>
            <TextInput style={styles.input} value={username}
              onChangeText={setUsername} autoCapitalize="none" />
            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} value={password}
              onChangeText={setPassword} secureTextEntry />
            <TouchableOpacity style={styles.btnPrimary} onPress={saveSettings}>
              <Text style={styles.btnText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Source Language Picker */}
        <View style={styles.card}>
          <Text style={styles.label}>Source Language</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langRow}>
            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang}
                style={[styles.langChip, sourceLang === lang && styles.langChipActive]}
                onPress={() => setSourceLang(lang)}
              >
                <Text style={[styles.langChipText, sourceLang === lang && styles.langChipTextActive]}>
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Text to Translate</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Type or paste your text here…"
            placeholderTextColor="#a0aec0"
            multiline
            value={inputText}
            onChangeText={setInputText}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.btnPrimary, styles.flex1]} onPress={translate} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Translate ➜</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnDanger} onPress={clearAll}>
              <Text style={styles.btnText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Output */}
        {outputText ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Darija Translation (دارجة)</Text>
            <Text style={styles.resultText}>{outputText}</Text>
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btnPurple, styles.flex1]}
                onPress={speakDarija}
              >
                <Text style={styles.btnText}>{isSpeaking ? '⏹ Stop' : '🔊 Read Aloud'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnBlue} onPress={copyToClipboard}>
                <Text style={styles.btnText}>📋 Copy</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const GREEN_DARK = '#2d6a4f';
const GREEN      = '#40916c';

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f0f4f8' },
  header:       { backgroundColor: GREEN_DARK, paddingTop: 48, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle:  { color: '#fff', fontSize: 22, fontWeight: '700' },
  headerSub:    { color: '#d1fae5', fontSize: 13, marginTop: 2 },
  settingsBtn:  { marginTop: 10, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)',
                  paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  settingsBtnText: { color: '#fff', fontSize: 13 },
  scroll:       { padding: 16, paddingBottom: 40 },
  card:         { backgroundColor: '#fff', borderRadius: 14, padding: 16,
                  marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.07,
                  shadowRadius: 6, elevation: 2 },
  cardTitle:    { fontSize: 14, fontWeight: '700', color: '#2d3748', marginBottom: 10,
                  textTransform: 'uppercase', letterSpacing: 0.5 },
  label:        { fontSize: 12, fontWeight: '600', color: '#718096',
                  textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 8 },
  input:        { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8,
                  padding: 10, fontSize: 15, fontFamily: 'System', color: '#1a202c' },
  textArea:     { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 8,
                  padding: 12, fontSize: 16, minHeight: 110, textAlignVertical: 'top', color: '#1a202c' },
  resultText:   { fontSize: 20, lineHeight: 32, color: '#1a202c',
                  textAlign: 'right', writingDirection: 'rtl',
                  backgroundColor: '#f7faf9', borderRadius: 8, padding: 12, marginBottom: 10 },
  errorText:    { color: '#c53030', fontSize: 13, marginTop: 8, backgroundColor: '#fff5f5',
                  padding: 10, borderRadius: 8 },
  langRow:      { flexDirection: 'row', marginTop: 4 },
  langChip:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5,
                  borderColor: '#e2e8f0', marginRight: 8, backgroundColor: '#f7fafc' },
  langChipActive:     { backgroundColor: GREEN_DARK, borderColor: GREEN_DARK },
  langChipText:       { fontSize: 13, color: '#4a5568' },
  langChipTextActive: { color: '#fff', fontWeight: '600' },
  btnRow:       { flexDirection: 'row', gap: 10, marginTop: 10 },
  flex1:        { flex: 1 },
  btnPrimary:   { backgroundColor: GREEN_DARK, borderRadius: 10, padding: 14,
                  alignItems: 'center', justifyContent: 'center' },
  btnDanger:    { backgroundColor: '#e53e3e', borderRadius: 10, padding: 14,
                  alignItems: 'center', justifyContent: 'center', minWidth: 80 },
  btnPurple:    { backgroundColor: '#805ad5', borderRadius: 10, padding: 14,
                  alignItems: 'center', justifyContent: 'center' },
  btnBlue:      { backgroundColor: '#3182ce', borderRadius: 10, padding: 14,
                  alignItems: 'center', justifyContent: 'center', minWidth: 80 },
  btnText:      { color: '#fff', fontWeight: '700', fontSize: 14 },
});
