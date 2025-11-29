import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal, // <-- Tambahkan Modal
  Pressable // <-- Tambahkan Pressable
} from "react-native";
import { useParams, useNavigate } from "react-router-native";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Feather // <-- Tambahkan Feather untuk ikon modal
} from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

// ======================= MEDICAL THEME ==========================
const THEME = {
  bg: "#F4F6F8",
  card: "#FFFFFF",
  primary: "#0277BD", // Biru
  accent: "#00897B", // Hijau (tidak digunakan langsung, tapi diikutkan)
  success: "#2E7D32",
  danger: "#E53935", // Merah untuk bahaya
  warning: "#FFB300",
  textMain: "#263238",
  textSec: "#78909C",
  border: "#CFD8DC",
  inputBg: "#FAFAFA",
  chipActive: "#0277BD",
  chipTextActive: "#FFFFFF",
  chipInactive: "#FFFFFF"
};

// === HELPER: FIX JAM UTC KE LOKAL (WIB) ===
const toLocalISOString = (date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localTime = new Date(date.getTime() - tzOffset);
  return localTime.toISOString().slice(0, -1);
};

// ------------------ COMPONENT: CUSTOM MODAL ALERT ------------------
function CustomAlertModal({
  isVisible,
  onClose,
  title,
  message,
  type = "info", // 'danger', 'success', 'info', 'confirm'
  confirmText,
  onConfirm,
  cancelText = "Tutup"
}) {
  const iconMap = {
    danger: { name: "alert-triangle", color: THEME.danger },
    success: { name: "check-circle", color: THEME.success }, // Success menggunakan warna hijau
    info: { name: "info", color: THEME.primary },
    confirm: { name: "help-circle", color: THEME.warning }
  };

  const { name, color: iconColor } = iconMap[type] || iconMap.info;

  const mainButtonColor =
    type === "confirm" || type === "success" ? THEME.primary : iconColor;
  const singleButtonColor = iconColor;

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.alertBox}>
          <View
            style={[
              modalStyles.iconCircle,
              { backgroundColor: iconColor + "15" }
            ]}
          >
            <Feather name={name} size={30} color={iconColor} />
          </View>
          <Text style={modalStyles.title}>{title}</Text>
          <Text style={modalStyles.message}>{message}</Text>

          <View style={modalStyles.buttonContainer}>
            {type === "confirm" ? (
              // Case: Two buttons (Cancel and Confirm)
              <>
                {/* Cancel Button (Ghost style) */}
                <Pressable
                  style={[
                    modalStyles.button,
                    modalStyles.ghostButton,
                    { flex: 1 }
                  ]}
                  onPress={onClose}
                >
                  <Text style={modalStyles.ghostButtonText}>{cancelText}</Text>
                </Pressable>
                {/* Confirm Button (Primary CTA) */}
                <Pressable
                  style={[
                    modalStyles.button,
                    {
                      backgroundColor: mainButtonColor,
                      flex: 1,
                      marginLeft: 10
                    }
                  ]}
                  onPress={onConfirm}
                >
                  <Text style={modalStyles.buttonText}>{confirmText}</Text>
                </Pressable>
              </>
            ) : (
              // Case: Single button (Info, Danger, Success)
              <Pressable
                style={[
                  modalStyles.button,
                  { backgroundColor: singleButtonColor, minWidth: "50%" }
                ]}
                onPress={onClose}
              >
                <Text style={modalStyles.buttonText}>{cancelText}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ======================= MEDICAL CHIP SELECTOR ==========================
function MedicalChipPicker({ label, value, onChange, options }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipContainer}>
        {options.map((op, idx) => {
          const isActive = value === op.value;
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => onChange(op.value)}
              activeOpacity={0.7}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              {isActive && (
                <MaterialIcons
                  name="check"
                  size={14}
                  color={THEME.chipTextActive}
                  style={{ marginRight: 4 }}
                />
              )}
              <Text
                style={[styles.chipText, isActive && styles.chipTextActive]}
              >
                {op.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function Per4jam() {
  const { id } = useParams();
  const navigate = useNavigate();

  // === STATE UNTUK API ===
  const [userToken, setUserToken] = useState(null);
  const [loading, setLoading] = useState(false);

  // === STATE MODAL KUSTOM ===
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({});

  // === STATE FORM ===
  const [form, setForm] = useState({
    pembukaan: "",
    penurunan: "",
    penyusupan: "",
    warnaKetuban: "",
    sistolik: "",
    diastolik: "",
    suhu: ""
  });

  // ==== Waktu Catat ====
  const [waktuCatat, setWaktuCatat] = useState(new Date());
  const [isPickerVisible, setPickerVisible] = useState(false);

  // 1. Load Token saat halaman dibuka
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        setUserToken(token);
      } catch (e) {
        console.error("Gagal load token");
      }
    };
    loadToken();
  }, []);

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // 2. Fungsi Submit ke API
  const handleSubmit = async () => {
    // Pastikan input berupa angka sebelum diconvert
    const sistolikNum = parseInt(form.sistolik);
    const diastolikNum = parseInt(form.diastolik);
    const suhuNum = parseFloat(form.suhu);

    // ==========================================================
    // C. VALIDASI BAHAYA KLINIS (TEKANAN DARAH & SUHU)
    // ==========================================================
    let dangerMessages = [];

    // Tekanan Darah Bahaya: Sistolik >= 150 ATAU Diastolik >= 100
    if (sistolikNum >= 150 || diastolikNum >= 100) {
      dangerMessages.push("• Tekanan darah ≥ 150/100 mmHg ");
    }

    // Suhu Bahaya 1: Suhu Tinggi (> 38.5°C)
    if (suhuNum > 38.5) {
      dangerMessages.push(
        `• Suhu tubuh ibu ${suhuNum}°C melebihi batas aman 38.5°C `
      );
    }

    // Suhu Bahaya 2: Suhu Rendah (< 36.0°C)
    // Menambahkan pengecekan suhu > 0 untuk menghindari alert saat input kosong/NaN
    if (suhuNum < 36.0 && suhuNum > 0) {
      dangerMessages.push(
        `• Suhu tubuh ibu ${suhuNum}°C di bawah batas aman 36.0°C `
      );
    }

    if (dangerMessages.length > 0) {
      setModalContent({
        title: "Kondisi Bahaya Terdeteksi",
        message: dangerMessages.join("\n"),
        type: "danger",
        cancelText: "Mengerti",
        onConfirm: null // Tidak bisa dikonfirmasi untuk lanjut simpan
      });
      setModalVisible(true);
      return;
    }
    // ==========================================================

    // A. Validasi Kelengkapan
    if (
      !form.pembukaan ||
      !form.penurunan ||
      !form.penyusupan ||
      !form.warnaKetuban ||
      !form.sistolik ||
      !form.diastolik ||
      !form.suhu
    ) {
      setModalContent({
        title: "Data Belum Lengkap",
        message: "Mohon lengkapi seluruh kolom observasi.",
        type: "info",
        cancelText: "OK"
      });
      setModalVisible(true);
      return;
    }

    if (!userToken) {
      setModalContent({
        title: "Akses Ditolak",
        message: "Sesi habis, silakan login ulang.",
        type: "danger",
        cancelText: "Tutup"
      });
      setModalVisible(true);
      return;
    }

    setLoading(true);

    try {
      // B. Mapping Data Form ke Format Backend
      const payload = {
        partograf_id: id,
        waktu_catat: toLocalISOString(waktuCatat),
        pembukaan_servik: form.pembukaan,
        penurunan_kepala: form.penurunan,
        molase: form.penyusupan,
        air_ketuban: form.warnaKetuban,
        sistolik: form.sistolik,
        diastolik: form.diastolik,
        suhu_ibu: form.suhu
      };

      console.log("Sending Data:", payload);

      const res = await fetch(
        `https://restful-api-bmc-production.up.railway.app/api/partograf/${id}/catatan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`
          },
          body: JSON.stringify(payload)
        }
      );

      // === HANDLING ERROR HTML response (SyntaxError <) ===
      const textResponse = await res.text();
      console.log("Response Server:", textResponse);

      let json;
      try {
        json = JSON.parse(textResponse);
      } catch (e) {
        if (textResponse.trim().startsWith("<")) {
          setModalContent({
            title: "Server Error",
            message:
              "Terjadi kesalahan di server (Invalid Format/HTML response). Cek Console.",
            type: "danger",
            cancelText: "Tutup"
          });
          setModalVisible(true);
          setLoading(false);
          return;
        }
        throw new Error(textResponse);
      }

      if (res.ok) {
        setModalContent({
          title: "Sukses",
          message: "Data Observasi 4 Jam berhasil disimpan.",
          type: "success",
          cancelText: "OK",
          onConfirm: () => {
            setModalVisible(false);
            navigate(-1);
          },
          onClose: () => {
            setModalVisible(false);
            navigate(-1);
          }
        });
        setModalVisible(true);
      } else {
        setModalContent({
          title: "Gagal",
          message: json.message || "Terjadi kesalahan pada server.",
          type: "danger",
          cancelText: "Tutup"
        });
        setModalVisible(true);
      }
    } catch (error) {
      setModalContent({
        title: "Error",
        message: "Gagal terhubung ke server. Cek koneksi internet.",
        type: "danger",
        cancelText: "Tutup"
      });
      setModalVisible(true);
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // Opsi Pembukaan 4 - 10 (Fase Aktif)
  const pembukaanOptions = Array.from({ length: 7 }, (_, i) => ({
    label: (i + 4).toString(),
    value: (i + 4).toString()
  }));

  // Opsi Penurunan Kepala 0 - 5
  const penurunanOptions = ["0", "1", "2", "3", "4", "5"].map((val) => ({
    label: val,
    value: val
  }));

  // Opsi Penyusupan 0 - 3
  const penyusupanOptions = [
    { label: "0", value: "0" },
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />

      {/* MODAL KUSTOM */}
      <CustomAlertModal
        isVisible={modalVisible}
        onClose={() => {
          if (modalContent.onClose) {
            modalContent.onClose();
          } else {
            setModalVisible(false);
          }
        }}
        title={modalContent.title}
        message={modalContent.message}
        type={modalContent.type}
        confirmText={modalContent.confirmText}
        onConfirm={modalContent.onConfirm}
        cancelText={modalContent.cancelText}
      />

      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigate(-1)} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={THEME.textMain} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Observasi Lanjutan (4 Jam)</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ==== WAKTU CATAT ==== */}
          <View style={styles.medicalCard}>
            <Text style={styles.fieldLabel}>Waktu Catat</Text>
            <TouchableOpacity
              onPress={() => setPickerVisible(true)}
              style={[styles.medInput, { paddingVertical: 12 }]}
            >
              <Text style={{ color: THEME.textMain }}>
                {waktuCatat.toLocaleString()}
              </Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isPickerVisible}
              mode="datetime"
              date={waktuCatat}
              onConfirm={(date) => {
                setWaktuCatat(date);
                setPickerVisible(false);
              }}
              onCancel={() => setPickerVisible(false)}
            />
          </View>

          {/* SECTION 1: CERVIX & HEAD */}
          <View style={styles.medicalCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="human-pregnant"
                size={20}
                color={THEME.primary}
              />
              <Text style={styles.cardTitle}>STATUS SERVIKS & KEPALA</Text>
            </View>

            {/* Pembukaan Serviks */}
            <MedicalChipPicker
              label="Pembukaan Serviks (cm)"
              value={form.pembukaan}
              onChange={(v) => handleChange("pembukaan", v)}
              options={pembukaanOptions}
            />

            {/* Penurunan Kepala */}
            <MedicalChipPicker
              label="Penurunan Kepala (per 5)"
              value={form.penurunan}
              onChange={(v) => handleChange("penurunan", v)}
              options={penurunanOptions}
            />

            {/* Penyusupan */}
            <MedicalChipPicker
              label="Penyusupan (Molase)"
              value={form.penyusupan}
              onChange={(v) => handleChange("penyusupan", v)}
              options={penyusupanOptions}
            />
          </View>

          {/* SECTION 2: FLUIDS (KETUBAN) */}
          <View style={styles.medicalCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="water-outline"
                size={20}
                color="#00897B"
              />
              <Text style={[styles.cardTitle, { color: "#00897B" }]}>
                CAIRAN KETUBAN
              </Text>
            </View>

            <MedicalChipPicker
              label="Kondisi / Warna"
              value={form.warnaKetuban}
              onChange={(v) => handleChange("warnaKetuban", v)}
              options={[
                { label: "Jernih (J)", value: "J" },
                { label: "Ketuban Belum Pecah (U)", value: "U" },
                { label: "Mekonium (M)", value: "M" },
                { label: "Darah (D)", value: "D" },
                { label: "Kering (K)", value: "K" }
              ]}
            />
          </View>

          {/* SECTION 3: MATERNAL VITALS (INPUT DIPISAH) */}
          <View style={styles.medicalCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="doctor" size={20} color="#C2185B" />
              <Text style={[styles.cardTitle, { color: "#C2185B" }]}>
                KONDISI IBU
              </Text>
            </View>

            {/* Baris 1: Sistolik & Diastolik Sebelahan */}
            <View style={styles.inputRow}>
              <View style={styles.halfInput}>
                <Text style={styles.fieldLabel}>Sistolik (mmHg)</Text>
                <TextInput
                  style={styles.medInput}
                  value={form.sistolik}
                  onChangeText={(t) => handleChange("sistolik", t)}
                  placeholder="120"
                  placeholderTextColor="#B0BEC5"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.fieldLabel}>Diastolik (mmHg)</Text>
                <TextInput
                  style={styles.medInput}
                  value={form.diastolik}
                  onChangeText={(t) => handleChange("diastolik", t)}
                  placeholder="80"
                  placeholderTextColor="#B0BEC5"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Baris 2: Suhu (Jarak ke atas) */}
            <View style={{ marginTop: 16 }}>
              <Text style={styles.fieldLabel}>Suhu Tubuh (°C)</Text>
              <TextInput
                style={styles.medInput}
                keyboardType="numeric"
                value={form.suhu}
                onChangeText={(t) => handleChange("suhu", t)}
                placeholder="36.5"
                placeholderTextColor="#B0BEC5"
              />
            </View>
          </View>

          {/* TOMBOL SUBMIT */}
          <TouchableOpacity
            style={styles.submitBlockBtn}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <MaterialIcons
                  name="save-alt"
                  size={20}
                  color="#FFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.submitBtnText}>VERIFIKASI & SIMPAN</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// === STYLES ===
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0"
  },
  appBarTitle: { fontSize: 16, fontWeight: "700", color: THEME.textMain },
  saveLink: { fontSize: 14, fontWeight: "bold", color: THEME.primary },
  backBtn: { padding: 4 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  medicalCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    elevation: 1
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    paddingBottom: 8
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.primary,
    marginLeft: 8,
    letterSpacing: 0.5
  },
  inputRow: { flexDirection: "row", justifyContent: "space-between" },
  halfInput: { width: "48%" },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.textSec,
    marginBottom: 8
  },
  medInput: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: THEME.inputBg,
    color: THEME.textMain
  },
  chipContainer: { flexDirection: "row", flexWrap: "wrap" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#FFF",
    minWidth: 48
  },
  chipActive: {
    backgroundColor: THEME.chipActive,
    borderColor: THEME.chipActive
  },
  chipText: { fontSize: 13, color: THEME.textSec, fontWeight: "600" },
  chipTextActive: { color: "#FFF", fontWeight: "bold" },
  submitBlockBtn: {
    backgroundColor: THEME.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 30,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    elevation: 4
  },
  submitBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 0.5
  }
});

// ------------------ STYLES: CUSTOM MODAL ------------------
const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 20
  },
  alertBox: {
    width: "100%",
    backgroundColor: THEME.card,
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: THEME.textMain,
    marginBottom: 10,
    textAlign: "center"
  },
  message: {
    fontSize: 15,
    color: THEME.textMain,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "center"
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center"
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center"
  },
  ghostButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: THEME.border,
    minWidth: 120,
    marginRight: 10
  },
  ghostButtonText: {
    color: THEME.textMain,
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center"
  }
});
