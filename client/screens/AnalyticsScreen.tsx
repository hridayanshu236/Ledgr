import React, { useCallback, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, PieChart } from "react-native-chart-kit";
import { getTransactions } from "../lib/api";
import { TransactionItem } from "../lib/types";

export default function AnalyticsScreen() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<"week" | "month" | "6months" | "year" | "all">("all");

  const screenWidth = Dimensions.get("window").width;

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      // Fetch all transactions (no filters) to compute analytics locally
      const data = await getTransactions({});
      setTransactions(data);
    } catch {
      setError("Failed to load analytics data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // --- Compute Analytics ---
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;
  const nowTime = now.getTime();
  const filteredTx = transactions.filter(tx => {
    if (timeframe === "all") return true;
    const txDate = new Date(tx.date).getTime();
    const daysDiff = (nowTime - txDate) / (1000 * 60 * 60 * 24);
    
    if (timeframe === "week") return daysDiff <= 7;
    if (timeframe === "month") return daysDiff <= 30;
    if (timeframe === "6months") return daysDiff <= 182;
    if (timeframe === "year") return daysDiff <= 365;
    return true;
  });

  let totalSpent = 0;
  let currentMonthTotal = 0;
  let lastMonthTotal = 0;
  const merchantTotals: Record<string, number> = {};
  const monthlyTotals: Record<string, number> = {};

  transactions.forEach((tx) => {
    const amount = parseFloat(tx.amount || "0");
    const txMonth = tx.date.substring(0, 7); // YYYY-MM
    
    if (txMonth === currentMonthStr) currentMonthTotal += amount;
    if (txMonth === lastMonthStr) lastMonthTotal += amount;

    // 6-month trend (always use all transactions for the chart)
    monthlyTotals[txMonth] = (monthlyTotals[txMonth] || 0) + amount;
  });

  filteredTx.forEach((tx) => {
    const amount = parseFloat(tx.amount || "0");
    totalSpent += amount;
    // Top merchants based on filtered timeframe
    merchantTotals[tx.merchant_or_entity] = (merchantTotals[tx.merchant_or_entity] || 0) + amount;
  });

  // Sort merchants
  const topMerchants = Object.entries(merchantTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Prepare Bar Chart (Last 6 months)
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const shortLabel = d.toLocaleString('default', { month: 'short' });
    last6Months.push({ label: shortLabel, key: mStr });
  }

  const barData = {
    labels: last6Months.map(m => m.label),
    datasets: [
      {
        data: last6Months.map(m => monthlyTotals[m.key] || 0),
      }
    ]
  };

  const chartConfig = {
    backgroundColor: "#1C1C2E",
    backgroundGradientFrom: "#1C1C2E",
    backgroundGradientTo: "#1C1C2E",
    fillShadowGradient: "#6C63FF",
    fillShadowGradientOpacity: 1,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(108, 99, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(136, 136, 136, ${opacity})`,
    style: {
      borderRadius: 16
    },
  };

  const pctChange = lastMonthTotal > 0 
    ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
    : 0;

  const timeframes = [
    { label: "1W", value: "week" },
    { label: "1M", value: "month" },
    { label: "6M", value: "6months" },
    { label: "1Y", value: "year" },
    { label: "ALL", value: "all" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Analytics</Text>
      </View>
      
      <View style={styles.timeframeRow}>
        {timeframes.map((tf) => (
          <TouchableOpacity
            key={tf.value}
            style={[styles.timeframeBtn, timeframe === tf.value && styles.timeframeBtnActive]}
            onPress={() => setTimeframe(tf.value as any)}
          >
            <Text style={[styles.timeframeText, timeframe === tf.value && styles.timeframeTextActive]}>
              {tf.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && <ActivityIndicator style={styles.center} size="large" color="#6C63FF" />}
      
      {error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor="#6C63FF"
              colors={["#6C63FF"]}
              progressBackgroundColor="#1C1C2E"
            />
          }
        >
          {/* Summary Cards */}
          <View style={styles.summaryRow}>
            {timeframe === "all" ? (
              <>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>This Month</Text>
                  <Text style={styles.summaryValue}>NPR {currentMonthTotal.toFixed(0)}</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>vs Last Month</Text>
                  <Text style={[
                    styles.summaryValue, 
                    { color: pctChange > 0 ? "#FF6584" : "#38B2AC" }
                  ]}>
                    {pctChange > 0 ? "+" : ""}{pctChange.toFixed(1)}%
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Spent (Selected Period)</Text>
                <Text style={styles.summaryValue}>NPR {totalSpent.toFixed(0)}</Text>
              </View>
            )}
          </View>

          {/* Trend Chart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6-Month Trend</Text>
            <BarChart
              data={barData}
              width={screenWidth - 32}
              height={220}
              yAxisLabel="Rs "
              yAxisSuffix=""
              chartConfig={chartConfig}
              style={styles.chart}
              showValuesOnTopOfBars={false}
              withHorizontalLabels={true}
              withInnerLines={false}
            />
          </View>

          {/* Top Merchants */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Merchants</Text>
            {topMerchants.map(([merchant, amount], index) => (
              <View key={index} style={styles.merchantRow}>
                <View style={styles.merchantRank}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <Text style={styles.merchantName} numberOfLines={1}>{merchant}</Text>
                <Text style={styles.merchantAmount}>NPR {amount.toFixed(0)}</Text>
              </View>
            ))}
            {topMerchants.length === 0 && (
              <Text style={styles.emptyText}>No data available yet.</Text>
            )}
          </View>

        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A" },
  headerRow: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#E8E8F0",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  errorText: { color: "#FF6B6B", textAlign: "center" },
  timeframeRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    justifyContent: "space-between",
  },
  timeframeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#1C1C2E",
    borderWidth: 1,
    borderColor: "#2A2A3E",
  },
  timeframeBtnActive: {
    backgroundColor: "rgba(108, 99, 255, 0.15)",
    borderColor: "#6C63FF",
  },
  timeframeText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
  },
  timeframeTextActive: {
    color: "#6C63FF",
  },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: "#1C1C2E",
    borderRadius: 16,
    padding: 20,
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#2A2A3E",
  },
  summaryLabel: {
    color: "#888",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  summaryValue: {
    color: "#E8E8F0",
    fontSize: 20,
    fontWeight: "700",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#E8E8F0",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2A2A3E",
  },
  merchantRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C2E",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2A2A3E",
  },
  merchantRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(108, 99, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankText: {
    color: "#6C63FF",
    fontSize: 12,
    fontWeight: "700",
  },
  merchantName: {
    flex: 1,
    color: "#E8E8F0",
    fontSize: 16,
    fontWeight: "500",
  },
  merchantAmount: {
    color: "#E8E8F0",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyText: {
    color: "#888",
    fontSize: 14,
    fontStyle: "italic",
  }
});
