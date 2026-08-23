import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { deleteTransaction, updateTransaction } from "../lib/api";
import { TransactionItem } from "../lib/types";

interface Props {
  visible: boolean;
  transaction: TransactionItem | null;
  onClose: () => void;
  onUpdated: () => void;
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

export default function EditTransactionModal({ visible, transaction, onClose, onUpdated }: Props) {
  const [edited, setEdited] = useState<TransactionItem | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync state when transaction prop changes
  React.useEffect(() => {
    if (visible && transaction) {
      setEdited(transaction);
    }
  }, [transaction, visible]);

  if (!edited || !transaction?.id) return null;

  async function handleSave() {
    if (!edited || !transaction?.id) return;
    try {
      setLoading(true);
      await updateTransaction(transaction.id, edited);
      onUpdated();
      onClose();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to update transaction");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!transaction?.id) return;
    Alert.alert("Delete Transaction", "Are you sure you want to delete this transaction?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await deleteTransaction(transaction.id!);
            onUpdated();
            onClose();
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to delete transaction");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.heading}>Edit Transaction</Text>
            <TouchableOpacity onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#6C63FF" />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea}>
            <Field
              label="Merchant"
              value={edited.merchant_or_entity}
              onChangeText={(v) => setEdited({ ...edited, merchant_or_entity: v })}
            />
            <Field
              label="Date (YYYY-MM-DD)"
              value={edited.date}
              onChangeText={(v) => setEdited({ ...edited, date: v })}
            />
            <Field
              label="Amount (NPR)"
              value={String(edited.amount)}
              onChangeText={(v) => setEdited({ ...edited, amount: v })}
              keyboardType="decimal-pad"
            />
            <Field
              label="Category"
              value={edited.category}
              onChangeText={(v) => setEdited({ ...edited, category: v as any })}
            />
            <Field
              label="Payment Method"
              value={edited.payment_method}
              onChangeText={(v) => setEdited({ ...edited, payment_method: v as any })}
            />
            <Field
              label="Remarks"
              value={edited.remarks ?? ""}
              onChangeText={(v) => setEdited({ ...edited, remarks: v || undefined })}
            />

            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={loading}>
              <Text style={styles.deleteText}>Delete Transaction</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1C1C2E",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A3E",
  },
  cancelText: { color: "#888", fontSize: 16 },
  saveText: { color: "#6C63FF", fontSize: 16, fontWeight: "700" },
  heading: { color: "#FFF", fontSize: 18, fontWeight: "600" },
  scrollArea: { padding: 20 },
  field: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 11,
    color: "#888",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
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
  deleteBtn: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "rgba(255, 69, 58, 0.1)",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 69, 58, 0.3)",
  },
  deleteText: { color: "#FF453A", fontWeight: "600", fontSize: 16 },
});
