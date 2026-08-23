import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getUserSettings, updateUserSettings } from "../lib/api";

export default function SettingsScreen({ onLogout }: { onLogout: () => void }) {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const user = await getUserSettings();
        if (user.api_key) {
          setApiKey(user.api_key);
        }
      } catch (e: any) {
        Alert.alert("Error", "Could not load settings.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave() {
    try {
      setSaving(true);
      await updateUserSettings({ api_key: apiKey });
      Alert.alert("Success", "Settings saved successfully.");
    } catch (e: any) {
      Alert.alert("Error", "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Settings</Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#6C63FF" />
      ) : (
        <View style={styles.card}>
          <Text style={styles.label}>Gemini API Key</Text>
          <Text style={styles.description}>
            Ledgr uses Google's Gemini AI to parse receipts and answer your financial queries. 
            Please enter your personal API key. It will be stored securely on the server.
          </Text>
          <TextInput
            style={styles.input}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="AIzaSy..."
            placeholderTextColor="#555"
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.disabledBtn]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveBtnText}>Save API Key</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A", padding: 24, paddingTop: 60 },
  heading: { fontSize: 28, fontWeight: "700", color: "#E8E8F0", marginBottom: 24 },
  card: { backgroundColor: "#1C1C2E", padding: 20, borderRadius: 16 },
  label: { fontSize: 16, fontWeight: "600", color: "#E8E8F0", marginBottom: 8 },
  description: { fontSize: 13, color: "#888", marginBottom: 20, lineHeight: 20 },
  input: {
    backgroundColor: "#0F0F1A",
    borderWidth: 1,
    borderColor: "#2A2A3E",
    borderRadius: 8,
    color: "#FFF",
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  saveBtn: {
    backgroundColor: "#6C63FF",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledBtn: { opacity: 0.7 },
  saveBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  logoutBtn: {
    marginTop: 40,
    padding: 16,
    backgroundColor: "rgba(255, 69, 58, 0.1)",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 69, 58, 0.3)",
  },
  logoutText: { color: "#FF453A", fontWeight: "600", fontSize: 16 },
});
