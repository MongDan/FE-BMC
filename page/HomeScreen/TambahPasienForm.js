import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";

export default function TambahPasienForm({ onClose, onSuccess, token }) {
  const [nama, setNama] = useState("");
  const [umur, setUmur] = useState("");
  const [noReg, setNoReg] = useState("");
  const [alamat, setAlamat] = useState("");
  const [gravida, setGravida] = useState("");
  const [paritas, setParitas] = useState("");
  const [abortus, setAbortus] = useState("");
  const [ketubanPecah, setKetubanPecah] = useState(null);

  const [tglJamPemeriksaan, setTglJamPemeriksaan] = useState("");
  const [jamKetubanPecah, setJamKetubanPecah] = useState("");
  const [tglJamMules, setTglJamMules] = useState("");

  const [showPicker, setShowPicker] = useState(false);
  const [currentPicker, setCurrentPicker] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleShowPicker = (picker) => {
    setCurrentPicker(picker);
    setShowPicker(true);
  };

  const handleConfirmPicker = (date) => {
    const formatted = date.toISOString().slice(0, 19).replace("T", " ");
    if (currentPicker === "pemeriksaan") setTglJamPemeriksaan(formatted);
    if (currentPicker === "ketuban") setJamKetubanPecah(formatted);
    if (currentPicker === "mules") setTglJamMules(formatted);
    setShowPicker(false);
  };

  const handleCancelPicker = () => setShowPicker(false);

  const handleSubmit = async () => {
    if (
      !nama ||
      !umur ||
      !alamat ||
      !gravida ||
      !paritas ||
      !abortus ||
      !tglJamPemeriksaan ||
      ketubanPecah === null ||
      !tglJamMules ||
      (ketubanPecah === true && !jamKetubanPecah)
    ) {
      Alert.alert("Error", "Harap isi semua field.");
      return;
    }

    setIsLoading(true);

    try {
      const registerBody = JSON.stringify({
        nama,
        umur,
        no_reg: noReg ? noReg : null,
        alamat,
        gravida,
        paritas,
        abortus
      });

      console.log("Payload Register:", registerBody);

      const regResponse = await fetch(
        `https://restful-api-bmc-production.up.railway.app/api/bidan/register-pasien`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          },
          body: registerBody
        }
      );

      const regData = await regResponse.json();
      console.log("Response Register:", JSON.stringify(regData, null, 2));


      if (!regResponse.ok) {
        if (regResponse.status === 422) {
          const errorKeys = Object.keys(regData);
          if (errorKeys.length > 0) {
            const firstKey = errorKeys[0]; 
            const firstMessage = regData[firstKey][0]; 
            throw new Error(firstMessage);
          }
        }

        throw new Error(regData.message || "Gagal mendaftarkan pasien.");
      }

      const pasienId = regData.pasien ? regData.pasien.no_reg : regData.no_reg;

      if (!pasienId) {
        throw new Error(
          "Sukses register, tapi ID Pasien tidak ditemukan di respon server."
        );
      }

      const laborBody = JSON.stringify({
        tanggal_jam_rawat: tglJamPemeriksaan,
        ketuban_pecah: ketubanPecah,
        tanggal_jam_ketuban_pecah: ketubanPecah ? jamKetubanPecah : null,
        tanggal_jam_mules: tglJamMules
      });

      const laborResponse = await fetch(
        `https://restful-api-bmc-production.up.railway.app/api/bidan/pasien/${pasienId}/mulai-persalinan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          },
          body: laborBody
        }
      );

      const laborData = await laborResponse.json();

      if (!laborResponse.ok) {
        throw new Error(
          "Data diri tersimpan, tapi data persalinan gagal: " +
            (laborData.message || "Error")
        );
      }

      // SUKSES
      setIsLoading(false);
      Alert.alert("Sukses", "Data berhasil disimpan.");
      onSuccess();
    } catch (error) {
      setIsLoading(false);
      Alert.alert("Gagal", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.modalOverlay}
    >
      <View style={styles.formContainer}>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Tambah Pasien Baru</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-circle" size={30} color="#e0e0e0" />
          </TouchableOpacity>
        </View>

        <ScrollView>
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
            placeholder="Contoh: 122-2374"
            value={noReg}
            maxLength={25}
            keyboardType={
              Platform.OS === "ios" ? "numbers-and-punctuation" : "phone-pad"
            }
            onChangeText={(text) => {
              const filtered = text.replace(/[^0-9-]/g, "");
              setNoReg(filtered);
            }}
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

          <Text style={styles.label}>Tanggal & Jam Pemeriksaan</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => handleShowPicker("pemeriksaan")}
          >
            <Text>{tglJamPemeriksaan || "Pilih tanggal & jam"}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Apakah Ketuban Pecah?</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[
                styles.buttonOption,
                ketubanPecah === true && styles.buttonOptionSelected
              ]}
              onPress={() => setKetubanPecah(true)}
            >
              <Text
                style={[
                  styles.buttonText,
                  ketubanPecah === true && styles.buttonTextSelected
                ]}
              >
                Ya
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.buttonOption,
                ketubanPecah === false && styles.buttonOptionSelected
              ]}
              onPress={() => {
                setKetubanPecah(false);
                setJamKetubanPecah("");
              }}
            >
              <Text
                style={[
                  styles.buttonText,
                  ketubanPecah === false && styles.buttonTextSelected
                ]}
              >
                Tidak
              </Text>
            </TouchableOpacity>
          </View>

          {ketubanPecah === true && (
            <>
              <Text style={styles.label}>Tanggal & Jam Ketuban Pecah</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => handleShowPicker("ketuban")}
              >
                <Text>{jamKetubanPecah || "Pilih tanggal & jam"}</Text>
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.label}>Tanggal & Jam Mulai Mules</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => handleShowPicker("mules")}
          >
            <Text>{tglJamMules || "Pilih tanggal & jam"}</Text>
          </TouchableOpacity>

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

        <DateTimePickerModal
          isVisible={showPicker}
          mode="datetime"
          onConfirm={handleConfirmPicker}
          onCancel={handleCancelPicker}
          is24Hour={true}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },
  formContainer: {
    backgroundColor: "#fff",
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
    justifyContent: "center"
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
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  },
  buttonGroup: {
    flexDirection: "row",
    marginTop: 5,
    marginBottom: 10
  },
  buttonOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginHorizontal: 5
  },
  buttonOptionSelected: {
    backgroundColor: "#448AFF",
    borderColor: "#448AFF"
  },
  buttonText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "bold"
  },
  buttonTextSelected: {
    color: "#fff"
  }
});
