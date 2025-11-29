import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StatusBar,
  Platform,
  Switch,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
// Menggunakan FontAwesome5 untuk ikon medis yang lebih lengkap
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import TambahPasienForm from "./TambahPasienForm";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ProfileScreen from "../ProfileScreen/ProfileScreen";
import { useNavigate } from "react-router-native";
// IMPORT DATE PICKER
import DateTimePicker from "@react-native-community/datetimepicker";

// ======================= MEDICAL THEME COLORS ==========================
const THEME = {
  bg: "#F4F6F8",
  primary: "#448AFF",
  accent: "#00897B",
  cardBg: "#FFFFFF",
  textMain: "#263238",
  textSec: "#78909C",
  border: "#ECEFF1",
  inputBg: "#FFFFFF",
  active: "#29B6F6",
  inactive: "#BDBDBD",
  done: "#66BB6A",
  referral: "#FFA726",
};

// Utilitas Format Tampilan (User Friendly)
const formatNoReg = (noReg) => {
  if (!noReg) return "";
  return noReg.toString().replace(".00", "");
};

const formatDatetimeDisplay = (dateObj) => {
  if (!dateObj) return "-";
  return `${dateObj.getDate()} ${dateObj.toLocaleString("id-ID", {
    month: "short",
  })} ${dateObj.getFullYear()}, ${dateObj
    .getHours()
    .toString()
    .padStart(2, "0")}:${dateObj.getMinutes().toString().padStart(2, "0")}`;
};

