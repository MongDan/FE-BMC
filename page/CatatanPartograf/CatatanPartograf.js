import React, { useState, useEffect } from "react";
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
  ActivityIndicator
} from "react-native";
import { useParams, useNavigate } from "react-router-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons
} from "@expo/vector-icons";

// ======================= MEDICAL THEME ==========================
const THEME = {
  bg: "#F4F6F8",
  primary: "#0277BD",
  accent: "#00897B",
  textMain: "#263238",
  textSec: "#78909C",
  cardBg: "#FFFFFF",
  border: "#ECEFF1",
  inputBg: "#FAFAFA",
  activeInput: "#E1F5FE",
  placeholder: "#B0BEC5"
};

// ------------------ COMPONENT: FORM INPUT ------------------
function FormInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  keyboardType = "default",
  suffix
}) {
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

// ------------------ COMPONENT: CHIP PICKER ------------------
function Picker({ label, value, onChangeValue, options }) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.chipContainer}>
        {options.map((item, i) => {
          const val = item.value || item;
          const text = item.label || item;
          const isActive = value === val;

          return (
            <TouchableOpacity
              key={i}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onChangeValue(val)}
              activeOpacity={0.8}
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
            </TouchableOpacity>
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

export default function CatatanPartograf() {
  const { id } = useParams(); // ID Partograf Utama
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // STATUS BAR
  useEffect(() => {
    StatusBar.setBarStyle("dark-content");
    StatusBar.setBackgroundColor("#FFF");
  }, []);

  const emptyForm = {
    partograf_id: id,
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
    molase: ""
  };

  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    setForm((prevForm) => ({ ...prevForm, partograf_id: id }));
  }, [id]);

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    const userToken = await AsyncStorage.getItem("userToken");
    if (!userToken)
      return Alert.alert("Akses Ditolak", "Token tidak ditemukan.");

    // Simple Validation
    if (!form.djj && !form.pembukaan_servik) {
      return Alert.alert(
        "Data Kosong",
        "Mohon isi setidaknya satu data vital."
      );
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `https://restful-api-bmc-production.up.railway.app/api/partograf/${id}/catatan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`
          },
          body: JSON.stringify(form)
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Terjadi kesalahan");
      }

      // Simpan ID Catatan Baru
      const newCatatanId = json.data?.id;
      if (newCatatanId) {
        await AsyncStorage.setItem(`catatanId_${id}`, newCatatanId.toString());
      }

      Alert.alert(
        "Berhasil",
        "Catatan Partograf berhasil disimpan.",
        [{ text: "OK", onPress: () => navigate(-1) }] // Kembali setelah simpan
      );
    } catch (error) {
      Alert.alert("Gagal", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            navigate("/home-catatan", { state: { partografId: id } })
          }
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={THEME.textMain} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Formulir Partograf</Text>
          <Text style={styles.headerSubtitle}>ID Pasien: {id}</Text>
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
          {/* CARD 1: Vital Signs */}
          <Card
            title="Tanda Vital & Fisik"
            icon="heart-pulse"
            iconColor="#E53935"
          >
            <View style={styles.row}>
              <View style={styles.col}>
                <FormInput
                  label="DJJ"
                  name="djj"
                  value={form.djj}
                  placeholder="140"
                  suffix="bpm"
                  keyboardType="numeric"
                  onChange={handleChange}
                />
              </View>
              <View style={styles.col}>
                <FormInput
                  label="Nadi Ibu"
                  name="nadi_ibu"
                  value={form.nadi_ibu}
                  placeholder="80"
                  suffix="bpm"
                  keyboardType="numeric"
                  onChange={handleChange}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <FormInput
                  label="Pembukaan"
                  name="pembukaan_servik"
                  value={form.pembukaan_servik}
                  placeholder="0-10"
                  suffix="cm"
                  keyboardType="numeric"
                  onChange={handleChange}
                />
              </View>
              <View style={styles.col}>
                <FormInput
                  label="Penurunan"
                  name="penurunan_kepala"
                  value={form.penurunan_kepala}
                  placeholder="0-5"
                  suffix="Hodge"
                  keyboardType="numeric"
                  onChange={handleChange}
                />
              </View>
            </View>

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

          {/* CARD 2: Pemantauan Tambahan */}
          <Card
            title="Laboratorium & Urin"
            icon="test-tube"
            iconColor="#1E88E5"
          >
            <View style={styles.row}>
              <View style={styles.col}>
                <FormInput
                  label="Tensi Sistole"
                  name="sistolik"
                  value={form.sistolik}
                  placeholder="120"
                  suffix="mmHg"
                  keyboardType="numeric"
                  onChange={handleChange}
                />
              </View>
              <View style={styles.col}>
                <FormInput
                  label="Tensi Diastole"
                  name="diastolik"
                  value={form.diastolik}
                  placeholder="80"
                  suffix="mmHg"
                  keyboardType="numeric"
                  onChange={handleChange}
                />
              </View>
            </View>

            <Picker
              label="Aseton Urin"
              value={form.aseton}
              onChangeValue={(v) => handleChange("aseton", v)}
              options={["Negatif (-)", "Positif (+)"]}
            />

            <Picker
              label="Protein Urin"
              value={form.protein}
              onChangeValue={(v) => handleChange("protein", v)}
              options={["-", "+", "++", "+++"]}
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

          {/* CARD 3: Obat & Cairan */}
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
                { label: "Jernih (J)", value: "j" },
                { label: "Hijau (H)", value: "h" },
                { label: "Mekonium (M)", value: "m" },
                { label: "Darah (D)", value: "d" },
                { label: "Kering (K)", value: "k" }
              ]}
            />

            <Picker
              label="Molase (Penyusupan Kepala)"
              value={form.molase}
              onChangeValue={(v) => handleChange("molase", v)}
              options={["0", "1", "2", "3"]}
            />
          </Card>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
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
                <Text style={styles.submitText}>SIMPAN DATA</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },

  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: THEME.border
  },
  backBtn: { marginRight: 16, padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: THEME.textMain },
  headerSubtitle: { fontSize: 12, color: THEME.textSec },

  contentArea: { padding: 16 },

  // CARD STYLE
  card: {
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    elevation: 2
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#FAFAFA"
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12
  },
  cardTitle: { fontSize: 14, fontWeight: "700", letterSpacing: 0.5 },
  cardBody: { padding: 16 },

  // FORM INPUTS
  inputContainer: { marginBottom: 16 },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.textSec,
    marginBottom: 6
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.inputBg,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 8,
    paddingHorizontal: 12
  },
  inputField: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: THEME.textMain
  },
  inputSuffix: {
    fontSize: 12,
    color: THEME.textSec,
    fontWeight: "600",
    marginLeft: 8
  },

  // GRID SYSTEM
  row: { flexDirection: "row", justifyContent: "space-between" },
  col: { width: "48%" },

  // CHIP PICKER
  chipContainer: { flexDirection: "row", flexWrap: "wrap" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8
  },
  chipActive: {
    backgroundColor: THEME.primary,
    borderColor: THEME.primary
  },
  chipText: { fontSize: 12, color: THEME.textSec, fontWeight: "600" },
  chipTextActive: { color: "#FFF" },

  // SUBMIT BUTTON
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
    elevation: 4
  },
  submitText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1
  }
});
