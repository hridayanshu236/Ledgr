import React, { useState } from "react";
import {
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
import { Ionicons } from "@expo/vector-icons";

interface Props {
  label: string;
  value: string;
  options: string[];
  onChangeText: (v: string) => void;
  placeholder?: string;
}

export default function DropdownField({ label, value, options, onChangeText, placeholder }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  
  // If the current value is not in the options list (and isn't empty), it's a custom value
  const isCustomValue = value ? !options.includes(value) : false;
  const [isCustomMode, setIsCustomMode] = useState(isCustomValue);
  const [customText, setCustomText] = useState(isCustomValue ? value : "");

  function handleSelectOption(opt: string) {
    if (opt === "Other") {
      setIsCustomMode(true);
      // Don't close modal yet, let them type
    } else {
      setIsCustomMode(false);
      onChangeText(opt);
      setModalVisible(false);
    }
  }

  function handleSaveCustom() {
    if (customText.trim()) {
      onChangeText(customText.trim());
      setModalVisible(false);
    }
  }

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      
      <TouchableOpacity 
        style={styles.fieldInput} 
        activeOpacity={0.7} 
        onPress={() => {
          const customVal = value && !options.includes(value) ? value : "";
          setIsCustomMode(!!customVal);
          setCustomText(customVal);
          setModalVisible(true);
        }}
      >
        <Text style={[styles.fieldText, !value && styles.placeholderText]}>
          {value || placeholder || "Select an option..."}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#888" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setModalVisible(false)} />
          
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollArea}>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.optionRow,
                    value === opt && !isCustomMode && styles.optionRowSelected
                  ]}
                  onPress={() => handleSelectOption(opt)}
                >
                  <Text style={[
                    styles.optionText,
                    value === opt && !isCustomMode && styles.optionTextSelected
                  ]}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1).replace(/_/g, ' ')}
                  </Text>
                  {value === opt && !isCustomMode && (
                    <Ionicons name="checkmark" size={20} color="#6C63FF" />
                  )}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[
                  styles.optionRow,
                  isCustomMode && styles.optionRowSelected
                ]}
                onPress={() => handleSelectOption("Other")}
              >
                <Text style={[
                  styles.optionText,
                  isCustomMode && styles.optionTextSelected
                ]}>
                  Other (Custom)
                </Text>
                {isCustomMode && (
                  <Ionicons name="checkmark" size={20} color="#6C63FF" />
                )}
              </TouchableOpacity>
            </ScrollView>

            {isCustomMode && (
              <View style={styles.customContainer}>
                <Text style={styles.fieldLabel}>Custom {label}</Text>
                <View style={styles.customInputRow}>
                  <TextInput
                    style={styles.customInput}
                    value={customText}
                    onChangeText={setCustomText}
                    placeholder="Type custom name..."
                    placeholderTextColor="#555"
                    autoFocus
                  />
                  <TouchableOpacity 
                    style={[styles.saveBtn, !customText.trim() && styles.saveBtnDisabled]} 
                    onPress={handleSaveCustom}
                    disabled={!customText.trim()}
                  >
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 11,
    color: "#888",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: "#0F0F1A",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#2A2A3E",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldText: {
    color: "#E8E8F0",
    fontSize: 15,
  },
  placeholderText: {
    color: "#555",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContent: {
    backgroundColor: "#1C1C2E",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A3E",
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
  scrollArea: {
    padding: 12,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  optionRowSelected: {
    backgroundColor: "rgba(108, 99, 255, 0.1)",
  },
  optionText: {
    color: "#E8E8F0",
    fontSize: 16,
  },
  optionTextSelected: {
    color: "#6C63FF",
    fontWeight: "600",
  },
  customContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#2A2A3E",
    backgroundColor: "#1C1C2E",
  },
  customInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  customInput: {
    flex: 1,
    backgroundColor: "#0F0F1A",
    color: "#E8E8F0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#2A2A3E",
    marginRight: 12,
  },
  saveBtn: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
