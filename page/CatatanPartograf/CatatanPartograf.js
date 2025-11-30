import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
  Modal,
} from "react-native";
import { useParams, useNavigate, useLocation } from "react-router-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
} from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";

// ======================= MEDICAL THEME ==========================
const THEME = {
  bg: "#F4F6F8",
  primary: "#0277BD", // Biru
  accent: "#00897B", // Hijau
  danger: "#E53935", // Merah
  warning: "#FFB300", // Kuning/Jingga
  textMain: "#263238",
  textSec: "#78909C",
  cardBg: "#FFFFFF",
  border: "#ECEFF1",
  inputBg: "#FAFAFA",
  activeInput: "#0277BD",
  placeholder: "#B0BEC5",
};

// ======================= HELPER FUNCTIONS ==========================
// Fungsi untuk mendapatkan Waktu Lokal (bukan UTC)
const getLocalDatetime = () => {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours()); // Mengambil jam lokal device
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
  cancelText = "Tutup",
}) {
  const iconMap = {
    danger: { name: "alert-triangle", color: THEME.danger },
    success: { name: "check-circle", color: THEME.accent },
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

// ------------------ COMPONENT: FORM INPUT ------------------
function FormInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  keyboardType = "default",
  suffix,
  isDateTime = false,
}) {
  const [showPicker, setShowPicker] = useState(false);

  const handleConfirm = (date) => {
    // Format waktu lokal manual agar konsisten
    const pad = (n) => n.toString().padStart(2, "0");
    const formatted = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds()
    )}`;

    onChange(name, formatted);
    setShowPicker(false);
  };

  if (isDateTime) {
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <Pressable
          onPress={() => setShowPicker(true)}
          style={[styles.inputWrapper, { justifyContent: "space-between" }]}
        >
          <Text style={[styles.inputField, { paddingVertical: 10 }]}>
            {value || placeholder}
          </Text>
          <Ionicons name="calendar" size={20} color={THEME.textSec} />
        </Pressable>
        <DateTimePickerModal
          isVisible={showPicker}
          mode="datetime"
          onConfirm={handleConfirm}
          onCancel={() => setShowPicker(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.inputField}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={THEME.placeholder}
          onChangeText={(val) => onChange(name, val)}
          keyboardType={keyboardType}
        />
        {suffix && <Text style={styles.inputSuffix}>{suffix}</Text>}
      </View>
    </View>
  );
}

// ------------------ COMPONENT: CHIP PICKER / DROPDOWN ------------------
function Picker({ label, value, onChangeValue, options }) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.chipContainer}>
        {options.map((item, i) => {
          const val = item.value ?? item;
          const text = item.label ?? item;
          const isActive = value === val;

          return (
            <Pressable
              key={i}
              onPress={() => onChangeValue(val)}
              style={({ pressed }) => [
                styles.chip,
                isActive && styles.chipActive,
                pressed && !isActive && { backgroundColor: "#E0E0E0" },
              ]}
            >
              {isActive && (
                <Ionicons
                  name="checkmark"
                  size={14}
                  color="#FFF"
                  style={{ marginRight: 4 }}
                />
              )}
              <Text
                style={[styles.chipText, isActive && styles.chipTextActive]}
              >
                {text}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ------------------ COMPONENT: MEDICAL CARD ------------------
function Card({ title, icon, iconColor, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: iconColor + "15" }]}>
          <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
        </View>
        <Text style={[styles.cardTitle, { color: iconColor }]}>{title}</Text>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
}

// ------------------ MAIN COMPONENT ------------------
export default function CatatanPartograf() {
  const { id } = useParams(); // Ini partografId
  const navigate = useNavigate();
  const location = useLocation();
  const noRegis = location.state?.noRegis ?? id;
  const [isLoading, setIsLoading] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // --- States untuk Modal Kustom ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({});

  useEffect(() => {
    StatusBar.setBarStyle("dark-content");
    StatusBar.setBackgroundColor("#FFF");
  }, []);

  // --- CEK DRAFT KONTRAKSI ---
  useEffect(() => {
    const checkDraft = async () => {
      const draftKey = `kontraksi_draft_${id}`;
      const draftData = await AsyncStorage.getItem(draftKey);
      if (draftData && JSON.parse(draftData).length > 0) {
        setHasDraft(true);
      }
    };
    checkDraft();
  }, [id]);

  // --- FUNGSI SYNC DRAFT ---
  const syncDraftKontraksi = async (newCatatanId, token) => {
    const draftKey = `kontraksi_draft_${id}`;
    try {
      const draftStr = await AsyncStorage.getItem(draftKey);
      if (!draftStr) return;

      const drafts = JSON.parse(draftStr);
      console.log(`Syncing ${drafts.length} drafts...`);

      for (const item of drafts) {
        await fetch(
          `https://restful-api-bmc-production.up.railway.app/api/catatan-partograf/${newCatatanId}/kontraksi`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              waktu_mulai: item.waktu_mulai,
              waktu_selesai: item.waktu_selesai,
            }),
          }
        );
      }

      await AsyncStorage.removeItem(draftKey);
      setHasDraft(false);
      console.log("Sync selesai!");
    } catch (e) {
      console.error("Sync gagal", e);
      setModalContent({
        title: "Info",
        message: "Gagal sinkronisasi kontraksi offline.",
        type: "info",
      });
      setModalVisible(true);
    }
  };

  // --- INITIAL FORM STATE ---
  const emptyForm = {
    partograf_id: id,
    waktu_catat: getLocalDatetime(), // <--- PERUBAHAN DI SINI (Pakai fungsi lokal)
    djj: "",
    pembukaan_servik: "",
    penurunan_kepala: "",
    nadi_ibu: "",
    suhu_ibu: "",
    sistolik: "",
    diastolik: "",
    aseton: "",
    protein: "",
    volume_urine: "",
    obat_cairan: "",
    air_ketuban: "",
    molase: "",
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm((prevForm) => ({ ...prevForm, partograf_id: id }));
  }, [id]);

  const handleChange = (name, value) => {
    if (["air_ketuban", "molase"].includes(name)) {
      value = value.toString().toUpperCase();
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    // === VALIDASI BAHAYA ===
    const djjNum = parseInt(form.djj);
    const sistolNum = parseInt(form.sistolik);
    const diastolNum = parseInt(form.diastolik);
    const suhuNum = parseFloat(form.suhu_ibu);
    const pembukaanSekarang = parseInt(form.pembukaan_servik);

    const prevKey = `prev_pembukaan_${id}`;
    const prevPembukaan = await AsyncStorage.getItem(prevKey);

    let dangerMessages = [];

    if (djjNum > 160) dangerMessages.push("• DJJ melebihi 160 bpm");
    if (sistolNum >= 150 || diastolNum >= 100)
      dangerMessages.push("• Tekanan darah ≥ 150/100");
    if (suhuNum > 39) dangerMessages.push("• Suhu tubuh ibu melebihi 39°C");

    if (prevPembukaan !== null && pembukaanSekarang < parseInt(prevPembukaan)) {
      dangerMessages.push("• Pembukaan servik tidak maju atau mundur");
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
      return;
    }

    // ============= SUBMIT =============
    const userToken = await AsyncStorage.getItem("userToken");
    if (!userToken) {
      setModalContent({
        title: "Akses Ditolak",
        message: "Token tidak ditemukan.",
        type: "danger",
      });
      setModalVisible(true);
      return;
    }

    if (!form.djj && !form.pembukaan_servik) {
      setModalContent({
        title: "Data Kosong",
        message: "Mohon isi setidaknya satu data vital.",
        type: "info",
      });
      setModalVisible(true);
      return;
    }

    setIsLoading(true);
    try {
      await AsyncStorage.setItem(prevKey, pembukaanSekarang.toString());

      const res = await fetch(
        `https://restful-api-bmc-production.up.railway.app/api/partograf/${id}/catatan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
            Accept: "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Terjadi kesalahan");

      const newCatatanId = json.data?.id;
      if (newCatatanId) {
        await AsyncStorage.setItem(`catatanId_${id}`, newCatatanId.toString());

        if (hasDraft) {
          await syncDraftKontraksi(newCatatanId, userToken);
        }
      }

      setModalContent({
        title: "Berhasil",
        message:
          "Catatan Partograf berhasil disimpan. Lanjut ke Monitor Kontraksi?",
        type: "confirm",
        confirmText: "Ya, Buka Monitor",
        cancelText: "Nanti Saja",
        onConfirm: () => {
          setModalVisible(false);
          navigate(`/monitor-kontraksi/${newCatatanId}/${id}`);
        },
        onClose: () => {
          setModalVisible(false);
          navigate(-1);
        },
      });
      setModalVisible(true);
    } catch (error) {
      setModalContent({
        title: "Gagal",
        message: error.message,
        type: "danger",
      });
      setModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomAlertModal
        isVisible={modalVisible}
        onClose={() => {
          if (modalContent.type === "confirm" && modalContent.onClose) {
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

      <View style={styles.header}>
        <Pressable onPress={() => navigate(-1)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={THEME.textMain} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Formulir Partograf</Text>
          <Text style={styles.headerSubtitle}>
            No. Registrasi Pasien: {noRegis}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.contentArea}
          showsVerticalScrollIndicator={false}
        >
          {hasDraft && (
            <View style={styles.draftBadge}>
              <MaterialCommunityIcons
                name="cloud-upload"
                size={16}
                color="#E65100"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.draftText}>
                Ada data kontraksi offline. Simpan data ini untuk mengupload.
              </Text>
            </View>
          )}

          {/* CARD: Vital Signs */}
          <Card
            title="Tanda Vital & Fisik"
            icon="heart-pulse"
            iconColor="#E53935"
          >
            <FormInput
              label="Waktu Catat"
              name="waktu_catat"
              value={form.waktu_catat}
              placeholder="YYYY-MM-DD HH:MM:SS"
              onChange={handleChange}
              isDateTime={true}
            />
            <Picker
              label="Pembukaan Servik (cm)"
              value={form.pembukaan_servik}
              onChangeValue={(v) => handleChange("pembukaan_servik", v)}
              options={Array.from({ length: 7 }, (_, i) => (i + 4).toString())}
            />
            <Picker
              label="Penurunan Kepala (per 5)"
              value={form.penurunan_kepala}
              onChangeValue={(v) => handleChange("penurunan_kepala", v)}
              options={["0", "1", "2", "3", "4", "5"]}
            />
            <FormInput
              label="DJJ"
              name="djj"
              value={form.djj}
              placeholder="140"
              suffix="bpm"
              keyboardType="numeric"
              onChange={handleChange}
            />
            <FormInput
              label="Nadi Ibu"
              name="nadi_ibu"
              value={form.nadi_ibu}
              placeholder="80"
              suffix="bpm"
              keyboardType="numeric"
              onChange={handleChange}
            />
            <FormInput
              label="Suhu Tubuh Ibu"
              name="suhu_ibu"
              value={form.suhu_ibu}
              placeholder="36.5"
              suffix="°C"
              keyboardType="numeric"
              onChange={handleChange}
            />
          </Card>

          {/* CARD: Laboratorium & Urin */}
          <Card
            title="Laboratorium & Urin"
            icon="test-tube"
            iconColor="#1E88E5"
          >
            <FormInput
              label="Tensi Sistole"
              name="sistolik"
              value={form.sistolik}
              placeholder="120"
              suffix="mmHg"
              keyboardType="numeric"
              onChange={handleChange}
            />
            <FormInput
              label="Tensi Diastole"
              name="diastolik"
              value={form.diastolik}
              placeholder="80"
              suffix="mmHg"
              keyboardType="numeric"
              onChange={handleChange}
            />
            <Picker
              label="Aseton Urin"
              value={form.aseton}
              onChangeValue={(v) => handleChange("aseton", v)}
              options={["-", "+"].map((v) => ({ label: v, value: v }))}
            />
            <Picker
              label="Protein Urin"
              value={form.protein}
              onChangeValue={(v) => handleChange("protein", v)}
              options={["-", "+", "++", "+++"].map((v) => ({
                label: v,
                value: v,
              }))}
            />
            <FormInput
              label="Volume Urine"
              name="volume_urine"
              value={form.volume_urine}
              placeholder="200"
              suffix="ml"
              keyboardType="numeric"
              onChange={handleChange}
            />
          </Card>

          {/* CARD: Terapi & Kondisi Janin */}
          <Card title="Terapi & Kondisi Janin" icon="pill" iconColor="#00897B">
            <FormInput
              label="Obat-obatan / Cairan Infus"
              name="obat_cairan"
              value={form.obat_cairan}
              placeholder="Cth: Oksitosin 10 IU, RL 500ml"
              onChange={handleChange}
            />
            <Picker
              label="Air Ketuban"
              value={form.air_ketuban}
              onChangeValue={(v) => handleChange("air_ketuban", v)}
              options={[
                { label: "Jernih (J)", value: "J" },
                { label: "Ketuban Belum Pecah (U)", value: "U" },
                { label: "Mekonium (M)", value: "M" },
                { label: "Darah (D)", value: "D" },
                { label: "Kering (K)", value: "K" },
              ]}
            />
            <Picker
              label="Molase (Penyusupan Kepala)"
              value={form.molase}
              onChangeValue={(v) => handleChange("molase", v)}
              options={["0", "1", "2", "3"]}
            />
          </Card>

          <Pressable
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <MaterialIcons
                  name="save"
                  size={20}
                  color="#FFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.submitText}>SIMPAN & SYNC</Text>
              </>
            )}
          </Pressable>

          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ------------------ STYLES ------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  backBtn: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: THEME.textMain },
  headerSubtitle: { fontSize: 12, color: THEME.textSec },
  contentArea: { padding: 16 },
  card: {
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#FAFAFA",
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: "700", letterSpacing: 0.5 },
  cardBody: { padding: 16 },
  inputContainer: { marginBottom: 16 },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.textSec,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.inputBg,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputField: { flex: 1, fontSize: 15, color: THEME.textMain },
  inputSuffix: {
    fontSize: 12,
    color: THEME.textSec,
    fontWeight: "600",
    marginLeft: 8,
  },
  chipContainer: { flexDirection: "row", flexWrap: "wrap" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 45,
    height: 40,
    paddingHorizontal: 12,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary,
  },
  chipText: { fontSize: 14, color: THEME.textSec, fontWeight: "600" },
  chipTextActive: { color: "#FFF", fontWeight: "600" },
  submitButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 10,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    elevation: 4,
  },
  submitText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  draftBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  draftText: { color: "#E65100", fontSize: 11, marginLeft: 8, flex: 1 },
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
    backgroundColor: THEME.cardBg,
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
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
