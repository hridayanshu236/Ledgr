import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { askQuestion } from "../lib/api";

interface Props {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

interface Message {
  role: "user" | "bot";
  content: string;
}

export default function QueryScreen({ messages, setMessages }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    const text = query.trim();
    if (!text || loading) return;

    setQuery("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      // Pass the previous messages (excluding the very first greeting if you prefer, but passing all is fine)
      const historyToSend = messages.filter(m => m.role !== "bot" || m.content !== "Hello! You can ask me questions about your spending, like 'How much did I spend on dining this month?' or 'Where did I buy filter coffee?'.");
      const answer = await askQuestion(text, historyToSend);
      setMessages((prev) => [...prev, { role: "bot", content: answer }]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "Sorry, I had trouble answering that. Make sure the backend is running.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Text style={styles.heading}>Ledgr AI</Text>
      </View>

      <ScrollView
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
      >
        {messages.map((m, i) => (
          <View
            key={i}
            style={[
              styles.messageBubble,
              m.role === "user" ? styles.userBubble : styles.botBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                m.role === "user" ? styles.userText : styles.botText,
              ]}
            >
              {m.content}
            </Text>
          </View>
        ))}
        {loading && (
          <View style={[styles.messageBubble, styles.botBubble]}>
            <ActivityIndicator size="small" color="#6C63FF" />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Ask a question..."
          placeholderTextColor="#888"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !query.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!query.trim() || loading}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A3E",
  },
  heading: { fontSize: 20, fontWeight: "700", color: "#E8E8F0" },
  chatArea: { flex: 1 },
  chatContent: { padding: 16, gap: 12, paddingBottom: 24 },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: "80%",
  },
  userBubble: {
    backgroundColor: "#6C63FF",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: "#1C1C2E",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#2A2A3E",
  },
  messageText: { fontSize: 15, lineHeight: 22 },
  userText: { color: "#FFF" },
  botText: { color: "#E8E8F0" },
  inputArea: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#1C1C2E",
    borderTopWidth: 1,
    borderTopColor: "#2A2A3E",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#0F0F1A",
    color: "#E8E8F0",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#2A2A3E",
  },
  sendBtn: {
    backgroundColor: "#6C63FF",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sendBtnDisabled: {
    backgroundColor: "#2A2A3E",
  },
  sendText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
