import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { login, register } from "../lib/api";

export default function AuthScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    try {
      setLoading(true);
      if (isLogin) {
        const token = await login(email, password);
        onLogin(token);
      } else {
        await register(email, password);
        Alert.alert("Success", "Account created! Please log in.");
        setIsLogin(true);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e.message || "An error occurred";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Ledgr</Text>
        <Text style={styles.subtitle}>
          {isLogin ? "Welcome back." : "Create your account."}
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor="#555"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#555"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>{isLogin ? "Log In" : "Sign Up"}</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchBtn}>
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A" },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  title: { fontSize: 42, fontWeight: "800", color: "#6C63FF", marginBottom: 8 },
  subtitle: { fontSize: 18, color: "#888", marginBottom: 40 },
  form: { backgroundColor: "#1C1C2E", padding: 24, borderRadius: 16 },
  label: { fontSize: 12, color: "#888", textTransform: "uppercase", marginBottom: 8, letterSpacing: 0.5 },
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
  button: {
    backgroundColor: "#6C63FF",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  switchBtn: { marginTop: 24, alignItems: "center" },
  switchText: { color: "#888", fontSize: 14 },
});
