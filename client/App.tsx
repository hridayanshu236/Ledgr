import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import * as SecureStore from "expo-secure-store";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View, Text, TouchableOpacity, Animated, Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import { setAuthToken, updateUserSettings } from "./lib/api";
import CaptureScreen from "./screens/CaptureScreen";
import HomeScreen from "./screens/HomeScreen";
import QueryScreen from "./screens/QueryScreen";
import ReviewScreen from "./screens/ReviewScreen";
import AuthScreen from "./screens/AuthScreen";
import SettingsScreen from "./screens/SettingsScreen";
import AnalyticsScreen from "./screens/AnalyticsScreen";
import BudgetsScreen from "./screens/BudgetsScreen";
import TransactionDetailScreen from "./screens/TransactionDetailScreen";
import { TransactionBatch } from "./lib/types";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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
        await registerForPushNotificationsAsync();
      }
      setIsLoading(false);
    }
    checkAuth();
  }, []);

  async function registerForPushNotificationsAsync() {
    let pushToken;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        return;
      }
      try {
        pushToken = (await Notifications.getExpoPushTokenAsync({
          projectId: '8ec5955f-fc3c-4172-be89-1c446ab305d2', // Project ID from eas.json/app.json logs
        })).data;
        if (pushToken) {
          await updateUserSettings({ push_token: pushToken });
        }
      } catch (e) {
        console.log("Push token error:", e);
      }
    }
  }

  async function handleLogin(newToken: string) {
    await SecureStore.setItemAsync("token", newToken);
    setToken(newToken);
    setAuthToken(newToken);
    await registerForPushNotificationsAsync();
  }

  async function handleLogout() {
    await SecureStore.deleteItemAsync("token");
    setToken(null);
    setAuthToken(null);
  }

  if (isLoading) return null;

  if (!token) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: "#0F0F1A" }}>
          <StatusBar style="light" />
          <AuthScreen onLogin={handleLogin} />
        </View>
      </SafeAreaProvider>
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
      <SafeAreaProvider>
        <View style={{ flex: 1 }}>
          <StatusBar style="light" />
          <ReviewScreen
            batch={pendingBatch}
            onConfirmed={handleConfirmed}
            onBack={() => setPendingBatch(null)}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  // If capturing, show capture screen
  if (isCapturing) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1 }}>
          <StatusBar style="light" />
          <CaptureScreen
            onResult={handleCaptureResult}
            onBack={() => setIsCapturing(false)}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs">
            {() => (
              <Tab.Navigator
                screenOptions={({ route }) => ({
                  tabBarIcon: ({ focused, color, size }) => {
                    let iconName = "home";
                    if (route.name === "Dashboard") {
                      iconName = focused ? "home" : "home-outline";
                    } else if (route.name === "Analytics") {
                      iconName = focused ? "bar-chart" : "bar-chart-outline";
                    } else if (route.name === "Budgets") {
                      iconName = focused ? "wallet" : "wallet-outline";
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
                <Tab.Screen name="Budgets">
                  {() => <BudgetsScreen />}
                </Tab.Screen>
                <Tab.Screen name="Ledgr AI">
                  {() => <QueryScreen messages={chatHistory} setMessages={setChatHistory} />}
                </Tab.Screen>
                <Tab.Screen name="Settings">
                  {() => <SettingsScreen onLogout={handleLogout} />}
                </Tab.Screen>
              </Tab.Navigator>
            )}
          </Stack.Screen>
          
          {/* Detailed receipt view that sits on top of the tabs */}
          <Stack.Screen 
            name="TransactionDetail" 
            component={TransactionDetailScreen} 
            options={{ presentation: "modal" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
