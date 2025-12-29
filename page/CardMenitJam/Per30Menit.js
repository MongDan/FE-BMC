import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  StatusBar,
  Modal,
  Pressable,
} from "react-native";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  Ionicons,
  Feather,
} from "@expo/vector-icons";
import { useParams, useNavigate } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { scheduleRutinReminder } from "../../src/NotificationService";

const THEME = {
  bg: "#F4F6F8",
  card: "#FFFFFF",
  primary: "#0277BD",
  accent: "#C2185B",
  textMain: "#263238",
  textSec: "#78909C",
  border: "#CFD8DC",
  inputBg: "#FAFAFA",
  success: "#2E7D32",
  danger: "#E53935",
  warning: "#FFB300",
};

const toLocalISOString = (date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localTime = new Date(date.getTime() - tzOffset);
  return localTime.toISOString().slice(0, -1);
};

// ======================= COMPONENT: CUSTOM MODAL ALERT ==========================
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

export default function Per30Menit() {
  const { id } = useParams(); // ID PARTOGRAF
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [userToken, setUserToken] = useState(null);

  const location = useLocation();
  const namaPasien = location.state?.name || "Ibu";

  // FORM DATA
  const [waktuCatat, setWaktuCatat] = useState(new Date());
  const [djj, setDjj] = useState("");
  const [nadi, setNadi] = useState("");

  const [hisFrekuensi, setHisFrekuensi] = useState("");
  const [hisDurasi, setHisDurasi] = useState("");

  const [isPickerVisible, setPickerVisible] = useState(false);

  // State indikator draft
  const [hasDraft, setHasDraft] = useState(false);

  // --- STATE UNTUK CUSTOM MODAL ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
    confirmText: "Ya",
    cancelText: "Tutup",
    onClose: null,
  });

  const showCustomAlert = (
    title,
    message,
    type = "info",
    customOnClose = null
  ) => {
    setModalContent({
      title,
      message,
      type,
      confirmText: "OK",
      cancelText: "Tutup",
      onConfirm: null,
      onClose: customOnClose,
    });
    setModalVisible(true);
  };

  // 1. LOAD DATA DRAFT (KONTRAKSI & FORM INPUT) SAAT MASUK HALAMAN
  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem("userToken");
      setUserToken(token);

      // A. Cek Draft Kontraksi (dari Stopwatch)
      const draftKey = `kontraksi_draft_${id}`;
      const draftData = await AsyncStorage.getItem(draftKey);
      if (draftData && JSON.parse(draftData).length > 0) {
        setHasDraft(true);
      } else {
        setHasDraft(false);
      }

      // B. Cek Draft Form Input (Auto-save form)
      // Ini yang bikin data gak hilang pas balik dari halaman lain
      const formKey = `form_input_draft_${id}`;
      const savedForm = await AsyncStorage.getItem(formKey);
      if (savedForm) {
        try {
          const parsedForm = JSON.parse(savedForm);
          if (parsedForm.djj) setDjj(parsedForm.djj);
          if (parsedForm.nadi) setNadi(parsedForm.nadi);
          if (parsedForm.hisFrekuensi) setHisFrekuensi(parsedForm.hisFrekuensi);
          if (parsedForm.hisDurasi) setHisDurasi(parsedForm.hisDurasi);
          // Hanya set waktu kalau valid, kalau tidak pakai waktu sekarang
          if (parsedForm.waktuCatat)
            setWaktuCatat(new Date(parsedForm.waktuCatat));
        } catch (e) {
          console.log("Error parsing form draft", e);
        }
      }
    };
    init();
  }, [id]);

  // 2. AUTO-SAVE FORM INPUT SETIAP ADA PERUBAHAN
  // Setiap abang ngetik atau ubah waktu, dia nyimpen ke storage
  useEffect(() => {
    const saveFormDraft = async () => {
      const formKey = `form_input_draft_${id}`;
      const formData = {
        djj,
        nadi,
        hisFrekuensi,
        hisDurasi,
        waktuCatat: waktuCatat.toISOString(),
      };
      await AsyncStorage.setItem(formKey, JSON.stringify(formData));
    };

    // Pakai timeout biar gak terlalu sering write ke storage (debounce 500ms)
    const timeoutId = setTimeout(saveFormDraft, 500);
    return () => clearTimeout(timeoutId);
  }, [djj, nadi, hisFrekuensi, hisDurasi, waktuCatat, id]);

  const handleFrekuensiChange = (text) => {
    if (text === "") {
      setHisFrekuensi("");
      return;
    }
    const num = parseInt(text);
    if (isNaN(num)) return;

    if (num > 5) {
      showCustomAlert(
        "Nilai Tidak Valid",
        "Maksimal frekuensi kontraksi adalah 5 kali dalam 10 menit (Tachysystole).",
        "warning"
      );
      setHisFrekuensi("5");
    } else {
      setHisFrekuensi(text);
    }
  };

  // === LOGIC SYNC DRAFT (DARI CHAT) ===
  const syncDraftKontraksi = async (newCatatanId, token) => {
    const draftKey = `kontraksi_draft_${id}`;
    try {
      const draftStr = await AsyncStorage.getItem(draftKey);
      if (!draftStr) return;

      const drafts = JSON.parse(draftStr);
      if (drafts.length === 0) return;

      console.log(
        `Syncing ${drafts.length} drafts ke catatan ID: ${newCatatanId}...`
      );

      // Loop upload satu per satu ke endpoint relasi
      for (const item of drafts) {
        await fetch(
          `https://restful-api-bmc-production-v2.up.railway.app/api/catatan-partograf/${newCatatanId}/kontraksi`,
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

      // Hapus draft KONTRAKSI setelah sukses
      await AsyncStorage.removeItem(draftKey);
      setHasDraft(false);
      console.log("Sync Complete!");
    } catch (e) {
      console.error("Sync Error", e);
    }
  };

  const submitVitals = async () => {
    if (!djj || !nadi)
      return showCustomAlert(
        "Form Kosong",
        "Minimal isi DJJ dan Nadi.",
        "danger"
      );

    if (hisFrekuensi && parseInt(hisFrekuensi) > 5) {
      return showCustomAlert(
        "Validasi Gagal",
        "Frekuensi kontraksi tidak boleh lebih dari 5.",
        "warning"
      );
    }

    setLoading(true);
    try {
      const waktuLokal = toLocalISOString(waktuCatat);

      // 1. POST DATA CATATAN UTAMA (DJJ, NADI, dll)
      const res = await fetch(
        `https://restful-api-bmc-production-v2.up.railway.app/api/partograf/${id}/catatan`,
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

      if (res.ok && json.data?.id) {
        // DAPAT ID BARU DARI SERVER
        const newId = json.data.id;

        // 2. JALANKAN SYNC KONTRAKSI JIKA ADA DRAFT
        if (hasDraft) {
          await syncDraftKontraksi(newId, userToken);
        }

        // 3. BERSIHKAN DRAFT FORM INPUT KARENA SUDAH DISIMPAN
        await AsyncStorage.removeItem(`form_input_draft_${id}`);

        await scheduleRutinReminder(namaPasien, waktuCatat);

        showCustomAlert(
          "Berhasil",
          "Data Pantau Rutin & Kontraksi tersimpan.",
          "success",
          () => {
            setModalVisible(false);
            navigate(-1);
          }
        );
      } else {
        showCustomAlert(
          "Gagal",
          json.message || "Gagal menyimpan data",
          "danger"
        );
      }
    } catch (e) {
      console.error(e);
      showCustomAlert("Error", "Gagal menghubungi server.", "danger");
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

      {/* MODAL ALERT */}
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
        <Text style={styles.appBarTitle}>Pantau Rutin</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* TOMBOL STOPWATCH */}
        <TouchableOpacity onPress={openMonitor} style={styles.quickAccessBtn}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialCommunityIcons name="timer-sand" size={24} color="#FFF" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.quickTitle}>Buka Alat Bantu Hitung</Text>
              <Text style={styles.quickSubtitle}>
                {hasDraft
                  ? "Data Tersimpan di Memori"
                  : "Gunakan Stopwatch Digital"}
              </Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#FFF" />
        </TouchableOpacity>

        {/* BADGE WARNING DRAFT */}
        {hasDraft && (
          <View style={styles.draftBadge}>
            <MaterialCommunityIcons
              name="cloud-upload"
              size={20}
              color="#E65100"
            />
            <Text style={styles.draftText}>
              Ada data kontraksi dari stopwatch. Simpan formulir ini untuk
              mengirim data tersebut ke server.
            </Text>
          </View>
        )}

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
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 16,
            }}
          >
            <Text style={[styles.label, { color: "#E65100", marginBottom: 0 }]}>
              Input Manual Kontraksi
            </Text>
            {hasDraft && (
              <Text
                style={{ fontSize: 10, color: "#888", fontStyle: "italic" }}
              >
                (Akan disinkronkan dengan stopwatch)
              </Text>
            )}
          </View>
          <View style={styles.formRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.subLabel}>Frekuensi (Max 5)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder={hasDraft ? "Auto" : "3"}
                value={hisFrekuensi}
                onChangeText={handleFrekuensiChange}
                maxLength={1}
              />
            </View>
            <View style={{ width: 16 }} />
            <View style={styles.inputGroup}>
              <Text style={styles.subLabel}>Durasi (Detik)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder={hasDraft ? "Auto" : "40"}
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
                <Text style={styles.saveBtnText}>
                  {hasDraft ? "SIMPAN & SYNC KONTRAKSI" : "SIMPAN DATA"}
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

  // STYLE BARU UNTUK BADGE DRAFT
  draftBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0", // Oranye muda
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  draftText: {
    color: "#E65100", // Oranye tua
    fontSize: 12,
    marginLeft: 10,
    flex: 1,
    fontWeight: "500",
    lineHeight: 16,
  },

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
