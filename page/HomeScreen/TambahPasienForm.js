import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TambahPasienForm({ onClose, onSuccess, token }) {
  const [nama, setNama] = useState("");
  const [umur, setUmur] = useState("");
  const [noReg, setNoReg] = useState("");
  const [alamat, setAlamat] = useState("");
  const [gravida, setGravida] = useState("");
  const [paritas, setParitas] = useState("");
  const [abortus, setAbortus] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!nama || !umur || !alamat || !gravida || !paritas || !abortus) {
      Alert.alert("Error", "Harap isi semua field (kecuali No. Reg).");
      return;
    }

    setIsLoading(true);

    try {
      const body = JSON.stringify({
        nama: nama,
        umur: umur,
        no_reg: noReg,
        alamat: alamat,
        gravida: gravida,
        paritas: paritas,
        abortus: abortus
      });

      const response = await fetch(
        `http://10.0.2.2:8000/api/bidan/register-pasien`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          },
          body: body
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422 && data.errors) {
          const firstError = Object.values(data.errors)[0][0];
          throw new Error(firstError || "Data tidak valid.");
        }
        throw new Error(data.message || "Gagal mendaftarkan pasien.");
      }

      setIsLoading(false);
      Alert.alert("Sukses", "Pasien baru berhasil didaftarkan.");
      onSuccess();
    } catch (error) {
      setIsLoading(false);
      Alert.alert("Registrasi Gagal", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.modalOverlay}
    >
      <View style={styles.formContainer}>
        {/* Header Form */}
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Tambah Pasien Baru</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-circle" size={30} color="#e0e0e0" />
          </TouchableOpacity>
        </View>

        <ScrollView>
          {/* Form Inputs */}
          <Text style={styles.label}>Nama Lengkap</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan nama lengkap pasien"
            value={nama}
            onChangeText={setNama}
          />

          <Text style={styles.label}>Umur</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan umur (angka)"
            value={umur}
            onChangeText={setUmur}
            keyboardType="numeric"
          />

          <Text style={styles.label}>No. Registrasi (Opsional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: 301"
            value={noReg}
            onChangeText={setNoReg}
          />

          <Text style={styles.label}>Alamat</Text>
          <TextInput
            style={styles.input}
            placeholder="Masukkan alamat lengkap"
            value={alamat}
            onChangeText={setAlamat}
            multiline
          />

          <Text style={styles.label}>Gravida</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: 1"
            value={gravida}
            onChangeText={setGravida}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Paritas</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: 0"
            value={paritas}
            onChangeText={setParitas}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Abortus</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: 0"
            value={abortus}
            onChangeText={setAbortus}
            keyboardType="numeric"
          />

          {/* Tombol Submit */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Daftarkan Pasien</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end"
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: "85%"
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 10
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333"
  },
  label: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
    marginTop: 10
  },
  input: {
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 15,
    minHeight: 45,
    fontSize: 14,
    textAlignVertical: "top"
  },
  submitButton: {
    backgroundColor: "#448AFF",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 25,
    marginBottom: 20
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold"
  }
});