// Utilitas Format API (YYYY-MM-DD HH:mm:ss)
const formatDatetimeAPI = (dateObj) => {
  if (!dateObj) return null;
  const pad = (num) => num.toString().padStart(2, "0");
  return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(
    dateObj.getDate()
  )} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(
    dateObj.getSeconds()
  )}`;
};

const parseDateString = (dateString) => {
  if (!dateString) return new Date();
  // Handle format SQL timestamp standar atau ISO
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? new Date() : d;
};

// ------------------ COMPONENT: PATIENT CARD (Kartu Rekam Medis) ------------------
const PasienCard = ({ pasien, onPress, onStatusPress }) => {
  const status = pasien.persalinan?.status || "tidak diketahui";

  const getStatusConfig = () => {
    switch (status) {
      case "aktif":
        return { color: THEME.active, label: "Aktif", icon: "pulse" };
      case "tidak_aktif":
        return {
          color: THEME.inactive,
          label: "Non-Aktif",
          icon: "bed-outline",
        };
      case "selesai":
        return {
          color: THEME.done,
          label: "Selesai",
          icon: "checkmark-circle-outline",
        };
      case "rujukan":
        return {
          color: THEME.referral,
          label: "Rujukan",
          icon: "arrow-redo-outline",
        };
      default:
        return {
          color: THEME.inactive,
          label: "Unknown",
          icon: "help-circle-outline",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const rawDateMules = pasien.persalinan?.tanggal_jam_mules
    ? new Date(pasien.persalinan.tanggal_jam_mules)
    : null;
  const rawDateKetuban = pasien.persalinan?.tanggal_jam_ketuban_pecah
    ? new Date(pasien.persalinan.tanggal_jam_ketuban_pecah)
    : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.card, { borderLeftColor: statusConfig.color }]}>
        {/* Header Kartu: Nama & Status */}
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: THEME.primary + "15" },
            ]}
          >
            <Text style={[styles.avatarText, { color: THEME.primary }]}>
              {pasien.nama.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.cardName} numberOfLines={1}>
              {pasien.nama}
            </Text>
            <Text style={styles.cardReg}>
              No. RM: {formatNoReg(pasien.no_reg)}
            </Text>
          </View>

          {/* Status Badge (Clickable) */}
          <TouchableOpacity
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.color + "15" },
            ]}
            onPress={onStatusPress}
          >
            <Ionicons
              name={statusConfig.icon}
              size={12}
              color={statusConfig.color}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
            <MaterialIcons
              name="edit"
              size={10}
              color={statusConfig.color}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Body Kartu: Detail Pasien */}
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <MaterialIcons name="cake" size={14} color={THEME.textSec} />
            <Text style={styles.infoText}>{pasien.umur} Th</Text>
            <Text style={styles.infoSeparator}>|</Text>
            <MaterialIcons name="location-on" size={14} color={THEME.textSec} />
            <Text style={[styles.infoText, { flex: 1 }]} numberOfLines={1}>
              {pasien.alamat}
            </Text>
          </View>

          {/* Baris 2: Data Klinis (Ketuban/Mules) jika ada */}
          {(rawDateKetuban || rawDateMules) && (
            <View style={styles.clinicalInfoContainer}>
              {pasien.persalinan?.ketuban_pecah == 1 && rawDateKetuban && (
                <View style={styles.clinicalItem}>
                  <MaterialCommunityIcons
                    name="water-outline"
                    size={14}
                    color="#0288D1"
                  />
                  <Text style={styles.clinicalLabel}>Ketuban:</Text>
                  <Text style={styles.clinicalValue}>
                    {formatDatetimeDisplay(rawDateKetuban)}
                  </Text>
                </View>
              )}
              {rawDateMules && (
                <View style={styles.clinicalItem}>
                  <MaterialCommunityIcons
                    name="clock-time-four-outline"
                    size={14}
                    color="#E65100"
                  />
                  <Text style={styles.clinicalLabel}>Mules:</Text>
                  <Text style={styles.clinicalValue}>
                    {formatDatetimeDisplay(rawDateMules)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ======================= MODAL UPDATE STATUS (UI/UX OPTIMIZED + DATEPICKER) ==========================
const StatusUpdateModal = ({ visible, onClose, onSuccess, pasien, token }) => {
  const [status, setStatus] = useState("aktif");
  const [loading, setLoading] = useState(false);

  // Menggunakan Object Date untuk state agar kompatibel dengan DateTimePicker
  const [tglRawat, setTglRawat] = useState(new Date());
  const [tglMules, setTglMules] = useState(new Date());
  const [ketubanPecah, setKetubanPecah] = useState(false);
  const [tglKetuban, setTglKetuban] = useState(new Date());
  const [tglLahir, setTglLahir] = useState(new Date());

  // Picker Configuration
  const [picker, setPicker] = useState({
    show: false,
    mode: "date",
    field: null,
  });

  // Reset state & pre-fill data ketika modal dibuka
  useEffect(() => {
    if (pasien && visible) {
      const p = pasien.persalinan || {};
      setStatus(p.status || "aktif");

      setTglRawat(parseDateString(p.tanggal_jam_rawat));
      setTglMules(parseDateString(p.tanggal_jam_mules));
      setKetubanPecah(p.ketuban_pecah === true || p.ketuban_pecah === 1);
      setTglKetuban(parseDateString(p.tanggal_jam_ketuban_pecah));
      // Untuk tgl lahir default ke now karena biasanya baru diisi saat selesai
      setTglLahir(
        p.tanggal_jam_waktu_bayi_lahir
          ? parseDateString(p.tanggal_jam_waktu_bayi_lahir)
          : new Date()
      );
    }
  }, [pasien, visible]);

  const showDatePicker = (field, mode = "date") => {
    setPicker({ show: true, mode, field });
  };

  const handleDateChange = (event, selectedDate) => {
    const currentMode = picker.mode;

    // Di Android, picker langsung close setelah select. Di iOS butuh tombol done (default behavior handled here broadly)
    if (Platform.OS === "android") {
      setPicker({ ...picker, show: false });
    }

    if (event.type === "dismissed") {
      setPicker({ ...picker, show: false });
      return;
    }

    if (selectedDate) {
      // Update state berdasarkan field yang sedang diedit
      switch (picker.field) {
        case "rawat":
          setTglRawat(selectedDate);
          break;
        case "mules":
          setTglMules(selectedDate);
          break;
        case "ketuban":
          setTglKetuban(selectedDate);
          break;
        case "lahir":
          setTglLahir(selectedDate);
          break;
      }

      // UX Helper: Jika selesai pilih tanggal, otomatis tawarkan pilih jam (opsional, tapi bagus untuk UX)
      if (currentMode === "date" && Platform.OS === "android") {
        setTimeout(() => {
          setPicker({ show: true, mode: "time", field: picker.field });
        }, 100);
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const persalinanId = pasien?.persalinan?.id;

    let payload = {
      status: status,
      _method: "PUT",
    };

    if (status === "aktif") {
      payload.tanggal_jam_rawat = formatDatetimeAPI(tglRawat);
      payload.tanggal_jam_mules = formatDatetimeAPI(tglMules);
      payload.ketuban_pecah = ketubanPecah ? 1 : 0;

      if (ketubanPecah) {
        payload.tanggal_jam_ketuban_pecah = formatDatetimeAPI(tglKetuban);
      } else {
        payload.tanggal_jam_ketuban_pecah = null;
      }
    } else if (status === "selesai") {
      payload.tanggal_jam_waktu_bayi_lahir = formatDatetimeAPI(tglLahir);
    }

    try {
      const response = await fetch(
        `https://restful-api-bmc-production.up.railway.app/api/persalinan/${persalinanId}/status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Berhasil", "Status pasien berhasil diperbarui.");
        onSuccess();
        onClose();
      } else {
        Alert.alert(
          "Gagal",
          data.message || "Terjadi kesalahan saat update status."
        );
      }
    } catch (error) {
      console.log("Error Update Status:", error);
      Alert.alert("Error", "Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  const DateInputButton = ({ label, dateValue, fieldName }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.dateInputContainer}
        onPress={() => showDatePicker(fieldName, "date")}
      >
        <Ionicons name="calendar-outline" size={20} color={THEME.primary} />
        <Text style={styles.dateInputText}>
          {formatDatetimeDisplay(dateValue)}
        </Text>
        <Ionicons
          name="chevron-down"
          size={16}
          color={THEME.textSec}
          style={{ marginLeft: "auto" }}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Update Status</Text>
                <Text style={styles.modalSubtitle}>{pasien?.nama}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={THEME.textSec} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 400 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionLabel}>PILIH STATUS BARU</Text>
              <View style={styles.statusOptionsContainer}>
                {["aktif", "tidak_aktif", "selesai", "rujukan"].map((item) => {
                  let activeColor = THEME.primary;
                  if (item === "selesai") activeColor = THEME.done;
                  if (item === "rujukan") activeColor = THEME.referral;
                  if (item === "tidak_aktif") activeColor = THEME.inactive;
                  const isActive = status === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.statusChip,
                        isActive && {
                          backgroundColor: activeColor,
                          borderColor: activeColor,
                        },
                      ]}
                      onPress={() => setStatus(item)}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          isActive && { color: "#FFF" },
                        ]}
                      >
                        {item.replace("_", " ")}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.divider} />

              {status === "aktif" && (
                <View style={styles.dynamicForm}>
                  <DateInputButton
                    label="Waktu Rawat (Masuk)"
                    dateValue={tglRawat}
                    fieldName="rawat"
                  />
                  <DateInputButton
                    label="Waktu Mulai Mules"
                    dateValue={tglMules}
                    fieldName="mules"
                  />

                  <View style={styles.switchRow}>
                    <Text style={styles.inputLabel}>Ketuban Pecah?</Text>
                    <Switch
                      trackColor={{ false: "#767577", true: THEME.primary }}
                      thumbColor={ketubanPecah ? "#FFF" : "#f4f3f4"}
                      onValueChange={setKetubanPecah}
                      value={ketubanPecah}
                    />
                  </View>

                  {ketubanPecah && (
                    <DateInputButton
                      label="Waktu Ketuban Pecah"
                      dateValue={tglKetuban}
                      fieldName="ketuban"
                    />
                  )}
                </View>
              )}

              {status === "selesai" && (
                <View style={styles.dynamicForm}>
                  <View
                    style={[
                      styles.infoBox,
                      { backgroundColor: THEME.done + "20" },
                    ]}
                  >
                    <Ionicons
                      name="information-circle"
                      size={20}
                      color={THEME.done}
                    />
                    <Text
                      style={{
                        marginLeft: 8,
                        color: THEME.textMain,
                        fontSize: 12,
                        flex: 1,
                      }}
                    >
                      Pastikan bayi sudah lahir.
                    </Text>
                  </View>
                  <DateInputButton
                    label="Waktu Bayi Lahir"
                    dateValue={tglLahir}
                    fieldName="lahir"
                  />
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveButton, loading && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Render DateTimePicker (Kondisional) */}
            {picker.show && (
              <DateTimePicker
                value={
                  picker.field === "rawat"
                    ? tglRawat
                    : picker.field === "mules"
                    ? tglMules
                    : picker.field === "ketuban"
                    ? tglKetuban
                    : tglLahir
                }
                mode={picker.mode}
                is24Hour={true}
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ... (Sisa kode PasienCard & HomeScreen sama seperti sebelumnya, pastikan pakai PasienCard & StatusUpdateModal di atas)

export default function HomeScreen() {
  const navigate = useNavigate();

  const [modalVisible, setModalVisible] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [pasienList, setPasienList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeScreen, setActiveScreen] = useState("home");

  // State Modal Status
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedPasienForStatus, setSelectedPasienForStatus] = useState(null);

  const filteredPasienList = pasienList.filter((pasien) =>
    pasien.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchPasien = async (token) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        "https://restful-api-bmc-production.up.railway.app/api/bidan/pasien",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      setPasienList(data.daftar_pasien || []);
    } catch (err) {
      console.log("❌ ERROR FETCH:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (token) {
          setUserToken(token);
          fetchPasien(token);
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleFormSuccess = () => {
    setModalVisible(false);
    fetchPasien(userToken);
  };

  const handleOpenStatusModal = (pasien) => {
    setSelectedPasienForStatus(pasien);
    setStatusModalVisible(true);
  };

  const handleStatusSuccess = () => {
    fetchPasien(userToken);
  };

  const renderHomeContent = () => {
    if (isLoading)
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loadingText}>Mengambil Data Pasien...</Text>
        </View>
      );

    if (filteredPasienList.length === 0)
      return (
        <View style={styles.centerBox}>
          <MaterialIcons
            name="person-search"
            size={60}
            color={THEME.textSec + "50"}
          />
          <Text style={styles.emptyText}>Belum ada data pasien.</Text>
        </View>
      );

    return filteredPasienList.map((pasien, index) => (
      <PasienCard
        key={pasien.no_reg || `pasien-${index}`}
        pasien={pasien}
        onPress={() =>
          navigate(`/home-catatan/${pasien.partograf_id}`, {
            state: {
              partografId: pasien.partograf_id,
              name: pasien.nama,
              noReg: pasien.no_reg,
            },
          })
        }
        onStatusPress={() => handleOpenStatusModal(pasien)}
      />
    ));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require("../../assets/Logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={styles.appNameContainer}>
              <Text style={styles.appNameText}>Ruang</Text>
              <Text style={[styles.appNameText, { color: THEME.primary }]}>
                Bunda
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setActiveScreen("profile")}
          >
            <FontAwesome5 name="user-alt" size={22} color={THEME.textMain} />
          </TouchableOpacity>
        </View>

        {/* KONTEN */}
        <View style={styles.contentContainer}>
          {activeScreen === "home" ? (
            <>
              <View style={styles.searchWrapper}>
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color={THEME.textSec} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Cari Pasien..."
                    placeholderTextColor={THEME.textSec}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>
              <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionTitle}>DAFTAR PASIEN</Text>
                {renderHomeContent()}
              </ScrollView>
            </>
          ) : (
            <ProfileScreen />
          )}
        </View>

        {/* BOTTOM NAV */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveScreen("home")}
          >
            <Ionicons
              name={activeScreen === "home" ? "home" : "home-outline"}
              size={24}
              color={activeScreen === "home" ? THEME.primary : THEME.textSec}
            />
            <Text
              style={[
                styles.navText,
                activeScreen === "home" && styles.navTextActive,
              ]}
            >
              Beranda
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addFab}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.9}
          >
            <Ionicons name="add" size={36} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigate("/konten-edukasi")}
          >
            <Ionicons name="book-outline" size={22} color={THEME.textSec} />
            <Text style={styles.navText}>Edukasi</Text>
          </TouchableOpacity>
        </View>

        {/* MODALS */}
        <Modal
          visible={modalVisible}
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <TambahPasienForm
            onClose={() => setModalVisible(false)}
            onSuccess={handleFormSuccess}
            token={userToken}
          />
        </Modal>

        <StatusUpdateModal
          visible={statusModalVisible}
          onClose={() => setStatusModalVisible(false)}
          onSuccess={handleStatusSuccess}
          pasien={selectedPasienForStatus}
          token={userToken}
        />
      </View>
    </SafeAreaView>
  );
}

