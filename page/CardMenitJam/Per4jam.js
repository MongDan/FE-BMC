import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-native";
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
  Modal,
  Pressable,
} from "react-native";
import { useParams, useNavigate } from "react-router-native";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
} from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleVTReminder } from "../../src/NotificationService";

// ======================= MEDICAL THEME ==========================
const THEME = {
  bg: "#F4F6F8",
  card: "#FFFFFF",
  primary: "#0277BD",
  accent: "#00897B",
  success: "#2E7D32",
  danger: "#E53935",
  warning: "#FFB300",
  textMain: "#263238",
  textSec: "#78909C",
  border: "#CFD8DC",
  inputBg: "#FAFAFA",
  chipActive: "#0277BD",
  chipTextActive: "#FFFFFF",
  chipInactive: "#FFFFFF",
};

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
  type = "info",
  confirmText,
  onConfirm,
  cancelText = "Tutup",
}) {
  const iconMap = {
    danger: { name: "alert-triangle", color: THEME.danger },
    success: { name: "check-circle", color: THEME.success },
    info: { name: "info", color: THEME.primary },
    confirm: { name: "help-circle", color: THEME.warning },
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
              { backgroundColor: iconColor + "15" },
            ]}
          >
            <Feather name={name} size={30} color={iconColor} />
          </View>
          <Text style={modalStyles.title}>{title}</Text>
          <Text style={modalStyles.message}>{message}</Text>
          <View style={modalStyles.buttonContainer}>
            {type === "confirm" ? (
              <>
                <Pressable
                  style={[
                    modalStyles.button,
                    modalStyles.ghostButton,
                    { flex: 1 },
                  ]}
                  onPress={onClose}
                >
                  <Text style={modalStyles.ghostButtonText}>{cancelText}</Text>
                </Pressable>
                <Pressable
                  style={[
                    modalStyles.button,
                    {
                      backgroundColor: mainButtonColor,
                      flex: 1,
                      marginLeft: 10,
                    },
                  ]}
                  onPress={onConfirm}
                >
                  <Text style={modalStyles.buttonText}>{confirmText}</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                style={[
                  modalStyles.button,
                  { backgroundColor: singleButtonColor, minWidth: "50%" },
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

// ======================= HELPER: MOLASE DESCRIPTION ==========================
// Ini logic deskripsi sesuai request lu
const getMolaseDescription = (val) => {
  const intVal = parseInt(val);
  switch (intVal) {
    case 0:
      return {
        text: "0 (Tulang Kepala Janin Terpisah)",
        color: "green",
        bg: "#E8F5E9",
        icon: "check-circle",
      };
    case 1:
      return {
        text: "1 (Tulang Kepala Janin Bersentuhan)",
        color: "#FBC02D", // Kuning Gelap
        bg: "#FFF9C4",
        icon: "info",
      };
    case 2:
      return {
        text: "2 (Tulang Kepala Janin Tumpang Tindih Tetapi Masih Dapat Dipisahkan)",
        color: "#F57C00", // Orange
        bg: "#FFE0B2",
        icon: "alert-circle",
      };
    case 3:
      return {
        text: "3 (Tulang Kepala Janin Tumpang Tindih Dan Tidak Dapat Dipisahkan)",
        color: "#D32F2F", // Merah Bahaya
        bg: "#FFEBEE",
        icon: "alert-octagon",
      };
    default:
      return null;
  }
};

export default function Per4jam() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [userToken, setUserToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({});

  const location = useLocation();
  // 2. Ambil nama
  const namaPasien = location.state?.name || "Ibu";

  const [form, setForm] = useState({
    pembukaan: "",
    penurunan: "",
    penyusupan: "",
    warnaKetuban: "",
    sistolik: "",
    diastolik: "",
    suhu: "",
  });

  const [waktuCatat, setWaktuCatat] = useState(new Date());
  const [isPickerVisible, setPickerVisible] = useState(false);

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

  const handleSubmit = async () => {
    const sistolikNum = parseInt(form.sistolik);
    const diastolikNum = parseInt(form.diastolik);
    const suhuNum = parseFloat(form.suhu);
    let dangerMessages = [];

    if (sistolikNum >= 150 || diastolikNum >= 100)
      dangerMessages.push("• Tekanan darah ≥ 150/100 mmHg ");
    if (suhuNum > 38.5)
      dangerMessages.push(
        `• Suhu tubuh ibu ${suhuNum}°C melebihi batas aman 38.5°C `
      );
    if (suhuNum < 36.0 && suhuNum > 0)
      dangerMessages.push(
        `• Suhu tubuh ibu ${suhuNum}°C di bawah batas aman 36.0°C `
      );

    // Validasi Molase 3 (Bahaya Obstruksi)
    if (form.penyusupan === "3") {
      dangerMessages.push("• Molase 3: Bahaya Obstruksi Persalinan!");
    }

    if (dangerMessages.length > 0) {
      setModalContent({
        title: "Kondisi Bahaya Terdeteksi",
        message: dangerMessages.join("\n"),
        type: "danger",
        cancelText: "Mengerti",
        onConfirm: null,
      });
      setModalVisible(true);
      // Untuk safety, kalau molase 3 sebaiknya jangan di-return langsung biar data tetep kesimpen tapi warning muncul.
      // Tapi kalau mau strict (gak boleh simpan), biarkan return.
      // Disini gue biarkan return biar user 'Mengerti' dulu.
      return;
    }

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
        cancelText: "OK",
      });
      setModalVisible(true);
      return;
    }

    if (!userToken) {
      setModalContent({
        title: "Akses Ditolak",
        message: "Sesi habis, silakan login ulang.",
        type: "danger",
        cancelText: "Tutup",
      });
      setModalVisible(true);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        partograf_id: id,
        waktu_catat: toLocalISOString(waktuCatat),
        pembukaan_servik: form.pembukaan,
        penurunan_kepala: form.penurunan,
        molase: form.penyusupan,
        air_ketuban: form.warnaKetuban,
        sistolik: form.sistolik,
        diastolik: form.diastolik,
        suhu_ibu: form.suhu,
      };

      const res = await fetch(
        `https://restful-api-bmc-production.up.railway.app/api/partograf/${id}/catatan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const textResponse = await res.text();
      let json;
      try {
        json = JSON.parse(textResponse);
      } catch (e) {
        throw new Error(textResponse);
      }

      if (res.ok) {
        // Kirim waktuCatat ke fungsi notifikasi
        await scheduleVTReminder(namaPasien, waktuCatat);
        setModalContent({
          title: "Sukses",
          message: "Data Periksa Dalam berhasil disimpan.",
          type: "success",
          cancelText: "OK",
          onClose: () => {
            setModalVisible(false);
            navigate(-1);
          },
        });
        setModalVisible(true);
      } else {
        setModalContent({
          title: "Gagal",
          message: json.message || "Terjadi kesalahan.",
          type: "danger",
          cancelText: "Tutup",
        });
        setModalVisible(true);
      }
    } catch (error) {
      setModalContent({
        title: "Error",
        message: "Gagal terhubung ke server." + error.message,
        type: "danger",
        cancelText: "Tutup",
      });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const pembukaanOptions = Array.from({ length: 7 }, (_, i) => ({
    label: (i + 4).toString(),
    value: (i + 4).toString(),
  }));
  const penurunanOptions = ["5", "4", "3", "2", "1", "0"].map((val) => ({
    label: val,
    value: val,
  }));
  const penyusupanOptions = [
    { label: "0", value: "0" },
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
  ];

  // Logic Render Deskripsi Molase
  const molaseDesc = getMolaseDescription(form.penyusupan);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <CustomAlertModal
        isVisible={modalVisible}
        onClose={() =>
          modalContent.onClose ? modalContent.onClose() : setModalVisible(false)
        }
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
        <Text style={styles.appBarTitle}>Periksa Dalam</Text>
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
          {/* WAKTU CATAT */}
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

            <MedicalChipPicker
              label="Pembukaan Serviks (cm)"
              value={form.pembukaan}
              onChange={(v) => handleChange("pembukaan", v)}
              options={pembukaanOptions}
            />

            <MedicalChipPicker
              label="Penurunan Kepala (per 5)"
              value={form.penurunan}
              onChange={(v) => handleChange("penurunan", v)}
              options={penurunanOptions}
            />

            {/* --- REVISI MOLASE --- */}
            <MedicalChipPicker
              label="Penyusupan (Molase)"
              value={form.penyusupan}
              onChange={(v) => handleChange("penyusupan", v)}
              options={penyusupanOptions}
            />

            {/* DESKRIPSI DINAMIS MOLASE */}
            {molaseDesc && (
              <View
                style={[
                  styles.molaseInfo,
                  {
                    backgroundColor: molaseDesc.bg,
                    borderColor: molaseDesc.color,
                  },
                ]}
              >
                <Feather
                  name={molaseDesc.icon}
                  size={18}
                  color={molaseDesc.color}
                  style={{ marginRight: 8, marginTop: 2 }}
                />
                <Text style={[styles.molaseText, { color: molaseDesc.color }]}>
                  {molaseDesc.text}
                </Text>
              </View>
            )}
            {/* --------------------- */}
          </View>

          {/* SECTION 2: FLUIDS */}
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
                { label: "Kering (K)", value: "K" },
              ]}
            />
          </View>

          {/* SECTION 3: VITALS */}
          <View style={styles.medicalCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="doctor" size={20} color="#C2185B" />
              <Text style={[styles.cardTitle, { color: "#C2185B" }]}>
                KONDISI IBU
              </Text>
            </View>
            <View style={styles.inputRow}>
              <View style={styles.halfInput}>
                <Text style={styles.fieldLabel}>Sistolik (mmHg)</Text>
                <TextInput
                  style={styles.medInput}
                  value={form.sistolik}
                  onChangeText={(t) => handleChange("sistolik", t)}
                  placeholder="120"
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
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={{ marginTop: 16 }}>
              <Text style={styles.fieldLabel}>Suhu Tubuh (°C)</Text>
              <TextInput
                style={styles.medInput}
                keyboardType="numeric"
                value={form.suhu}
                onChangeText={(t) => handleChange("suhu", t)}
                placeholder="36.5"
              />
            </View>
          </View>

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
    borderBottomColor: "#E0E0E0",
  },
  appBarTitle: { fontSize: 16, fontWeight: "700", color: THEME.textMain },
  backBtn: { padding: 4 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  medicalCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.primary,
    marginLeft: 8,
  },
  inputRow: { flexDirection: "row", justifyContent: "space-between" },
  halfInput: { width: "48%" },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.textSec,
    marginBottom: 8,
  },
  medInput: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: THEME.inputBg,
    color: THEME.textMain,
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
    minWidth: 48,
  },
  chipActive: {
    backgroundColor: THEME.chipActive,
    borderColor: THEME.chipActive,
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
    elevation: 4,
  },
  submitBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },

  // Style khusus Info Molase
  molaseInfo: {
    marginTop: -8,
    marginBottom: 16,
    flexDirection: "row",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  molaseText: {
    fontSize: 12,
    fontWeight: "bold",
    flex: 1,
  },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 20,
  },
  alertBox: {
    width: "100%",
    backgroundColor: THEME.card,
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    elevation: 10,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: THEME.textMain,
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: THEME.textMain,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  ghostButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: THEME.border,
    minWidth: 120,
    marginRight: 10,
  },
  ghostButtonText: {
    color: THEME.textMain,
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
});
