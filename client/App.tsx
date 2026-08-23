import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import CaptureScreen from "./screens/CaptureScreen";
import HomeScreen from "./screens/HomeScreen";
import ReviewScreen from "./screens/ReviewScreen";
import QueryScreen from "./screens/QueryScreen";
import { TransactionBatch } from "./lib/types";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Message {
  role: "user" | "bot";
  content: string;
}

type Screen = "home" | "capture" | "review" | "query";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [pendingBatch, setPendingBatch] = useState<TransactionBatch | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content: "Hello! You can ask me questions about your spending, like 'How much did I spend on dining this month?' or 'Where did I buy filter coffee?'.",
    },
  ]);

  function handleCaptureResult(batch: TransactionBatch) {
    setPendingBatch(batch);
    setScreen("review");
  }

  function handleConfirmed() {
    setPendingBatch(null);
    setScreen("home");
  }

  return (
    <View style={styles.appContainer}>
      <StatusBar style="light" />
      <View style={styles.screenContainer}>
        {screen === "home" && (
          <HomeScreen onCapture={() => setScreen("capture")} />
        )}
        {screen === "capture" && (
        <CaptureScreen
          onResult={handleCaptureResult}
          onBack={() => setScreen("home")}
        />
      )}
        {screen === "review" && pendingBatch && (
          <ReviewScreen
            batch={pendingBatch}
            onConfirmed={handleConfirmed}
            onBack={() => setScreen("capture")}
          />
        )}
        {screen === "query" && (
          <QueryScreen messages={messages} setMessages={setMessages} />
        )}
      </View>

      {(screen === "home" || screen === "query") && (
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setScreen("home")}
          >
            <Ionicons
              name={screen === "home" ? "home" : "home-outline"}
              size={24}
              color={screen === "home" ? "#6C63FF" : "#666"}
              style={styles.tabIcon}
            />
            <Text style={[styles.tabLabel, screen === "home" && styles.tabActive]}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setScreen("query")}
          >
            <Ionicons
              name={screen === "query" ? "chatbubbles" : "chatbubbles-outline"}
              size={24}
              color={screen === "query" ? "#6C63FF" : "#666"}
              style={styles.tabIcon}
            />
            <Text style={[styles.tabLabel, screen === "query" && styles.tabActive]}>Ledgr AI</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: "#0F0F1A" },
  screenContainer: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#1C1C2E",
    borderTopWidth: 1,
    borderTopColor: "#2A2A3E",
    paddingBottom: 24, // safe area padding
    paddingTop: 12,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabIcon: { marginBottom: 4 },
  tabLabel: { fontSize: 12, fontWeight: "600", color: "#666" },
  tabActive: { color: "#6C63FF" },
});