// ======================= STYLES ==========================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: { flex: 1, backgroundColor: THEME.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    elevation: 2,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  logoImage: { width: 32, height: 32, marginRight: 8 },
  appNameContainer: { flexDirection: "column", justifyContent: "center" },
  appNameText: {
    fontSize: 18,
    fontWeight: "bold",
    color: THEME.textMain,
    lineHeight: 20,
  },
  iconButton: { padding: 8 },
  searchWrapper: {
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: THEME.textMain },
  contentContainer: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.textSec,
    marginBottom: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  centerBox: { alignItems: "center", marginTop: 80 },
  loadingText: { marginTop: 16, color: THEME.textSec, fontSize: 14 },
  emptyText: { marginTop: 16, color: THEME.textSec, fontSize: 14 },

  // Card
  card: {
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: THEME.inactive,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#FAFAFA",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: "bold" },
  headerInfo: { flex: 1 },
  cardName: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.textMain,
    marginBottom: 2,
  },
  cardReg: { fontSize: 12, color: THEME.textSec },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 10, fontWeight: "bold", textTransform: "capitalize" },
  cardBody: { padding: 16, paddingTop: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  infoText: { fontSize: 13, color: THEME.textSec, marginLeft: 6 },
  infoSeparator: { marginHorizontal: 10, color: THEME.border, fontSize: 14 },
  clinicalInfoContainer: {
    marginTop: 4,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  clinicalItem: { flexDirection: "row", alignItems: "center", marginRight: 10 },
  clinicalLabel: {
    fontSize: 11,
    color: THEME.textSec,
    marginLeft: 6,
    marginRight: 4,
  },
  clinicalValue: { fontSize: 11, fontWeight: "bold", color: THEME.textMain },
  divider: { height: 1, backgroundColor: "#FAFAFA" },

  // Bottom Nav
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 70,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#ECEFF1",
    elevation: 20,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    height: "100%",
  },
  navText: { fontSize: 10, marginTop: 4, color: THEME.textSec },
  navTextActive: { color: THEME.primary, fontWeight: "bold" },
  addFab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.primary,
    justifyContent: "center",
    alignItems: "center",
    bottom: 25,
    elevation: 8,
    borderWidth: 4,
    borderColor: "#F4F6F8",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 350,
    elevation: 10,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: THEME.textMain },
  modalSubtitle: { fontSize: 14, color: THEME.textSec, marginTop: 2 },
  closeBtn: { padding: 8, borderRadius: 20, backgroundColor: "#F5F5F5" },
  sectionLabel: {
    fontSize: 12,
    color: THEME.textSec,
    marginBottom: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statusOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: "#F8F9FA",
    marginBottom: 6,
    marginRight: 6,
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.textSec,
    textTransform: "capitalize",
  },
  dynamicForm: { marginTop: 10 },
  inputGroup: { marginBottom: 16 },
  inputLabel: {
    fontSize: 14,
    color: THEME.textMain,
    marginBottom: 8,
    fontWeight: "600",
  },

  // Date Picker Style (Button Look)
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    backgroundColor: "#FAFAFA",
  },
  dateInputText: {
    flex: 1,
    marginLeft: 10,
    color: THEME.textMain,
    fontSize: 14,
    fontWeight: "500",
  },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#F5F7FA",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  infoBox: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  modalFooter: { marginTop: 20, marginBottom: 10 },
  saveButton: {
    backgroundColor: THEME.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    elevation: 4,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
