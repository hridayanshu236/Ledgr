import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { confirmBatch } from "../lib/api";
import { TransactionBatch, TransactionItem } from "../lib/types";

interface Props {
  batch: TransactionBatch;
  onConfirmed: () => void;
  onBack: () => void;
}

function TransactionEditor({
  tx,
  onChange,
}: {
  tx: TransactionItem;
  onChange: (updated: TransactionItem) => void;
}) {
  return (
    <View style={styles.card}>
      <Field
        label="Merchant"
        value={tx.merchant_or_entity}
        onChangeText={(v) => onChange({ ...tx, merchant_or_entity: v })}
      />
      <Field
        label="Date"
        value={tx.date}
        onChangeText={(v) => onChange({ ...tx, date: v })}
      />
      <Field
        label="Amount (NPR)"
        value={String(tx.amount)}
        onChangeText={(v) => onChange({ ...tx, amount: v as any })}
        keyboardType="decimal-pad"
      />
      <Field
        label="Category"
        value={tx.category}
        onChangeText={(v) => onChange({ ...tx, category: v as any })}
      />
      <Field
        label="Payment Method"
        value={tx.payment_method}
        onChangeText={(v) => onChange({ ...tx, payment_method: v as any })}
      />
      <Field
        label="Remarks"
        value={tx.remarks ?? ""}
        onChangeText={(v) => onChange({ ...tx, remarks: v || null })}
      />

      {tx.line_items.length > 0 && (
        <View style={styles.lineItemsSection}>
          <Text style={styles.lineItemsLabel}>Line Items</Text>
          {tx.line_items.map((item, idx) => (
            <View key={idx} style={styles.lineItem}>
              <Text style={styles.lineItemName}>{item.name}</Text>
              <Text style={styles.lineItemDetail}>
                {item.quantity} x NPR {item.unit_price} = NPR {item.total_price}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "decimal-pad";
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#555"
        keyboardType={keyboardType ?? "default"}
      />
    </View>
  );
}

export default function ReviewScreen({ batch, onConfirmed, onBack }: Props) {
  const [edited, setEdited] = useState<TransactionBatch>(batch);
  const [saving, setSaving] = useState(false);

  function updateTransaction(index: number, updated: TransactionItem) {
    const transactions = [...edited.transactions];
    transactions[index] = updated;
    setEdited({ transactions });
  }

  async function confirm() {
    try {
      setSaving(true);
      await confirmBatch(edited);
      Alert.alert("Saved", "Transaction saved successfully.", [
        { text: "OK", onPress: onConfirmed },
      ]);
    } catch (e: any) {
      let detail = e?.response?.data?.detail ?? e?.message ?? "Unknown error";
      if (typeof detail !== "string") {
        detail = JSON.stringify(detail, null, 2);
      }
      Alert.alert("Save failed", detail);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Review</Text>
        <TouchableOpacity
          style={[styles.confirmBtn, saving && styles.confirmBtnDisabled]}
          onPress={confirm}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.confirmText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.subheading}>
        {edited.transactions.length} transaction
        {edited.transactions.length !== 1 ? "s" : ""} extracted. Edit if needed, then save.
      </Text>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {edited.transactions.map((tx, idx) => (
          <TransactionEditor
            key={idx}
            tx={tx}
            onChange={(updated) => updateTransaction(idx, updated)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backText: { color: "#6C63FF", fontSize: 16, fontWeight: "600" },
  heading: { fontSize: 20, fontWeight: "700", color: "#E8E8F0" },
  confirmBtn: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 64,
    alignItems: "center",
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
  subheading: { color: "#666", fontSize: 13, paddingHorizontal: 20, marginBottom: 16 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "#1C1C2E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2A2A3E",
  },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, color: "#888", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldInput: {
    backgroundColor: "#0F0F1A",
    color: "#E8E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#2A2A3E",
  },
  lineItemsSection: { marginTop: 8, borderTopWidth: 1, borderTopColor: "#2A2A3E", paddingTop: 12 },
  lineItemsLabel: { fontSize: 11, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  lineItem: { marginBottom: 8 },
  lineItemName: { color: "#E8E8F0", fontSize: 14, fontWeight: "600" },
  lineItemDetail: { color: "#666", fontSize: 12, marginTop: 2 },
});
