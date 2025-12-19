import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  StatusBar,
} from "react-native";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { useParams, useNavigate } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleRutinReminder } from "../../src/NotificationService"; // Sesuaikan path

const THEME = {
  bg: "#F4F6F8",
  card: "#FFFFFF",
  primary: "#0277BD",
  accent: "#C2185B",
  textMain: "#263238",
  textSec: "#78909C",
  border: "#CFD8DC",
  inputBg: "#FAFAFA",
};

const toLocalISOString = (date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localTime = new Date(date.getTime() - tzOffset);
  return localTime.toISOString().slice(0, -1);
};

export default function Per30Menit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [userToken, setUserToken] = useState(null);

  const location = useLocation();
  const namaPasien = location.state?.name || "Ibu";

  // FORM DATA
  const [waktuCatat, setWaktuCatat] = useState(new Date());
  const [djj, setDjj] = useState("");
  const [nadi, setNadi] = useState("");

  // TAMBAHAN: INPUT MANUAL KONTRAKSI
  const [hisFrekuensi, setHisFrekuensi] = useState("");
  const [hisDurasi, setHisDurasi] = useState("");

  const [isPickerVisible, setPickerVisible] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem("userToken");
      setUserToken(token);
      // Cek Draft Monitor
      const draftKey = `kontraksi_draft_${id}`;
      const draftData = await AsyncStorage.getItem(draftKey);
      if (draftData && JSON.parse(draftData).length > 0) setHasDraft(true);
    };
    init();
  }, [id]);

  // --- VALIDASI KHUSUS FREKUENSI ---
  const handleFrekuensiChange = (text) => {
    // 1. Cek kosong
    if (text === "") {
      setHisFrekuensi("");
      return;
    }
    // 2. Pastikan angka
    const num = parseInt(text);
    if (isNaN(num)) return;

    // 3. Validasi Batas Standar WHO (Max 5)
    if (num > 5) {
      Alert.alert(
        "Nilai Tidak Valid",
        "Maksimal frekuensi kontraksi adalah 5 kali dalam 10 menit (Tachysystole).",
        [{ text: "OK" }]
      );
      // Reset ke 5 atau biarkan angka terakhir yang valid
      setHisFrekuensi("5");
    } else {
      setHisFrekuensi(text);
    }
  };

  const submitVitals = async () => {
    // Validasi Basic
    if (!djj || !nadi)
      return Alert.alert("Form Kosong", "Minimal isi DJJ dan Nadi.");

    // Validasi Double Check saat Submit
    if (hisFrekuensi && parseInt(hisFrekuensi) > 5) {
      return Alert.alert(
        "Validasi Gagal",
        "Frekuensi kontraksi tidak boleh lebih dari 5."
      );
    }

    setLoading(true);
    try {
      const waktuLokal = toLocalISOString(waktuCatat);
      const res = await fetch(
        `https://restful-api-bmc-production.up.railway.app/api/partograf/${id}/catatan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            partograf_id: id,
            waktu_catat: waktuLokal,
            djj: djj,
            nadi_ibu: nadi,
            kontraksi_frekuensi: hisFrekuensi ? parseInt(hisFrekuensi) : null,
            kontraksi_durasi: hisDurasi ? parseInt(hisDurasi) : null,
          }),
        }
      );
      const json = await res.json();

      if (res.ok) {
        // Kirim waktuCatat ke fungsi notifikasi
        await scheduleRutinReminder(namaPasien, waktuCatat);
        Alert.alert("Berhasil", "Data Pantau Rutin tersimpan.", [
          { text: "OK", onPress: () => navigate(-1) },
        ]);
      } else {
        Alert.alert("Gagal", json.message);
      }
    } catch (e) {
      Alert.alert("Error", "Gagal menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  const openMonitor = () => {
    navigate(`/monitor-kontraksi-draft/${id}`);
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar backgroundColor={THEME.bg} barStyle="dark-content" />
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigate(-1)} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={THEME.textMain} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Pantau Rutin</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <TouchableOpacity onPress={openMonitor} style={styles.quickAccessBtn}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialCommunityIcons name="timer-sand" size={24} color="#FFF" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.quickTitle}>Buka Alat Bantu Hitung</Text>
              <Text style={styles.quickSubtitle}>
                Gunakan Stopwatch Digital
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.medicalCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="clipboard-pulse"
              size={22}
              color={THEME.primary}
            />
            <Text style={[styles.cardTitle, { color: THEME.primary }]}>
              DATA OBSERVASI
            </Text>
          </View>

          {/* WAKTU */}
          <View style={{ marginTop: 0 }}>
            <Text style={styles.label}>Waktu Catat</Text>
            <TouchableOpacity
              onPress={() => setPickerVisible(true)}
              style={[styles.inputBox, { paddingVertical: 12 }]}
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

          {/* INPUT MANUAL KONTRAKSI */}
          <Text style={[styles.label, { color: "#E65100", marginTop: 8 }]}>
            Input Manual Kontraksi
          </Text>
          <View style={styles.formRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.subLabel}>Frekuensi (Max 5)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="3"
                value={hisFrekuensi}
                onChangeText={handleFrekuensiChange} // <--- GANTI DISINI
                maxLength={1} // Extra safety: cuma bisa 1 digit
              />
            </View>
            <View style={{ width: 16 }} />
            <View style={styles.inputGroup}>
              <Text style={styles.subLabel}>Durasi (Detik)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="40"
                value={hisDurasi}
                onChangeText={setHisDurasi}
                maxLength={3}
              />
            </View>
          </View>

          <View style={styles.divider} />

          {/* INPUT DJJ & NADI */}
          <Text style={[styles.label, { marginTop: 8 }]}>Tanda Vital</Text>
          <View style={styles.formRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.subLabel}>DJJ (Bpm)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="140"
                value={djj}
                onChangeText={setDjj}
                maxLength={3}
              />
            </View>
            <View style={{ width: 16 }} />
            <View style={styles.inputGroup}>
              <Text style={styles.subLabel}>Nadi Ibu</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="80"
                value={nadi}
                onChangeText={setNadi}
                maxLength={3}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={submitVitals}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MaterialIcons
                  name="save"
                  size={18}
                  color="#FFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.saveBtnText}>SIMPAN DATA</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: THEME.bg },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  appBarTitle: { fontSize: 16, fontWeight: "700", color: THEME.textMain },

  quickAccessBtn: {
    backgroundColor: "#37474F",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
  },
  quickTitle: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  quickSubtitle: { color: "#CFD8DC", fontSize: 11 },

  medicalCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    paddingBottom: 8,
  },
  cardTitle: { fontSize: 13, fontWeight: "700", marginLeft: 8 },

  formRow: { flexDirection: "row", marginBottom: 10 },
  inputGroup: { flex: 1 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.textMain,
    marginBottom: 8,
  },
  subLabel: { fontSize: 11, color: THEME.textSec, marginBottom: 4 },

  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 4,
    backgroundColor: THEME.inputBg,
    paddingHorizontal: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    backgroundColor: THEME.inputBg,
    color: THEME.textMain,
  },

  divider: { height: 1, backgroundColor: "#EEEEEE", marginVertical: 16 },

  saveBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
});
