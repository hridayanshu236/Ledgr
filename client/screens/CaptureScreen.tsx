import * as DocumentPicker from "expo-document-picker";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ingestFile } from "../lib/api";
import { TransactionBatch } from "../lib/types";

interface Props {
  onResult: (batch: TransactionBatch) => void;
  onBack: () => void;
}

export default function CaptureScreen({ onResult, onBack }: Props) {
  const [uploading, setUploading] = useState(false);

  async function compress(uri: string): Promise<string> {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1280 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  }

  async function upload(uri: string, mimeType: string, filename: string) {
    try {
      setUploading(true);
      const batch = await ingestFile(uri, mimeType, filename);
      onResult(batch);
    } catch (e: any) {
      const detail = e?.response?.data?.detail ?? e?.message ?? "Unknown error";
      Alert.alert("Upload failed", detail);
    } finally {
      setUploading(false);
    }
  }

  async function fromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera permission required");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (result.canceled) return;
    const compressed = await compress(result.assets[0].uri);
    await upload(compressed, "image/jpeg", "receipt.jpg");
  }

  async function fromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    const compressed = await compress(asset.uri);
    await upload(compressed, "image/jpeg", asset.fileName ?? "receipt.jpg");
  }

  async function fromDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    await upload(asset.uri, "application/pdf", asset.name);
  }

  if (uploading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Extracting transactions...</Text>
        <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.heading}>Add Receipt</Text>
      <Text style={styles.subheading}>Choose a source to import from</Text>

      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionCard} onPress={fromCamera} activeOpacity={0.8}>
          <Ionicons name="camera" size={32} color="#6C63FF" style={styles.optionIcon} />
          <Text style={styles.optionTitle}>Camera</Text>
          <Text style={styles.optionDesc}>Take a photo of a physical receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard} onPress={fromGallery} activeOpacity={0.8}>
          <Ionicons name="image" size={32} color="#6C63FF" style={styles.optionIcon} />
          <Text style={styles.optionTitle}>Gallery</Text>
          <Text style={styles.optionDesc}>Pick a payment screenshot or photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard} onPress={fromDocument} activeOpacity={0.8}>
          <Ionicons name="document-text" size={32} color="#6C63FF" style={styles.optionIcon} />
          <Text style={styles.optionTitle}>PDF</Text>
          <Text style={styles.optionDesc}>Import a bank statement or PDF receipt</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A", padding: 24, paddingTop: 60 },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0F0F1A",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: { color: "#E8E8F0", fontSize: 18, fontWeight: "600" },
  loadingSubtext: { color: "#666", fontSize: 13 },
  backBtn: { marginBottom: 32 },
  backText: { color: "#6C63FF", fontSize: 16, fontWeight: "600" },
  heading: { fontSize: 28, fontWeight: "700", color: "#E8E8F0", marginBottom: 8 },
  subheading: { fontSize: 14, color: "#666", marginBottom: 40 },
  optionsContainer: { gap: 16 },
  optionCard: {
    backgroundColor: "#1C1C2E",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#2A2A3E",
  },
  optionIcon: { marginBottom: 12 },
  optionTitle: { fontSize: 18, fontWeight: "700", color: "#E8E8F0", marginBottom: 6 },
  optionDesc: { fontSize: 13, color: "#666", lineHeight: 18 },
});
