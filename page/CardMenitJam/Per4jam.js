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
  Pressable
} from "react-native";
import { useParams, useNavigate } from "react-router-native";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Feather
} from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

// Import fungsi notifikasi
import { scheduleVTReminder } from "../../src/NotificationService";

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
  chipTextActive: "#FFFFFF"
};

// HELPER: Format Tanggal SQL
const formatToDbDate = (date) => {
  const pad = (n) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`;
};

// ------------------ COMPONENT: CUSTOM MODAL ALERT ------------------
function CustomAlertModal({
  isVisible,
  onClose,
  title,
  message,
  type = "info"
}) {
  const iconMap = {
    danger: { name: "alert-triangle", color: THEME.danger },
    success: { name: "check-circle", color: THEME.success },
    info: { name: "info", color: THEME.primary }
  };
  const { name, color: iconColor } = iconMap[type] || iconMap.info;
  return (
    <Modal
      transparent
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
          <TouchableOpacity
            style={[
              modalStyles.button,
              { backgroundColor: iconColor, minWidth: "60%" }
            ]}
            onPress={onClose}
          >
            <Text style={modalStyles.buttonText}>TUTUP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ------------------ COMPONENT: CHIP PICKER ------------------
function MedicalChipPicker({ label, value, onChange, options }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipContainer}>
        {options.map((op, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => onChange(op.value)}
            style={[styles.chip, value == op.value && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                value == op.value && styles.chipTextActive
              ]}
            >
              {op.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// HELPER: LOGIC PESAN MOLASE BERWARNA
const getMolaseDescription = (val) => {
  if (val === "" || val === null) return null;
  const intVal = parseInt(val);
  switch (intVal) {
    case 0:
      return {
        text: "0 (Tulang Kepala Janin Terpisah)",
        color: "green",
        bg: "#E8F5E9",
        icon: "check-circle"
      };
    case 1:
      return {
        text: "1 (Tulang Kepala Janin Bersentuhan)",
        color: "#FBC02D",
        bg: "#FFF9C4",
        icon: "info"
      };
    case 2:
      return {
        text: "2 (Tumpang Tindih Tetapi Masih Dapat Dipisahkan)",
        color: "#F57C00",
        bg: "#FFE0B2",
        icon: "alert-circle"
      };
    case 3:
      return {
        text: "3 (Tumpang Tindih Dan Tidak Dapat Dipisahkan)",
        color: "#D32F2F",
        bg: "#FFEBEE",
        icon: "alert-octagon"
      };
    default:
      return null;
  }
};

export default function Per4jam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const namaPasien = location.state?.name || "Ibu";

  const [userToken, setUserToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({});

  const [form, setForm] = useState({
    pembukaan: "",
    penurunan: "",
    penyusupan: "",
    warnaKetuban: "",
    sistolik: "",
    diastolik: "",
    suhu: "",
    urine: "",
    obat: "",
    protein: "-",
    aseton: "-"
  });

  const [waktuCatat, setWaktuCatat] = useState(new Date());
  const [isPickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem("userToken");
      setUserToken(token ? token.trim() : null);
    })();
  }, []);

  const handleChange = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async () => {
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
        title: "Data Kurang",
        message: "Mohon lengkapi semua observasi utama.",
        type: "info"
      });
      setModalVisible(true);
      return;
    }

    setLoading(true);
    try {
      const safeInt = (v) => {
        const p = parseInt(v);
        return isNaN(p) ? null : p;
      };

      const payload = {
        partograf_id: id,
        waktu_catat: formatToDbDate(waktuCatat),
        pembukaan_servik: safeInt(form.pembukaan),
        penurunan_kepala: safeInt(form.penurunan),
        molase: form.penyusupan.toString(),
        air_ketuban: form.warnaKetuban,
        sistolik: safeInt(form.sistolik),
        diastolik: safeInt(form.diastolik),
        suhu_ibu: form.suhu,
        volume_urine: safeInt(form.urine),
        obat_cairan: form.obat || null,
        protein: form.protein === "-" ? null : form.protein,
        aseton: form.aseton === "-" ? null : form.aseton,
        djj: null,
        nadi_ibu: null
      };

      const res = await fetch(
        `https://restful-api-bmc-production-v2.up.railway.app/api/partograf/${id}/catatan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${userToken}`
          },
          body: JSON.stringify(payload)
        }
      );

      if (res.ok) {
        try {
          if (typeof scheduleVTReminder === "function") {
            await scheduleVTReminder(namaPasien, waktuCatat);
          }
        } catch (e) {}
        setModalContent({
          title: "Sukses",
          message: "Data pemeriksaan berhasil disimpan.",
          type: "success",
          onClose: () => {
            setModalVisible(false);
            navigate(-1);
          }
        });
      } else {
        const errorJson = await res.json();
        setModalContent({
          title: "Gagal",
          message: errorJson.message || "Gagal menyimpan ke database.",
          type: "danger"
        });
      }
    } catch (e) {
      setModalContent({
        title: "Masalah Koneksi",
        message: "Gagal terhubung ke Railway.",
        type: "danger"
      });
    } finally {
      setLoading(false);
      setModalVisible(true);
    }
  };

  const molaseDesc = getMolaseDescription(form.penyusupan);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <CustomAlertModal
        isVisible={modalVisible}
        onClose={() =>
          modalContent.onClose ? modalContent.onClose() : setModalVisible(false)
        }
        {...modalContent}
      />

      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigate(-1)}>
          <MaterialIcons name="arrow-back" size={24} color={THEME.textMain} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Periksa Dalam</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.medicalCard}>
            <Text style={styles.fieldLabel}>Waktu Periksa</Text>
            <TouchableOpacity
              onPress={() => setPickerVisible(true)}
              style={styles.medInput}
            >
              <Text>{waktuCatat.toLocaleString()}</Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isPickerVisible}
              mode="datetime"
              date={waktuCatat}
              onConfirm={(d) => {
                setWaktuCatat(d);
                setPickerVisible(false);
              }}
              onCancel={() => setPickerVisible(false)}
            />
          </View>

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
              label="Pembukaan (cm)"
              value={form.pembukaan}
              onChange={(v) => handleChange("pembukaan", v)}
              options={Array.from({ length: 7 }, (_, i) => ({
                label: (i + 4).toString(),
                value: (i + 4).toString()
              }))}
            />
            <MedicalChipPicker
              label="Penurunan"
              value={form.penurunan}
              onChange={(v) => handleChange("penurunan", v)}
              options={["5", "4", "3", "2", "1", "0"].map((v) => ({
                label: v,
                value: v
              }))}
            />
            <MedicalChipPicker
              label="Penyusupan (Molase)"
              value={form.penyusupan}
              onChange={(v) => handleChange("penyusupan", v)}
              options={["0", "1", "2", "3"].map((v) => ({
                label: v,
                value: v
              }))}
            />

            {/* FITUR YANG DIKEMBALIKAN: INFO BOX MOLASE */}
            {molaseDesc && (
              <View
                style={[
                  styles.molaseInfo,
                  {
                    backgroundColor: molaseDesc.bg,
                    borderColor: molaseDesc.color
                  }
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
          </View>

          <View style={styles.medicalCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="water"
                size={20}
                color={THEME.accent}
              />
              <Text style={[styles.cardTitle, { color: THEME.accent }]}>
                AIR KETUBAN
              </Text>
            </View>
            <MedicalChipPicker
              label="Kondisi"
              value={form.warnaKetuban}
              onChange={(v) => handleChange("warnaKetuban", v)}
              options={[
                { label: "Jernih(J)", value: "J" },
                { label: "Utuh(U)", value: "U" },
                { label: "Mekonium(M)", value: "M" },
                { label: "Darah(D)", value: "D" },
                { label: "Kering(K)", value: "K" }
              ]}
            />
          </View>

          <View style={styles.medicalCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="heart-flash"
                size={20}
                color={THEME.danger}
              />
              <Text style={[styles.cardTitle, { color: THEME.danger }]}>
                VITAL IBU
              </Text>
            </View>
            <View style={styles.inputRow}>
              <View style={styles.halfInput}>
                <Text style={styles.fieldLabel}>Sistolik</Text>
                <TextInput
                  style={styles.medInput}
                  value={form.sistolik}
                  onChangeText={(t) => handleChange("sistolik", t)}
                  keyboardType="numeric"
                  placeholder="120"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.fieldLabel}>Diastolik</Text>
                <TextInput
                  style={styles.medInput}
                  value={form.diastolik}
                  onChangeText={(t) => handleChange("diastolik", t)}
                  keyboardType="numeric"
                  placeholder="80"
                />
              </View>
            </View>
            <View style={{ marginTop: 16 }}>
              <Text style={styles.fieldLabel}>Suhu Tubuh (°C)</Text>
              <TextInput
                style={styles.medInput}
                value={form.suhu}
                onChangeText={(t) => handleChange("suhu", t)}
                keyboardType="numeric"
                placeholder="37.0"
              />
            </View>
          </View>

          <View style={styles.medicalCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="pill" size={20} color="#6A1B9A" />
              <Text style={[styles.cardTitle, { color: "#6A1B9A" }]}>
                TERAPI & URINE
              </Text>
            </View>
            <Text style={styles.fieldLabel}>Obat & Cairan IV</Text>
            <TextInput
              style={styles.medInput}
              value={form.obat}
              onChangeText={(t) => handleChange("obat", t)}
              placeholder="RL 10 tetes..."
            />
            <View style={{ marginTop: 16 }}>
              <Text style={styles.fieldLabel}>Urine (ml)</Text>
              <TextInput
                style={styles.medInput}
                value={form.urine}
                onChangeText={(t) => handleChange("urine", t)}
                keyboardType="numeric"
                placeholder="120"
              />
            </View>
            <View style={{ marginTop: 16 }}>
              <MedicalChipPicker
                label="Protein"
                value={form.protein}
                onChange={(v) => handleChange("protein", v)}
                options={["-", "+", "++", "+++"].map((v) => ({
                  label: v,
                  value: v
                }))}
              />
            </View>
            <View style={{ marginTop: 8 }}>
              <MedicalChipPicker
                label="Aseton"
                value={form.aseton}
                onChange={(v) => handleChange("aseton", v)}
                options={["-", "+"].map((v) => ({
                  label: v,
                  value: v
                }))}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>SIMPAN PEMERIKSAAN</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: THEME.border
  },
  appBarTitle: { fontSize: 16, fontWeight: "bold", color: THEME.textMain },
  scrollContent: { padding: 16, paddingBottom: 40 },
  medicalCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
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
    fontWeight: "bold",
    color: THEME.primary,
    marginLeft: 8
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
    padding: 12,
    backgroundColor: THEME.inputBg,
    fontSize: 15
  },
  chipContainer: { flexDirection: "row", flexWrap: "wrap" },
  chip: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#FFF"
  },
  chipActive: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  chipText: { fontSize: 13, color: THEME.textSec, fontWeight: "bold" },
  chipTextActive: { color: "#FFF" },
  submitBtn: {
    backgroundColor: THEME.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20
  },
  submitBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
  // STYLING INFO BOX
  molaseInfo: {
    marginTop: -8,
    marginBottom: 16,
    flexDirection: "row",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "flex-start"
  },
  molaseText: { fontSize: 12, fontWeight: "bold", flex: 1 }
});

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20
  },
  alertBox: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 30,
    alignItems: "center"
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
    marginBottom: 30
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center"
  },
  buttonText: { color: "#FFF", fontWeight: "bold" }
});
