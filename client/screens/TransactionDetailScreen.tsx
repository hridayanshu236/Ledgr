import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  TextInput
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { TransactionItem } from "../lib/types";
import { deleteTransaction, updateTransaction } from "../lib/api";

export default function TransactionDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const initialTx = (route.params as any)?.transaction as TransactionItem;

  const [tx, setTx] = useState<TransactionItem>(initialTx);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Edit states
  const [editMerchant, setEditMerchant] = useState(tx?.merchant_or_entity || "");
  const [editAmount, setEditAmount] = useState(tx?.amount?.toString() || "");
  const [editCategory, setEditCategory] = useState(tx?.category || "");

  if (!tx) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "#FFF" }}>No transaction data found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ color: "#FFF" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleDelete() {
    Alert.alert("Delete Transaction", "Are you sure you want to delete this bill?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await deleteTransaction(tx.id!);
            // Go back to the previous screen (Home)
            navigation.goBack();
          } catch (e) {
            Alert.alert("Error", "Could not delete transaction");
            setLoading(false);
          }
        }
      }
    ]);
  }

  async function handleSave() {
    try {
      setLoading(true);
      const updatedTx = {
        ...tx,
        merchant_or_entity: editMerchant,
        amount: parseFloat(editAmount) || 0,
        category: editCategory
      };
      await updateTransaction(tx.id!, updatedTx);
      setTx(updatedTx);
      setIsEditing(false);
    } catch (e) {
      Alert.alert("Error", "Could not save changes");
    } finally {
      setLoading(false);
    }
  }

  function renderBill() {
    return (
      <View style={styles.receiptPaper}>
        {/* Header */}
        <View style={styles.receiptHeader}>
          {isEditing ? (
            <TextInput 
              style={styles.editInputTitle} 
              value={editMerchant} 
              onChangeText={setEditMerchant} 
            />
          ) : (
            <Text style={styles.merchantName}>{tx.merchant_or_entity || "Unknown Merchant"}</Text>
          )}
          <Text style={styles.dateText}>{tx.date}</Text>
        </View>
        
        <View style={styles.divider} />
        
        {/* Line Items */}
        <View style={styles.lineItemsContainer}>
          <Text style={styles.sectionTitle}>Items</Text>
          {tx.line_items && tx.line_items.length > 0 ? (
            tx.line_items.map((item, idx) => (
              <View key={idx} style={styles.lineItemRow}>
                <Text style={styles.itemQty}>{item.quantity}x</Text>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemPrice}>Rs. {parseFloat(item.total_price?.toString() || "0").toFixed(2)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyItems}>No line items recorded.</Text>
          )}
        </View>

        <View style={styles.divider} />

        {/* Footer / Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Category</Text>
            {isEditing ? (
              <TextInput 
                style={styles.editInputSmall} 
                value={editCategory} 
                onChangeText={setEditCategory} 
              />
            ) : (
              <Text style={styles.totalValue}>{tx.category}</Text>
            )}
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Payment</Text>
            <Text style={styles.totalValue}>{tx.payment_method || "N/A"}</Text>
          </View>
          
          <View style={[styles.totalRow, { marginTop: 12 }]}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            {isEditing ? (
              <TextInput 
                style={styles.editInputAmount} 
                value={editAmount} 
                onChangeText={setEditAmount} 
                keyboardType="numeric"
              />
            ) : (
              <Text style={styles.grandTotalValue}>Rs. {parseFloat(tx.amount?.toString() || "0").toFixed(2)}</Text>
            )}
          </View>
        </View>

        {tx.remarks && (
          <>
            <View style={styles.divider} />
            <Text style={styles.remarksText}>{tx.remarks}</Text>
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => {
          navigation.goBack();
        }} style={styles.navBtn}>
          <Ionicons name="close" size={28} color="#E8E8F0" />
        </TouchableOpacity>
        
        <Text style={styles.navTitle}>E-Bill</Text>
        
        <View style={styles.navRight}>
          {isEditing ? (
            <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.navBtn}>
              {loading ? <ActivityIndicator color="#6C63FF" /> : <Text style={styles.saveText}>Save</Text>}
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity onPress={() => setIsEditing(true)} style={[styles.navBtn, { marginRight: 16 }]}>
                <Ionicons name="pencil" size={22} color="#E8E8F0" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.navBtn}>
                <Ionicons name="trash" size={22} color="#FF6B6B" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderBill()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(15, 15, 26, 0.95)",
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: "#1C1C2E",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)"
  },
  navBtn: {
    padding: 4,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#E8E8F0",
  },
  navRight: {
    flexDirection: "row",
    alignItems: "center"
  },
  saveText: {
    color: "#6C63FF",
    fontWeight: "700",
    fontSize: 16
  },
  backBtn: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#6C63FF",
    borderRadius: 8,
    alignSelf: "center"
  },
  scrollContent: {
    padding: 24,
    alignItems: "center",
  },
  receiptPaper: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  receiptHeader: {
    alignItems: "center",
    marginBottom: 16
  },
  merchantName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
    textAlign: "center",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1
  },
  dateText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "monospace"
  },
  divider: {
    height: 1,
    borderWidth: 1,
    borderColor: "#DDD",
    borderStyle: "dashed",
    width: "100%",
    my: 16,
    marginVertical: 16
  },
  lineItemsContainer: {
    width: "100%"
  },
  sectionTitle: {
    fontSize: 12,
    color: "#888",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 1
  },
  lineItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  itemQty: {
    width: 30,
    fontSize: 14,
    color: "#444",
    fontFamily: "monospace"
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: "#222",
    marginRight: 10
  },
  itemPrice: {
    fontSize: 14,
    color: "#222",
    fontWeight: "500",
    fontFamily: "monospace"
  },
  emptyItems: {
    color: "#999",
    fontStyle: "italic",
    fontSize: 13
  },
  totalsContainer: {
    width: "100%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6
  },
  totalLabel: {
    fontSize: 14,
    color: "#666"
  },
  totalValue: {
    fontSize: 14,
    color: "#222",
    fontWeight: "500"
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111",
  },
  remarksText: {
    fontSize: 13,
    color: "#555",
    fontStyle: "italic",
    textAlign: "center"
  },
  editInputTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
    textAlign: "center",
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#6C63FF",
    minWidth: 150
  },
  editInputSmall: {
    fontSize: 14,
    color: "#222",
    borderBottomWidth: 1,
    borderBottomColor: "#6C63FF",
    minWidth: 100,
    textAlign: "right"
  },
  editInputAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111",
    borderBottomWidth: 1,
    borderBottomColor: "#6C63FF",
    minWidth: 100,
    textAlign: "right"
  }
});
