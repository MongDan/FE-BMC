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
  KeyboardAvoidingView,
  Pressable,
  RefreshControl,
  FlatList
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome5,
  Feather
} from "@expo/vector-icons";
import TambahPasienForm from "./TambahPasienForm";
import { registerForPushNotificationsAsync } from "../../src/NotificationService";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ProfileScreen from "../ProfileScreen/ProfileScreen";
import { useNavigate } from "react-router-native";
import { cancelAllReminders } from "../../src/NotificationService";
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
  danger: "#E53935",
  warning: "#FFB300",
  success: "#2E7D32",
  card: "#FFFFFF"
};

// ======================= UTILITIES ==========================
const formatNoReg = (noReg) =>
  !noReg ? "" : noReg.toString().replace(".00", "");
const formatDatetimeDisplay = (dateObj) =>
  dateObj
    ? `${dateObj.getDate()} ${dateObj.toLocaleString("id-ID", {
        month: "short"
      })} ${dateObj.getFullYear()}, ${dateObj
        .getHours()
        .toString()
        .padStart(2, "0")}:${dateObj.getMinutes().toString().padStart(2, "0")}`
    : "-";
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
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? new Date() : d;
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
  cancelText = "Tutup"
}) {
  const iconMap = {
    danger: { name: "alert-triangle", color: THEME.danger },
    success: { name: "check-circle", color: THEME.success },
    info: { name: "info", color: THEME.primary },
    confirm: { name: "help-circle", color: THEME.warning }
  };
  const { name, color: iconColor } = iconMap[type] || iconMap.info;
  const mainButtonColor =
    type === "confirm" || type === "success" ? THEME.primary : iconColor;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={alertStyles.backdrop}>
        <View style={alertStyles.alertBox}>
          <View
            style={[
              alertStyles.iconCircle,
              { backgroundColor: iconColor + "15" }
            ]}
          >
            <Feather name={name} size={30} color={iconColor} />
          </View>
          <Text style={alertStyles.title}>{title}</Text>
          <Text style={alertStyles.message}>{message}</Text>
          <View style={alertStyles.buttonContainer}>
            {type === "confirm" ? (
              <>
                <Pressable
                  style={[
                    alertStyles.button,
                    alertStyles.ghostButton,
                    { flex: 1 }
                  ]}
                  onPress={onClose}
                >
                  <Text style={alertStyles.ghostButtonText}>{cancelText}</Text>
                </Pressable>
                <Pressable
                  style={[
                    alertStyles.button,
                    {
                      backgroundColor: mainButtonColor,
                      flex: 1,
                      marginLeft: 10
                    }
                  ]}
                  onPress={onConfirm}
                >
                  <Text style={alertStyles.buttonText}>{confirmText}</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                style={[
                  alertStyles.button,
                  { backgroundColor: iconColor, minWidth: "50%" }
                ]}
                onPress={onClose}
              >
                <Text style={alertStyles.buttonText}>{cancelText}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ======================= HELPER COMPONENTS FOR STATUS MODAL ==========================
const DateInputButton = ({ label, dateValue, fieldName, onPress }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TouchableOpacity
      style={styles.dateInputContainer}
      onPress={() => onPress(fieldName, "date")}
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

const NumberInput = ({ label, value, onChange, suffix }) => (
  <View style={styles.halfInput}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.suffixInputContainer}>
      <TextInput
        style={styles.suffixInput}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholder="0"
      />
      <Text style={styles.suffixText}>{suffix}</Text>
    </View>
  </View>
);

// ======================= COMPONENT: PATIENT CARD ==========================
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
          icon: "bed-outline"
        };
      case "selesai":
        return {
          color: THEME.done,
          label: "Selesai",
          icon: "checkmark-circle-outline"
        };
      case "rujukan":
        return {
          color: THEME.referral,
          label: "Rujukan",
          icon: "arrow-redo-outline"
        };
      default:
        return {
          color: THEME.inactive,
          label: "Unknown",
          icon: "help-circle-outline"
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
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: THEME.primary + "15" }
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
          <TouchableOpacity
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.color + "15" }
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
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ======================= MODAL UPDATE STATUS ==========================
const StatusUpdateModal = ({ visible, onClose, onSuccess, pasien, token }) => {
  const [status, setStatus] = useState("aktif");
  const [loading, setLoading] = useState(false);
  const [tglRawat, setTglRawat] = useState(new Date());
  const [tglMules, setTglMules] = useState(new Date());
  const [ketubanPecah, setKetubanPecah] = useState(false);
  const [tglKetuban, setTglKetuban] = useState(new Date());
  const [tglLahir, setTglLahir] = useState(new Date());
  const [beratBadan, setBeratBadan] = useState("");
  const [panjangBadan, setPanjangBadan] = useState("");
  const [lingkarDada, setLingkarDada] = useState("");
  const [lingkarKepala, setLingkarKepala] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("Laki-laki");
  const [picker, setPicker] = useState({
    show: false,
    mode: "date",
    field: null
  });
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "info",
    onConfirm: null
  });

  const showCustomAlert = (title, message, type = "info", onConfirm = null) => {
    setAlertConfig({ title, message, type, onConfirm });
    setAlertVisible(true);
  };

  useEffect(() => {
    if (pasien && visible) {
      const p = pasien.persalinan || {};
      setStatus(p.status || "aktif");
      setTglRawat(parseDateString(p.tanggal_jam_rawat));
      setTglMules(parseDateString(p.tanggal_jam_mules));
      setKetubanPecah(p.ketuban_pecah === true || p.ketuban_pecah === 1);
      setTglKetuban(parseDateString(p.tanggal_jam_ketuban_pecah));
      setTglLahir(
        p.tanggal_jam_waktu_bayi_lahir
          ? parseDateString(p.tanggal_jam_waktu_bayi_lahir)
          : new Date()
      );
      setBeratBadan(p.berat_badan ? String(p.berat_badan) : "");
      setPanjangBadan(p.panjang_badan ? String(p.panjang_badan) : "");
      setLingkarDada(p.lingkar_dada ? String(p.lingkar_dada) : "");
      setLingkarKepala(p.lingkar_kepala ? String(p.lingkar_kepala) : "");
      setJenisKelamin(p.jenis_kelamin || "Laki-laki");
    }
  }, [pasien, visible]);

  const showDatePicker = (field, mode = "date") =>
    setPicker({ show: true, mode, field });
  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") setPicker({ ...picker, show: false });
    if (selectedDate) {
      if (picker.field === "rawat") setTglRawat(selectedDate);
      else if (picker.field === "mules") setTglMules(selectedDate);
      else if (picker.field === "ketuban") setTglKetuban(selectedDate);
      else if (picker.field === "lahir") setTglLahir(selectedDate);

      if (picker.mode === "date" && Platform.OS === "android") {
        setTimeout(
          () => setPicker({ show: true, mode: "time", field: picker.field }),
          100
        );
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const persalinanId = pasien?.persalinan?.id;
    let payload = { status, _method: "PUT" };
    if (status === "aktif") {
      payload.tanggal_jam_rawat = formatDatetimeAPI(tglRawat);
      payload.tanggal_jam_mules = formatDatetimeAPI(tglMules);
      payload.ketuban_pecah = ketubanPecah ? 1 : 0;
      payload.tanggal_jam_ketuban_pecah = ketubanPecah
        ? formatDatetimeAPI(tglKetuban)
        : null;
    } else if (status === "selesai") {
      payload.tanggal_jam_waktu_bayi_lahir = formatDatetimeAPI(tglLahir);
      payload.berat_badan = beratBadan;
      payload.panjang_badan = panjangBadan;
      payload.lingkar_dada = lingkarDada;
      payload.lingkar_kepala = lingkarKepala;
      payload.jenis_kelamin = jenisKelamin;
    }

    try {
      const response = await fetch(
        `https://restful-api-bmc-production-v2.up.railway.app/api/persalinan/${persalinanId}/status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      );
      if (response.ok) {
        if (["selesai", "rujukan", "tidak_aktif"].includes(status))
          await cancelAllReminders();
        showCustomAlert("Berhasil", "Data diperbarui.", "success", () => {
          setAlertVisible(false);
          onSuccess();
          onClose();
        });
      } else {
        const data = await response.json();
        showCustomAlert("Gagal", data.message || "Error update.", "danger");
      }
    } catch (e) {
      showCustomAlert("Error", "Server error.", "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <CustomAlertModal
          isVisible={alertVisible}
          onClose={() => setAlertVisible(false)}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onConfirm={alertConfig.onConfirm}
          confirmText="OK"
        />
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
              style={{ maxHeight: 500 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.statusOptionsContainer}>
                {["aktif", "tidak_aktif", "selesai", "rujukan"].map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.statusChip,
                      status === item && {
                        backgroundColor: THEME.primary,
                        borderColor: THEME.primary
                      }
                    ]}
                    onPress={() => setStatus(item)}
                  >
                    <Text
                      style={[
                        styles.statusChipText,
                        status === item && { color: "#FFF" }
                      ]}
                    >
                      {item.replace("_", " ")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.divider} />
              {status === "aktif" && (
                <View style={styles.dynamicForm}>
                  <DateInputButton
                    label="Waktu Rawat"
                    dateValue={tglRawat}
                    fieldName="rawat"
                    onPress={showDatePicker}
                  />
                  <DateInputButton
                    label="Mulai Mules"
                    dateValue={tglMules}
                    fieldName="mules"
                    onPress={showDatePicker}
                  />
                  <View style={styles.switchRow}>
                    <Text style={styles.inputLabel}>Ketuban Pecah?</Text>
                    <Switch
                      onValueChange={setKetubanPecah}
                      value={ketubanPecah}
                    />
                  </View>
                  {ketubanPecah && (
                    <DateInputButton
                      label="Waktu Ketuban"
                      dateValue={tglKetuban}
                      fieldName="ketuban"
                      onPress={showDatePicker}
                    />
                  )}
                </View>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>Simpan</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
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
    </Modal>
  );
};

// ======================= COMPONENT: EDUKASI CONTENT (INTERNAL) ==========================
const EdukasiScreenContent = ({ token, navigate }) => {
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [kontenList, setKontenList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("create");

  const fetchKonten = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(
        "https://restful-api-bmc-production-v2.up.railway.app/api/konten-edukasi"
      );
      const data = await res.json();
      if (res.ok) setKontenList(data.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchKonten();
  }, []);

  const handleSubmit = async () => {
    if (!judul || !isi) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        "https://restful-api-bmc-production-v2.up.railway.app/api/konten-edukasi",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ judul_konten: judul, isi_konten: isi })
        }
      );
      if (res.ok) {
        setJudul("");
        setIsi("");
        setActiveTab("list");
        fetchKonten();
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "create" && styles.tabBtnActive]}
          onPress={() => setActiveTab("create")}
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === "create" && styles.tabBtnTextActive
            ]}
          >
            Buat Baru
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "list" && styles.tabBtnActive]}
          onPress={() => setActiveTab("list")}
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === "list" && styles.tabBtnTextActive
            ]}
          >
            Daftar Materi
          </Text>
        </TouchableOpacity>
      </View>
      {activeTab === "create" ? (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>JUDUL MATERI</Text>
            <TextInput
              style={styles.simpleInput}
              placeholder="Misal: Gizi Ibu Hamil"
              value={judul}
              onChangeText={setJudul}
            />
            <Text style={[styles.sectionLabel, { marginTop: 15 }]}>
              ISI MATERI
            </Text>
            <TextInput
              style={[
                styles.simpleInput,
                { height: 120, textAlignVertical: "top" }
              ]}
              multiline
              placeholder="Isi..."
              value={isi}
              onChangeText={setIsi}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>TERBITKAN</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={kontenList}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchKonten} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() =>
                navigate("/lihat-konten", { state: { kontenData: item } })
              }
            >
              <View
                style={[styles.menuIconBox, { backgroundColor: "#E3F2FD" }]}
              >
                <Ionicons name="book" size={20} color={THEME.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuText}>{item.judul_konten}</Text>
                <Text style={styles.subText}>ID: {item.id}</Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={THEME.textSec}
              />
            </TouchableOpacity>
          )}
          contentContainerStyle={{ padding: 20 }}
        />
      )}
    </View>
  );
};

// ======================= MAIN SCREEN ==========================
export default function HomeScreen() {
  const navigate = useNavigate();
  const [modalVisible, setModalVisible] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [pasienList, setPasienList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeScreen, setActiveScreen] = useState("home");
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
        "https://restful-api-bmc-production-v2.up.railway.app/api/bidan/pasien",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setPasienList(data.daftar_pasien || []);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    registerForPushNotificationsAsync();
    const load = async () => {
      const token = await AsyncStorage.getItem("userToken");
      if (token) {
        setUserToken(token);
        fetchPasien(token);
      } else setIsLoading(false);
    };
    load();
  }, []);

  const renderContent = () => {
    if (activeScreen === "profile") return <ProfileScreen />;
    if (activeScreen === "edukasi")
      return <EdukasiScreenContent token={userToken} navigate={navigate} />;
    return (
      <>
        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={THEME.textSec} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari Pasien..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>DAFTAR PASIEN</Text>
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={THEME.primary}
              style={{ marginTop: 50 }}
            />
          ) : (
            filteredPasienList.map((pasien, idx) => (
              <PasienCard
                key={idx}
                pasien={pasien}
                onPress={() =>
                  navigate(`/home-catatan/${pasien.partograf_id}`, {
                    state: { ...pasien }
                  })
                }
                onStatusPress={() => {
                  setSelectedPasienForStatus(pasien);
                  setStatusModalVisible(true);
                }}
              />
            ))
          )}
        </ScrollView>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require("../../assets/Logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={styles.appNameContainer}>
              <Text style={styles.appNameText}>Ruang Bunda</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setActiveScreen("profile")}
          >
            <FontAwesome5
              name="user-alt"
              size={22}
              color={
                activeScreen === "profile" ? THEME.primary : THEME.textMain
              }
            />
          </TouchableOpacity>
        </View>
        <View style={styles.contentContainer}>{renderContent()}</View>
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
                activeScreen === "home" && styles.navTextActive
              ]}
            >
              Beranda
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addFab}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={36} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.labelAdd}>Tambah</Text>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveScreen("edukasi")}
          >
            <Ionicons
              name={activeScreen === "edukasi" ? "book" : "book-outline"}
              size={24}
              color={activeScreen === "edukasi" ? THEME.primary : THEME.textSec}
            />
            <Text
              style={[
                styles.navText,
                activeScreen === "edukasi" && styles.navTextActive
              ]}
            >
              Edukasi
            </Text>
          </TouchableOpacity>
        </View>
        <Modal
          visible={modalVisible}
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <TambahPasienForm
            onClose={() => setModalVisible(false)}
            onSuccess={() => fetchPasien(userToken)}
            token={userToken}
          />
        </Modal>
        <StatusUpdateModal
          visible={statusModalVisible}
          onClose={() => setStatusModalVisible(false)}
          onSuccess={() => fetchPasien(userToken)}
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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
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
    elevation: 2
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  logoImage: { width: 32, height: 32, marginRight: 8 },
  appNameContainer: { flexDirection: "column", justifyContent: "center" },
  appNameText: {
    fontSize: 18,
    fontWeight: "bold",
    color: THEME.textMain,
    lineHeight: 20
  },
  iconButton: { padding: 8 },
  contentContainer: { flex: 1 },
  searchWrapper: {
    backgroundColor: "#FFF",
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 10
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: THEME.border
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: THEME.textMain },
  scrollContent: { padding: 20, paddingBottom: 100 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.textSec,
    marginBottom: 12,
    letterSpacing: 1
  },
  card: {
    backgroundColor: THEME.cardBg,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    elevation: 2,
    padding: 16
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12
  },
  avatarText: { fontSize: 18, fontWeight: "bold" },
  headerInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: "700", color: THEME.textMain },
  cardReg: { fontSize: 12, color: THEME.textSec },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  statusText: { fontSize: 10, fontWeight: "bold" },
  infoRow: { flexDirection: "row", alignItems: "center" },
  infoText: { fontSize: 13, color: THEME.textSec, marginLeft: 6 },
  infoSeparator: { marginHorizontal: 10, color: THEME.border },
  divider: { height: 1, backgroundColor: "#FAFAFA", marginVertical: 12 },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 70,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#ECEFF1",
    elevation: 20
  },
  navItem: { alignItems: "center", justifyContent: "center", flex: 1 },
  navText: { fontSize: 10, marginTop: 4, color: THEME.textSec },
  navTextActive: { color: THEME.primary, fontWeight: "bold" },
  addFab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.primary,
    justifyContent: "center",
    alignItems: "center",
    bottom: 35,
    elevation: 8,
    borderWidth: 4,
    borderColor: "#F4F6F8"
  },
  labelAdd: {
    position: "absolute",
    bottom: 10,
    fontSize: 10,
    color: THEME.textSec,
    fontWeight: "600"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: THEME.textMain },
  modalSubtitle: { fontSize: 14, color: THEME.textSec },
  closeBtn: { padding: 8, borderRadius: 20, backgroundColor: "#F5F5F5" },
  statusOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: "#F8F9FA"
  },
  statusChipText: { fontSize: 13, fontWeight: "600", color: THEME.textSec },
  inputGroup: { marginBottom: 16 },
  inputLabel: {
    fontSize: 14,
    color: THEME.textMain,
    marginBottom: 8,
    fontWeight: "600"
  },
  simpleInput: {
    backgroundColor: THEME.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
    marginTop: 8,
    fontSize: 15
  },
  saveButton: {
    backgroundColor: THEME.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20
  },
  saveButtonText: { color: "#FFF", fontWeight: "bold" },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8
  },
  tabBtnActive: { backgroundColor: THEME.primary + "15" },
  tabBtnText: { color: THEME.textSec, fontWeight: "600" },
  tabBtnTextActive: { color: THEME.primary },
  sectionContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: THEME.border
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.textSec,
    letterSpacing: 0.5
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.border
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15
  },
  menuText: { fontSize: 15, fontWeight: "600", color: THEME.textMain },
  subText: { fontSize: 11, color: THEME.textSec },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    backgroundColor: "#FAFAFA"
  },
  dateInputText: {
    flex: 1,
    marginLeft: 10,
    color: THEME.textMain,
    fontSize: 14,
    fontWeight: "500"
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
    borderColor: THEME.border
  }
});

const alertStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 20
  },
  alertBox: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 30,
    alignItems: "center",
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
