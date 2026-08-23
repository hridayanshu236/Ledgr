import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  View,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { getTransactions } from "../lib/api";
import { TransactionItem } from "../lib/types";
import EditTransactionModal from "../components/EditTransactionModal";

interface Props {
  onCapture: () => void;
}

function TransactionCard({ item, onPress }: { item: TransactionItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardRow}>
        <Text style={styles.merchant} numberOfLines={1}>
          {item.merchant_or_entity}
        </Text>
        <Text style={styles.amount}>NPR {item.amount}</Text>
      </View>
      <View style={styles.cardRow}>
        <Text style={styles.meta}>{item.date}</Text>
        <Text style={styles.category}>{item.category}</Text>
      </View>
      {item.remarks ? (
        <Text style={styles.remarks} numberOfLines={1}>
          {item.remarks}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function HomeScreen({ onCapture }: Props) {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);

  const screenWidth = Dimensions.get("window").width;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTransactions();
      setTransactions(data);
    } catch {
      setError("Could not reach the server. Check your network and BACKEND_URL.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Group by category for the pie chart
  const categoryTotals: Record<string, number> = {};
  transactions.forEach((tx) => {
    const amount = parseFloat(tx.amount || "0");
    categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + amount;
  });

  const colors = ["#6C63FF", "#FF6584", "#38B2AC", "#ECC94B", "#ED8936", "#9F7AEA", "#F56565"];
  const chartData = Object.keys(categoryTotals).map((cat, index) => ({
    name: cat,
    amount: categoryTotals[cat],
    color: colors[index % colors.length],
    legendFontColor: "#888",
    legendFontSize: 12,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Ledgr</Text>
      </View>

      {loading && <ActivityIndicator style={styles.center} size="large" color="#6C63FF" />}

      {error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && transactions.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No transactions yet.</Text>
          <Text style={styles.emptySubtext}>Tap + to upload a receipt.</Text>
        </View>
      )}

      {!loading && !error && transactions.length > 0 && (
        <FlatList
          data={transactions}
          keyExtractor={(item, i) => item.id || String(i)}
          ListHeaderComponent={
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Spending Breakdown</Text>
              {chartData.length > 0 ? (
                <PieChart
                  data={chartData}
                  width={screenWidth - 32}
                  height={180}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  }}
                  accessor={"amount"}
                  backgroundColor={"transparent"}
                  paddingLeft={"15"}
                  center={[10, 0]}
                  absolute
                />
              ) : (
                <Text style={styles.emptySubtext}>No data for chart</Text>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <TransactionCard item={item} onPress={() => setSelectedTx(item)} />
          )}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={onCapture} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <EditTransactionModal
        visible={!!selectedTx}
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onUpdated={load}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#E8E8F0",
  },
  chartContainer: {
    backgroundColor: "#1C1C2E",
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  chartTitle: {
    color: "#E8E8F0",
    fontSize: 16,
    fontWeight: "600",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    backgroundColor: "#1C1C2E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  merchant: { fontSize: 16, fontWeight: "600", color: "#E8E8F0", flex: 1, marginRight: 8 },
  amount: { fontSize: 16, fontWeight: "700", color: "#6C63FF" },
  meta: { fontSize: 12, color: "#888" },
  category: {
    fontSize: 11,
    color: "#6C63FF",
    backgroundColor: "#2A2A3E",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  remarks: { fontSize: 12, color: "#666", marginTop: 4 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  errorText: { color: "#FF6B6B", textAlign: "center", marginBottom: 16 },
  retryBtn: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: "#FFF", fontWeight: "600" },
  emptyText: { color: "#888", fontSize: 16, marginBottom: 8 },
  emptySubtext: { color: "#555", fontSize: 13 },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#6C63FF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  fabText: { fontSize: 32, color: "#FFF", lineHeight: 36 },
});
