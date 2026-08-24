import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { GetTransactionsParams } from "../lib/api";
import DropdownField from "./DropdownField";

interface Props {
  visible: boolean;
  filters: GetTransactionsParams;
  onApply: (filters: GetTransactionsParams) => void;
  onClose: () => void;
}

export default function FilterModal({ visible, filters, onApply, onClose }: Props) {
  const [localFilters, setLocalFilters] = useState<GetTransactionsParams>(filters);

  // Generate last 12 months for the month dropdown
  const months = React.useMemo(() => {
    const result = [];
    const date = new Date();
    for (let i = 0; i < 12; i++) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      result.push(`${y}-${m}`);
      date.setMonth(date.getMonth() - 1);
    }
    return result;
  }, []);

  function handleApply() {
    onApply(localFilters);
    onClose();
  }

  function handleClear() {
    const cleared = { sort_by: "date", sort_order: "desc" } as GetTransactionsParams;
    setLocalFilters(cleared);
    onApply(cleared);
    onClose();
  }

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.heading}>Filter & Sort</Text>
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea}>
            <DropdownField
              label="Sort By"
              value={localFilters.sort_by || "date"}
              onChangeText={(v) => setLocalFilters({ ...localFilters, sort_by: v as any })}
              options={["date", "amount"]}
            />
            <DropdownField
              label="Sort Order"
              value={localFilters.sort_order || "desc"}
              onChangeText={(v) => setLocalFilters({ ...localFilters, sort_order: v as any })}
              options={["desc", "asc"]}
            />
            <View style={styles.divider} />
            <DropdownField
              label="Month"
              value={localFilters.month || ""}
              onChangeText={(v) => setLocalFilters({ ...localFilters, month: v })}
              options={months}
              placeholder="All Time"
            />
            <DropdownField
              label="Category"
              value={localFilters.category || ""}
              onChangeText={(v) => setLocalFilters({ ...localFilters, category: v })}
              options={["groceries", "dining", "utilities", "transport", "shopping", "transfer", "misc"]}
              placeholder="All Categories"
            />
            <DropdownField
              label="Payment Method"
              value={localFilters.payment_method || ""}
              onChangeText={(v) => setLocalFilters({ ...localFilters, payment_method: v })}
              options={["cash", "fonepay", "esewa", "khalti", "bank_transfer", "card"]}
              placeholder="All Methods"
            />

            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
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
  clearText: { color: "#FF453A", fontSize: 16 },
  heading: { color: "#FFF", fontSize: 18, fontWeight: "600" },
  scrollArea: { padding: 20 },
  divider: {
    height: 1,
    backgroundColor: "#2A2A3E",
    marginVertical: 16,
  },
  applyBtn: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#6C63FF",
    borderRadius: 12,
    alignItems: "center",
  },
  applyBtnText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
});
