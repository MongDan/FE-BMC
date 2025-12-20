import React, { useState, useRef } from "react"; // <--- Tambah useRef
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const THEME = {
  bg: "#F4F6F8",
  primary: "#448AFF",
  textMain: "#263238",
  textSec: "#78909C",
  border: "#ECEFF1",
  inputBg: "#F8F9FA",
  activeInput: "#E3F2FD",
  success: "#4CAF50",
  error: "#D32F2F",
  warning: "#FFA000"
};

const { height } = Dimensions.get("window");

export default function TambahPasienForm({ onClose, onSuccess, token }) {
  // === REFS UNTUK FOCUS FLOW ===
  const refUmur = useRef(null);
  const refNoReg = useRef(null);
  const refAlamat = useRef(null);
  const refGravida = useRef(null);
  const refParitas = useRef(null);
  const refAbortus = useRef(null);

  // === STATE DATA PASIEN (TIDAK BERUBAH) ===
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

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "success",
    title: "",
    message: ""
  });

  const showCustomAlert = (type, title, message) => {
    setAlertConfig({ visible: true, type, title, message });
  };

  const handleCloseAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
    if (alertConfig.type === "success") {
      onSuccess();
    }
  };

  const handleShowPicker = (picker) => {
    setCurrentPicker(picker);
    setShowPicker(true);
  };

  const handleConfirmPicker = (date) => {
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date - offset)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    if (currentPicker === "pemeriksaan") setTglJamPemeriksaan(localISOTime);
    if (currentPicker === "ketuban") setJamKetubanPecah(localISOTime);
    if (currentPicker === "mules") setTglJamMules(localISOTime);
    setShowPicker(false);
  };

  const handleCancelPicker = () => setShowPicker(false);

  // --- Logic Submit (TIDAK BERUBAH) ---
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
      showCustomAlert(
        "warning",
        "Data Belum Lengkap",
        "Mohon lengkapi semua kolom."
      );
      return;
    }

    setIsLoading(true);
    try {
      const registerBody = JSON.stringify({
        nama,
        umur,
        no_reg: noReg || null,
        alamat,
        gravida,
        paritas,
        abortus
      });
      const regResponse = await fetch(
        `https://restful-api-bmc-production-v2.up.railway.app/api/bidan/register-pasien`,
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
      if (!regResponse.ok)
        throw new Error(regData.message || "Gagal mendaftarkan pasien.");

      const pasienId = regData.pasien ? regData.pasien.no_reg : regData.no_reg;
      const laborBody = JSON.stringify({
        tanggal_jam_rawat: tglJamPemeriksaan,
        ketuban_pecah: ketubanPecah,
        tanggal_jam_ketuban_pecah: ketubanPecah ? jamKetubanPecah : null,
        tanggal_jam_mules: tglJamMules
      });

      const laborResponse = await fetch(
        `https://restful-api-bmc-production-v2.up.railway.app/api/bidan/pasien/${pasienId}/mulai-persalinan`,
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
      if (!laborResponse.ok) throw new Error("Gagal mulai persalinan.");

      setIsLoading(false);
      showCustomAlert("success", "Registrasi Berhasil", "Data telah disimpan.");
    } catch (error) {
      setIsLoading(false);
      showCustomAlert("error", "Terjadi Kesalahan", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.modalOverlay}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View style={styles.formCard}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Registrasi Pasien</Text>
            <Text style={styles.headerSubtitle}>
              Lengkapi data rekam medis baru
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={THEME.textSec} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollArea}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled" // Agar tap input tidak terganggu
        >
          <Text style={styles.sectionLabel}>IDENTITAS PASIEN</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Lengkap</Text>
            <TextInput
              style={styles.input}
              placeholder="Nama Pasien"
              value={nama}
              onChangeText={setNama}
              returnKeyType="next"
              onSubmitEditing={() => refUmur.current.focus()} // Pindah ke Umur
              blurOnSubmit={false}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 0.4, marginRight: 10 }]}>
              <Text style={styles.label}>Umur</Text>
              <TextInput
                ref={refUmur}
                style={styles.input}
                placeholder="Thn"
                value={umur}
                onChangeText={setUmur}
                keyboardType="numeric"
                returnKeyType="next"
                onSubmitEditing={() => refNoReg.current.focus()} // Pindah ke No Reg
                blurOnSubmit={false}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>No. Reg (Opsional)</Text>
              <TextInput
                ref={refNoReg}
                style={styles.input}
                placeholder="Otomatis jika kosong"
                value={noReg}
                onChangeText={(text) => setNoReg(text.replace(/[^0-9-]/g, ""))}
                keyboardType="numeric"
                returnKeyType="next"
                onSubmitEditing={() => refAlamat.current.focus()} // Pindah ke Alamat
                blurOnSubmit={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Alamat Lengkap</Text>
            <TextInput
              ref={refAlamat}
              style={[
                styles.input,
                { height: 80, textAlignVertical: "top", paddingTop: 10 }
              ]}
              placeholder="Jalan, No. Rumah, RT/RW"
              value={alamat}
              onChangeText={setAlamat}
              multiline
            />
          </View>

          <Text style={styles.sectionLabel}>RIWAYAT OBSTETRI (G-P-A)</Text>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Gravida</Text>
              <TextInput
                ref={refGravida}
                style={styles.input}
                placeholder="0"
                value={gravida}
                onChangeText={setGravida}
                keyboardType="numeric"
                returnKeyType="next"
                onSubmitEditing={() => refParitas.current.focus()}
                blurOnSubmit={false}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Paritas</Text>
              <TextInput
                ref={refParitas}
                style={styles.input}
                placeholder="0"
                value={paritas}
                onChangeText={setParitas}
                keyboardType="numeric"
                returnKeyType="next"
                onSubmitEditing={() => refAbortus.current.focus()}
                blurOnSubmit={false}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Abortus</Text>
              <TextInput
                ref={refAbortus}
                style={styles.input}
                placeholder="0"
                value={abortus}
                onChangeText={setAbortus}
                keyboardType="numeric"
                returnKeyType="done"
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>DATA KLINIS MASUK</Text>

          <TouchableOpacity
            style={styles.datePickerBtn}
            onPress={() => handleShowPicker("pemeriksaan")}
          >
            <View>
              <Text style={styles.label}>Waktu Pemeriksaan</Text>
              <Text
                style={[
                  styles.dateText,
                  !tglJamPemeriksaan && { color: "#B0BEC5" }
                ]}
              >
                {tglJamPemeriksaan || "Pilih Tanggal & Jam"}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={24}
              color={THEME.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.datePickerBtn}
            onPress={() => handleShowPicker("mules")}
          >
            <View>
              <Text style={styles.label}>Mulai Mules (His)</Text>
              <Text
                style={[styles.dateText, !tglJamMules && { color: "#B0BEC5" }]}
              >
                {tglJamMules || "Pilih Tanggal & Jam"}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="timer-sand"
              size={24}
              color={THEME.primary}
            />
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status Ketuban</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioBtn,
                  ketubanPecah === true && styles.radioBtnActive
                ]}
                onPress={() => setKetubanPecah(true)}
              >
                <Text
                  style={[
                    styles.radioText,
                    ketubanPecah === true && styles.radioTextActive
                  ]}
                >
                  Ya
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.radioBtn,
                  ketubanPecah === false && styles.radioBtnActive
                ]}
                onPress={() => {
                  setKetubanPecah(false);
                  setJamKetubanPecah("");
                }}
              >
                <Text
                  style={[
                    styles.radioText,
                    ketubanPecah === false && styles.radioTextActive
                  ]}
                >
                  Tidak
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {ketubanPecah === true && (
            <TouchableOpacity
              style={[
                styles.datePickerBtn,
                { borderColor: "#E65100", backgroundColor: "#FFF3E0" }
              ]}
              onPress={() => handleShowPicker("ketuban")}
            >
              <View>
                <Text style={[styles.label, { color: "#E65100" }]}>
                  Waktu Ketuban Pecah
                </Text>
                <Text
                  style={[
                    styles.dateText,
                    !jamKetubanPecah && { color: "#FFCC80" }
                  ]}
                >
                  {jamKetubanPecah || "Pilih Waktu Kejadian"}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="water-alert"
                size={24}
                color="#E65100"
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>SIMPAN DATA PASIEN</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        <DateTimePickerModal
          isVisible={showPicker}
          mode="datetime"
          onConfirm={handleConfirmPicker}
          onCancel={handleCancelPicker}
          is24Hour={true}
          display={Platform.OS === "ios" ? "spinner" : "default"}
        />

        {/* Modal Alert (Tetap Sama) */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={alertConfig.visible}
          onRequestClose={handleCloseAlert}
        >
          <View style={styles.alertOverlay}>
            <View style={styles.alertBox}>
              <View
                style={[
                  styles.alertIconCircle,
                  {
                    backgroundColor:
                      alertConfig.type === "error"
                        ? "#FFEBEE"
                        : alertConfig.type === "warning"
                        ? "#FFF8E1"
                        : "#E8F5E9"
                  }
                ]}
              >
                <MaterialCommunityIcons
                  name={
                    alertConfig.type === "error"
                      ? "alert-circle-outline"
                      : alertConfig.type === "warning"
                      ? "alert-outline"
                      : "check-circle-outline"
                  }
                  size={40}
                  color={
                    alertConfig.type === "error"
                      ? THEME.error
                      : alertConfig.type === "warning"
                      ? THEME.warning
                      : THEME.success
                  }
                />
              </View>
              <Text style={styles.alertTitle}>{alertConfig.title}</Text>
              <Text style={styles.alertMessage}>{alertConfig.message}</Text>
              <TouchableOpacity
                style={[
                  styles.alertButton,
                  {
                    backgroundColor:
                      alertConfig.type === "error"
                        ? THEME.error
                        : alertConfig.type === "warning"
                        ? THEME.warning
                        : THEME.success
                  }
                ]}
                onPress={handleCloseAlert}
              >
                <Text style={styles.alertButtonText}>
                  {alertConfig.type === "success" ? "SELESAI" : "MENGERTI"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

// STYLES TETAP SAMA SEPERTI ASLI (Hanya optimasi kecil pada KeyboardAvoidingView)
const styles = StyleSheet.create({
  // ... Copy semua styles lu yang lama di sini tanpa perubahan ...
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end"
  },
  formCard: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.85,
    padding: 20
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: THEME.textMain },
  headerSubtitle: { fontSize: 12, color: THEME.textSec, marginTop: 2 },
  closeBtn: { padding: 5 },
  scrollArea: { flex: 1 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.primary,
    marginTop: 10,
    marginBottom: 15,
    letterSpacing: 1
  },
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 12,
    color: THEME.textSec,
    fontWeight: "600",
    marginBottom: 6
  },
  input: {
    backgroundColor: THEME.inputBg,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: THEME.textMain
  },
  row: { flexDirection: "row" },
  datePickerBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  dateText: {
    fontSize: 14,
    fontWeight: "bold",
    color: THEME.textMain,
    marginTop: 2
  },
  radioGroup: { flexDirection: "row", gap: 10 },
  radioBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.inputBg,
    alignItems: "center"
  },
  radioBtnActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary
  },
  radioText: { fontSize: 14, color: THEME.textSec, fontWeight: "600" },
  radioTextActive: { color: "#FFF" },
  submitBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30
  },
  submitBtnText: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  alertBox: {
    width: "80%",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 25,
    alignItems: "center"
  },
  alertIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center"
  },
  alertMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20
  },
  alertButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 120,
    alignItems: "center"
  },
  alertButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 14 }
});
