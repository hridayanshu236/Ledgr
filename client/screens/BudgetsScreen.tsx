import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getUserSettings, updateUserSettings, getTransactions } from "../lib/api";

export default function BudgetsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly");
  const [spent, setSpent] = useState(0);

  useFocusEffect(
    useCallback(() => {
      fetchSettings();
    }, [])
  );

  async function fetchSettings() {
    try {
      const data = await getUserSettings();
      let currentPeriod = "monthly";
      if (data.budget_amount) setAmount(data.budget_amount.toString());
      if (data.budget_period) {
        setPeriod(data.budget_period as "weekly" | "monthly");
        currentPeriod = data.budget_period;
      }
      
      const txs = await getTransactions();
      let totalSpent = 0;
      const now = new Date();
      
      txs.forEach((tx) => {
        const txDate = new Date(tx.date);
        const amountVal = parseFloat(tx.amount || "0");
        
        if (currentPeriod === "weekly") {
           const diffTime = Math.abs(now.getTime() - txDate.getTime());
           const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
           if (diffDays <= 7) totalSpent += amountVal;
        } else {
           if (txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear()) {
             totalSpent += amountVal;
           }
        }
      });
      setSpent(totalSpent);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Could not load your budget settings.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    const numAmount = Number(amount);
    if (amount && isNaN(numAmount)) {
      Alert.alert("Invalid Amount", "Please enter a valid number.");
      return;
    }

    try {
      setSaving(true);
      await updateUserSettings({
        budget_amount: numAmount || null,
        budget_period: period
      } as any); // cast as any because api_key is required in type but backend handles partials
      Alert.alert("Success", "Your global budget has been updated.");
    } catch (e: any) {
      Alert.alert("Error", e.response?.data?.detail || "Could not save budget");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Overall Budget</Text>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Set Your Limit</Text>
          <Text style={styles.cardSubtext}>
            Ledgr will automatically notify you when your total spending across all categories reaches 80% of this limit.
          </Text>

          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleBtn, period === "weekly" && styles.toggleBtnActive]}
              onPress={() => setPeriod("weekly")}
            >
              <Text style={[styles.toggleText, period === "weekly" && styles.toggleTextActive]}>Weekly</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, period === "monthly" && styles.toggleBtnActive]}
              onPress={() => setPeriod("monthly")}
            >
              <Text style={[styles.toggleText, period === "monthly" && styles.toggleTextActive]}>Monthly</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>Rs.</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          {amount && Number(amount) > 0 ? (
            <View style={{ marginTop: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ color: "#E8E8F0", fontWeight: "600" }}>Spent: Rs. {spent.toFixed(2)}</Text>
                <Text style={{ color: "#888", fontWeight: "500" }}>Left: Rs. {Math.max(0, Number(amount) - spent).toFixed(2)}</Text>
              </View>
              <View style={{ height: 10, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 5, overflow: "hidden" }}>
                <View style={{ 
                  height: "100%", 
                  backgroundColor: spent > Number(amount) ? "#FF6B6B" : "#6C63FF", 
                  borderRadius: 5, 
                  width: `${Math.min(100, (spent / Number(amount)) * 100)}%` 
                }} />
              </View>
            </View>
          ) : null}

          <TouchableOpacity 
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveText}>Save Budget</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A", paddingTop: 60 },
  header: { fontSize: 28, fontWeight: "700", color: "#E8E8F0", paddingHorizontal: 24, marginBottom: 16 },
  loadingContainer: { flex: 1, backgroundColor: "#0F0F1A", justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 24, paddingBottom: 60 },
  
  card: {
    backgroundColor: "rgba(28, 28, 46, 0.6)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    gap: 20
  },
  cardTitle: { color: "#E8E8F0", fontSize: 20, fontWeight: "600" },
  cardSubtext: { color: "#888", fontSize: 14, lineHeight: 20 },
  
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: "#6C63FF",
  },
  toggleText: {
    color: "#888",
    fontWeight: "600",
  },
  toggleTextActive: {
    color: "#FFF",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  currencySymbol: {
    color: "#888",
    fontSize: 24,
    fontWeight: "600",
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 20,
    color: "#E8E8F0",
    fontSize: 24,
    fontWeight: "600",
  },

  saveBtn: { 
    padding: 16, 
    borderRadius: 16, 
    alignItems: "center", 
    backgroundColor: "#6C63FF",
    marginTop: 8 
  },
  saveBtnDisabled: {
    opacity: 0.7
  },
  saveText: { color: "#FFF", fontWeight: "600", fontSize: 16 }
});
