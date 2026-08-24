import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import * as SecureStore from "expo-secure-store";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View, Text, TouchableOpacity, Animated } from "react-native";

import { setAuthToken } from "./lib/api";
import CaptureScreen from "./screens/CaptureScreen";
import HomeScreen from "./screens/HomeScreen";
import QueryScreen from "./screens/QueryScreen";
import ReviewScreen from "./screens/ReviewScreen";
import AuthScreen from "./screens/AuthScreen";
import SettingsScreen from "./screens/SettingsScreen";
import AnalyticsScreen from "./screens/AnalyticsScreen";
import { TransactionBatch } from "./lib/types";

const Tab = createBottomTabNavigator();

const TabIcon = ({ focused, iconName, color, size }: { focused: boolean, iconName: any, color: string, size: number }) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  
  React.useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.2 : 1,
      useNativeDriver: true,
      friction: 5,
      tension: 100
    }).start();
  }, [focused, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Ionicons name={iconName} size={size} color={color} />
    </Animated.View>
  );
};

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // App-level state for capture/review flow outside of tabs if needed, 
  // or we can just use simple state toggles inside the Home tab.
  const [isCapturing, setIsCapturing] = useState(false);
  const [pendingBatch, setPendingBatch] = useState<TransactionBatch | null>(null);

  // Chat memory state
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "bot"; content: string }[]>([
    {
      role: "bot",
      content: "Hello! You can ask me questions about your spending, like 'How much did I spend on dining this month?' or 'Where did I buy filter coffee?'.",
    },
  ]);

  React.useEffect(() => {
    async function checkAuth() {
      const storedToken = await SecureStore.getItemAsync("token");
      if (storedToken) {
        setToken(storedToken);
        setAuthToken(storedToken);
      }
      setIsLoading(false);
    }
    checkAuth();
  }, []);

  async function handleLogin(newToken: string) {
    await SecureStore.setItemAsync("token", newToken);
    setToken(newToken);
    setAuthToken(newToken);
  }

  async function handleLogout() {
    await SecureStore.deleteItemAsync("token");
    setToken(null);
    setAuthToken(null);
  }

  if (isLoading) return null;

  if (!token) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0F0F1A" }}>
        <StatusBar style="light" />
        <AuthScreen onLogin={handleLogin} />
      </View>
    );
  }

  function handleCaptureResult(batch: TransactionBatch) {
    setIsCapturing(false);
    setPendingBatch(batch);
  }

  function handleConfirmed() {
    setPendingBatch(null);
  }

  // If we are in the middle of a review flow, show it over everything
  if (pendingBatch) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        <ReviewScreen
          batch={pendingBatch}
          onConfirmed={handleConfirmed}
          onBack={() => setPendingBatch(null)}
        />
      </View>
    );
  }

  // If capturing, show capture screen
  if (isCapturing) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        <CaptureScreen
          onResult={handleCaptureResult}
          onBack={() => setIsCapturing(false)}
        />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = "home";
            if (route.name === "Dashboard") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "Analytics") {
              iconName = focused ? "bar-chart" : "bar-chart-outline";
            } else if (route.name === "Ledgr AI") {
              iconName = focused ? "chatbubbles" : "chatbubbles-outline";
            } else if (route.name === "Settings") {
              iconName = focused ? "settings" : "settings-outline";
            }
            return <TabIcon focused={focused} iconName={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#6C63FF",
          tabBarInactiveTintColor: "#888",
          tabBarStyle: {
            backgroundColor: "#1C1C2E",
            borderTopColor: "#2A2A3E",
          },
          headerShown: false,
        })}
      >
        <Tab.Screen name="Dashboard">
          {() => <HomeScreen onCapture={() => setIsCapturing(true)} />}
        </Tab.Screen>
        <Tab.Screen name="Analytics">
          {() => <AnalyticsScreen />}
        </Tab.Screen>
        <Tab.Screen name="Ledgr AI">
          {() => <QueryScreen messages={chatHistory} setMessages={setChatHistory} />}
        </Tab.Screen>
        <Tab.Screen name="Settings">
          {() => <SettingsScreen onLogout={handleLogout} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
