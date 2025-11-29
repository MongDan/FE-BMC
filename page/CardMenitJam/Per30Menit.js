import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  StatusBar,
  Platform,
  Modal,
  Pressable
} from "react-native";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome5,
  Ionicons,
  Feather
} from "@expo/vector-icons";
import { useParams, useLocation, useNavigate } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";

const THEME = {
  bg: "#F4F6F8",
  card: "#FFFFFF",
  primary: "#0277BD",
  accent: "#C2185B",
  success: "#2E7D32",
  danger: "#E53935", // Merah untuk bahaya
  warning: "#FFB300",
  textMain: "#263238",
  textSec: "#78909C",
  border: "#CFD8DC",
  inputBg: "#FAFAFA",
  disabled: "#ECEFF1"
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

  // Logika warna tombol: Gunakan THEME.primary untuk CTA utama (Confirm/Success),
  // atau warna ikon untuk mode satu tombol (Danger/Info).
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

export default function Per30Menit() {
  const { id } = useParams(); // ID Partograf Pasien
  const navigate = useNavigate();

  const [catatanPartografId, setCatatanPartografId] = useState(null);
  const [isDataTersimpan, setIsDataTersimpan] = useState(false);

  const [loading, setLoading] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [djj, setDjj] = useState("");
  const [nadi, setNadi] = useState("");
  const [waktuCatat, setWaktuCatat] = useState(new Date());
  const [isPickerVisible, setPickerVisible] = useState(false);

  // State Draft
  const [hasDraft, setHasDraft] = useState(false);

  // State Modal Kustom
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({});

  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem("userToken");
      setUserToken(token);

      // Cek apakah ada Draft Kontraksi untuk pasien ini
      const draftKey = `kontraksi_draft_${id}`;
      const draftData = await AsyncStorage.getItem(draftKey);
      if (draftData && JSON.parse(draftData).length > 0) {
        setHasDraft(true);
      }
    };
    init();
  }, [id]);

  // --- FUNGSI PENTING: SYNC DRAFT KE SERVER ---
  const syncDraftKontraksi = async (newCatatanId, token) => {
    const draftKey = `kontraksi_draft_${id}`;
    try {
      const draftStr = await AsyncStorage.getItem(draftKey);
      if (!draftStr) return;

      const drafts = JSON.parse(draftStr);
      console.log(`Syncing ${drafts.length} contractions...`);

      // Loop upload satu per satu
      for (const item of drafts) {
        await fetch(
          `https://restful-api-bmc-production.up.railway.app/api/catatan-partograf/${newCatatanId}/kontraksi`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              waktu_mulai: item.waktu_mulai,
              waktu_selesai: item.waktu_selesai
            })
          }
        );
      }

      // Bersihkan Draft
      await AsyncStorage.removeItem(draftKey);
      setHasDraft(false);
      console.log("Sync Complete!");
    } catch (e) {
      console.error("Sync Error", e);
      setModalContent({
        title: "Info",
        message: "Gagal sinkronisasi kontraksi offline.",
        type: "info",
        cancelText: "OK"
      });
      setModalVisible(true);
    }
  };

  const submitVitals = async () => {
    if (!djj || !nadi) {
      setModalContent({
        title: "Form Kosong",
        message: "Isi DJJ, Nadi & Waktu Catat.",
        type: "info",
        cancelText: "OK"
      });
      setModalVisible(true);
      return;
    }

    const djjNum = parseInt(djj);

    if (isNaN(djjNum)) {
      setModalContent({
        title: "Input Tidak Valid",
        message: "Nilai DJJ harus berupa angka yang benar.",
        type: "info",
        cancelText: "OK"
      });
      setModalVisible(true);
      return; // HENTIKAN: Jangan lanjutkan jika input tidak valid
    }

    // === 3. VALIDASI DJJ TINGGI (> 160 bpm): JANGAN DISIMPAN ===
    if (djjNum > 160) {
      setModalContent({
        title: "DJJ Terlalu Tinggi ",
        message: `DJJ ${djjNum} bpm melebihi batas aman 160 bpm`,
        type: "danger", // Tipe bahaya
        cancelText: "Mengerti"
      });
      setModalVisible(true);
      return; // *** PENTING: HENTIKAN PROSES SIMPAN! ***
    }

    // === 4. VALIDASI DJJ RENDAH (< 110 bpm): JANGAN DISIMPAN ===
    if (djjNum < 110) {
      setModalContent({
        title: "⚠️ DJJ Terlalu Rendah (Bradikardia)",
        message: `DJJ ${djjNum} bpm berada di bawah batas aman 110 bpm. Data ini TIDAK DAPAT disimpan. Mohon periksa kondisi janin segera.`,
        type: "danger", // Tipe bahaya
        cancelText: "Mengerti"
      });
      setModalVisible(true);
      return; // *** PENTING: HENTIKAN PROSES SIMPAN! ***
    }

    // ============= LANJUTKAN PROSES SIMPAN NORMAL (HANYA JIKA LOLOS SEMUA VALIDASI) =============
    setLoading(true);
    try {
      const waktuLokal = toLocalISOString(waktuCatat);
      const res = await fetch(
        `https://restful-api-bmc-production.up.railway.app/api/partograf/${id}/catatan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`
          },
          body: JSON.stringify({
            partograf_id: id,
            djj,
            nadi_ibu: nadi,
            waktu_catat: waktuLokal
          })
        }
      );
      const json = await res.json();

      if (res.ok && json.data?.id) {
        const newId = json.data.id;
        setCatatanPartografId(newId);
        setIsDataTersimpan(true);

        // === TRIGGER SYNC JIKA ADA DRAFT ===
        if (hasDraft) {
          await syncDraftKontraksi(newId, userToken);
        }

        setModalContent({
          title: "Berhasil",
          message:
            "Data Vital & Kontraksi tersimpan. Lanjut ke Monitor Kontraksi?",
          type: "success",
          confirmText: "Ya, Lanjut Monitor",
          cancelText: "OK",
          onConfirm: () => {
            setModalVisible(false);
            openMonitor(newId); // Buka monitor dengan ID baru
          },
          onClose: () => {
            setModalVisible(false);
          }
        });
        setModalVisible(true);
      } else {
        setModalContent({
          title: "Gagal",
          message: json.message || "Terjadi kesalahan saat menyimpan data.",
          type: "danger",
          cancelText: "Tutup"
        });
        setModalVisible(true);
      }
    } catch (e) {
      setModalContent({
        title: "Error",
        message:
          "Gagal koneksi ke server. Pastikan Anda terhubung ke internet.",
        type: "danger",
        cancelText: "Tutup"
      });
      setModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  // Navigasi Cerdas
  const openMonitor = (newId = catatanPartografId) => {
    if (newId) {
      // Mode Online (Sudah ada ID)
      navigate(`/monitor-kontraksi/${newId}/${id}`);
    } else {
      // Mode Draft (Belum ada ID)
      navigate(`/monitor-kontraksi-draft/${id}`);
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar backgroundColor={THEME.bg} barStyle="dark-content" />

      {/* MODAL KUSTOM */}
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

      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigate(-1)} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={THEME.textMain} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Observasi Rutin (30 Menit)</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* === TOMBOL AKSES CEPAT (NEW) === */}
        <TouchableOpacity onPress={openMonitor} style={styles.quickAccessBtn}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialCommunityIcons name="radar" size={24} color="#FFF" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.quickTitle}>Monitor Kontraksi</Text>
              <Text style={styles.quickSubtitle}>
                {isDataTersimpan ? "Tersambung (Online)" : "Mode Bebas (Draft)"}
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#FFF" />
        </TouchableOpacity>

        {/* Notifikasi Draft */}
        {!isDataTersimpan && hasDraft && (
          <View style={styles.draftBadge}>
            <MaterialCommunityIcons
              name="cloud-upload"
              size={16}
              color="#E65100"
            />
            <Text style={styles.draftText}>
              Ada data kontraksi offline. Simpan form di bawah untuk mengupload.
            </Text>
          </View>
        )}

        <View style={styles.medicalCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="heart-pulse"
              size={22}
              color={THEME.accent}
            />
            <Text style={[styles.cardTitle, { color: THEME.accent }]}>
              TANDA VITAL
            </Text>
          </View>

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

          <View style={styles.formRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>DJJ (Fetal)</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={djj}
                  onChangeText={setDjj}
                  keyboardType="numeric"
                  placeholder="140"
                  placeholderTextColor={THEME.textSec}
                />
                <Text style={styles.unit}>bpm</Text>
              </View>
            </View>
            <View style={{ width: 16 }} />
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nadi (Ibu)</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  value={nadi}
                  onChangeText={setNadi}
                  keyboardType="numeric"
                  placeholder="80"
                  placeholderTextColor={THEME.textSec}
                />
                <Text style={styles.unit}>bpm</Text>
              </View>
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
                  name={isDataTersimpan ? "check" : "save"}
                  size={18}
                  color="#FFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.saveBtnText}>
                  {isDataTersimpan ? "UPDATE DATA" : "SIMPAN & SYNC KONTRAKSI"}
                </Text>
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
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0"
  },
  appBarTitle: { fontSize: 16, fontWeight: "700", color: THEME.textMain },
  backBtn: { padding: 4 },
  medicalCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    elevation: 2
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    paddingBottom: 12
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.textMain,
    marginLeft: 8,
    letterSpacing: 0.5
  },
  formRow: { flexDirection: "row" },
  inputGroup: { flex: 1 },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.textSec,
    marginBottom: 6
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 4,
    backgroundColor: THEME.inputBg,
    paddingHorizontal: 12
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: THEME.textMain,
    fontWeight: "600"
  },
  unit: { fontSize: 12, color: THEME.textSec },
  saveBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 6,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 2
  },
  saveBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 0.5
  },

  // NEW STYLES FOR QUICK ACCESS
  quickAccessBtn: {
    backgroundColor: "#37474F",
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    elevation: 3
  },
  quickTitle: { color: "#FFF", fontSize: 14, fontWeight: "bold" },
  quickSubtitle: { color: "#CFD8DC", fontSize: 11, marginTop: 2 },
  draftBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFE0B2"
  },
  draftText: { color: "#E65100", fontSize: 11, marginLeft: 8, flex: 1 }
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
