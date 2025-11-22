import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useParams, useNavigate } from "react-router-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ======================= MEDICAL THEME ==========================
const THEME = {
  bg: "#F4F6F8",
  card: "#FFFFFF",
  primary: "#0277BD",
  textMain: "#263238",
  textSec: "#78909C",
  border: "#CFD8DC",
  inputBg: "#FAFAFA",
  chipActive: "#0277BD",
  chipTextActive: "#FFFFFF",
  chipInactive: "#FFFFFF",
};

// === HELPER: FIX JAM UTC KE LOKAL (WIB) ===
const toLocalISOString = (date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localTime = new Date(date.getTime() - tzOffset);
  return localTime.toISOString().slice(0, -1);
};

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

  // === STATE FORM ===
  const [form, setForm] = useState({
    pembukaan: "",
    penurunan: "",
    penyusupan: "",
    warnaKetuban: "",
    sistolik: "",
    diastolik: "",
    suhu: "",
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
      Alert.alert(
        "Data Belum Lengkap",
        "Mohon lengkapi seluruh kolom observasi."
      );
      return;
    }

    if (!userToken) {
      Alert.alert("Error", "Sesi habis, silakan login ulang.");
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
        air_ketuban: form.warnaKetuban, // Value ini sekarang sudah CAPSLOCK dari option
        sistolik: form.sistolik,
        diastolik: form.diastolik,
        suhu_ibu: form.suhu,
      };

      console.log("Sending Data:", payload);

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

      // === HANDLING ERROR HTML response (SyntaxError <) ===
      const textResponse = await res.text(); // Ambil text mentah dulu
      console.log("Response Server:", textResponse); // Cek di console apa isinya

      let json;
      try {
        json = JSON.parse(textResponse); // Coba parse ke JSON
      } catch (e) {
        // Jika gagal parse, berarti server balikin HTML error page
        Alert.alert(
          "Server Error",
          "Terjadi kesalahan di server (Invalid Format). Cek Console."
        );
        setLoading(false);
        return;
      }

      if (res.ok) {
        Alert.alert("Sukses", "Data Observasi 4 Jam berhasil disimpan.", [
          {
            text: "OK",
            onPress: () => navigate(-1),
          },
        ]);
      } else {
        Alert.alert("Gagal", json.message || "Terjadi kesalahan pada server.");
      }
    } catch (error) {
      Alert.alert("Error", "Gagal terhubung ke server. Cek koneksi internet.");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // Opsi Pembukaan 4 - 10 (Fase Aktif)
  const pembukaanOptions = Array.from({ length: 7 }, (_, i) => ({
    label: (i + 4).toString(),
    value: (i + 4).toString(),
  }));

  // Opsi Penurunan Kepala 0 - 5
  const penurunanOptions = ["0", "1", "2", "3", "4", "5"].map((val) => ({
    label: val,
    value: val,
  }));

  // Opsi Penyusupan 0 - 3
  const penyusupanOptions = [
    { label: "0", value: "0" },
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />

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

          {/* SECTION 2: FLUIDS (KETUBAN) - UPDATE VALUE KE CAPSLOCK */}
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
                // UPDATE: VALUE DIGANTI JADI HURUF KAPITAL (CAPSLOCK)
                { label: "Jernih (J)", value: "J" },
                { label: "Ketuban Belum Pecah (U)", value: "U" },
                { label: "Mekonium (M)", value: "M" },
                { label: "Darah (D)", value: "D" },
                { label: "Kering (K)", value: "K" },
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
    </View>
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
    letterSpacing: 0.5,
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
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    elevation: 4,
  },
  submitBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
