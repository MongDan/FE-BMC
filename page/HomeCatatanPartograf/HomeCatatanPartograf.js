import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform
} from "react-native";
import {
  MaterialIcons,
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons
} from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigate, useLocation } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ======================= MEDICAL THEME ==========================
const THEME = {
  bg: "#F4F6F8", // Abu-abu klinis
  primary: "#0277BD", // Medical Blue
  textMain: "#263238", // Dark Blue Grey
  textSec: "#78909C", // Abu-abu teks
  cardBg: "#FFFFFF",

  // Warna Menu
  menuData: "#D81B60", // Pink (Data Awal)
  menuKontraksi: "#0277BD", // Blue (Kontraksi)
  menu30: "#00897B", // Teal (30 Menit)
  menu4h: "#F9A825", // Orange/Gold (4 Jam)

  disabled: "#CFD8DC"
};

// ------------------ COMPONENT: DASHBOARD BUTTON ------------------
const DashboardButton = ({
  title,
  subtitle,
  icon,
  color,
  onPress,
  disabled,
  loading
}) => (
  <TouchableOpacity
    style={[styles.dashBtn, disabled && styles.dashBtnDisabled]}
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.8}
  >
    <View
      style={[
        styles.iconCircle,
        { backgroundColor: disabled ? "#ECEFF1" : color + "15" }
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <MaterialCommunityIcons
          name={icon}
          size={32}
          color={disabled ? "#B0BEC5" : color}
        />
      )}
    </View>

    <View style={styles.btnContent}>
      <Text style={[styles.btnTitle, disabled && { color: "#90A4AE" }]}>
        {title}
      </Text>
      <Text style={styles.btnSubtitle}>
        {disabled ? "Akses Terkunci" : subtitle}
      </Text>
    </View>

    {disabled && (
      <View style={styles.lockIcon}>
        <Ionicons name="lock-closed" size={16} color="#B0BEC5" />
      </View>
    )}
  </TouchableOpacity>
);

const HomeCatatanPartograf = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const partografId = location.state?.partografId;

  const [catatanPartografId, setCatatanPartografId] = useState(null);
  const [isCheckingId, setIsCheckingId] = useState(true);

  useEffect(() => {
    const loadCatatanId = async () => {
      setIsCheckingId(true);
      if (partografId) {
        const saved = await AsyncStorage.getItem(`catatanId_${partografId}`);
        if (saved) setCatatanPartografId(saved);
      }
      setIsCheckingId(false);
    };
    loadCatatanId();
  }, [partografId]);

  // -- HANDLERS --
  const handleDataPartografPress = () => {
    if (partografId) navigate(`/partograf/${partografId}/catatan`);
    else Alert.alert("Error", "ID Partograf Missing");
  };

  const handleMonitorKontraksiPress = () => {
    if (!catatanPartografId)
      return Alert.alert(
        "Akses Ditolak",
        "Mohon lengkapi 'Data Awal Partograf' terlebih dahulu."
      );
    navigate(`/partograf/${partografId}/kontraksi`, {
      state: { catatanPartografId }
    });
  };

  // -- RENDER CONTENT --
  const renderContent = () => {
    const hasData = !!catatanPartografId;

    if (isCheckingId) {
      return (
        <View style={styles.loadingView}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loadingText}>Memuat Rekam Medis...</Text>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {/* 1. PATIENT CARD (HEADER) */}
        <View style={styles.patientCard}>
          <View style={styles.patientRow}>
            <View style={styles.avatarBox}>
              <FontAwesome5 name="user-injured" size={24} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patientLabel}>NO. REGISTRASI</Text>
              <Text style={styles.patientValue}>{partografId || "N/A"}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: hasData ? "#E8F5E9" : "#FFEBEE" }
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: hasData ? "#2E7D32" : "#C62828" }
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: hasData ? "#2E7D32" : "#C62828" }
                ]}
              >
                {hasData ? "AKTIF" : "PENDING"}
              </Text>
            </View>
          </View>

          {!hasData && (
            <View style={styles.alertBox}>
              <Ionicons
                name="alert-circle"
                size={16}
                color="#D32F2F"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.alertText}>
                Isi Data Awal untuk membuka menu Kontraksi & 30 Menit.
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionHeader}>DASHBOARD OBSERVASI</Text>

        {/* 2. DASHBOARD GRID */}
        <View style={styles.gridContainer}>
          {/* A. DATA AWAL */}
          <DashboardButton
            title="Data Awal"
            subtitle="Identitas & Kondisi"
            icon="clipboard-account"
            color={THEME.menuData}
            onPress={handleDataPartografPress}
          />

          {/* B. KONTRAKSI */}
          <DashboardButton
            title="Kontraksi"
            subtitle="Monitor Real-time"
            icon="timer-sand"
            color={THEME.menuKontraksi}
            onPress={handleMonitorKontraksiPress}
            disabled={!hasData}
          />

          {/* C. 30 MENIT */}
          <DashboardButton
            title="Obs. 30 Menit"
            subtitle="DJJ, Nadi, His"
            icon="heart-pulse"
            color={THEME.menu30}
            onPress={() =>
              navigate(`/partograf/${partografId}/catatan/per30`, {
                state: { partografId, catatanPartografId }
              })
            }
            disabled={!hasData}
          />

          {/* D. 4 JAM (SEKARANG TIDAK TERKUNCI) */}
          <DashboardButton
            title="Obs. 4 Jam"
            subtitle="V.T, Tensi, Suhu"
            icon="doctor"
            color={THEME.menu4h}
            onPress={() =>
              navigate(`/partograf/${partografId}/catatan/per4jam`, {
                state: { partografId, catatanPartografId }
              })
            }
            // Disabled dihapus agar selalu bisa diakses
          />

          <DashboardButton
            title="Hasil Input"
            subtitle="Lihat Catatan"
            icon="file-document-outline"
            color="#6A1B9A" // ungu
            onPress={() =>
              navigate(`/partograf/${partografId}/hasil-input`, {
                state: { partografId }
              })
            }
            disabled={!hasData}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor={THEME.bg} barStyle="dark-content" />

      {/* APP BAR */}
      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={() => navigate("/home")}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={24} color={THEME.textMain} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Rekam Medis Digital</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons
            name="dots-vertical"
            size={24}
            color={THEME.textMain}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {renderContent()}
      </ScrollView>
    </View>
  );
};

// ------------------ STYLES (CLINICAL DASHBOARD) ------------------
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: THEME.bg },

  // APP BAR
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    elevation: 2
  },
  appBarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.textMain,
    letterSpacing: 0.5,
    textTransform: "uppercase"
  },
  backBtn: { padding: 4 },

  // LOADING
  loadingView: { alignItems: "center", marginTop: 60 },
  loadingText: { marginTop: 16, color: THEME.textSec, fontWeight: "500" },

  contentContainer: { padding: 20 },

  // PATIENT CARD
  patientCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    elevation: 3
  },
  patientRow: { flexDirection: "row", alignItems: "center" },
  avatarBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: THEME.textSec,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16
  },
  patientLabel: {
    fontSize: 10,
    color: THEME.textSec,
    fontWeight: "bold",
    letterSpacing: 1
  },
  patientValue: {
    fontSize: 18,
    color: THEME.textMain,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace"
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 10, fontWeight: "bold" },

  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    backgroundColor: "#FFEBEE",
    padding: 10,
    borderRadius: 8
  },
  alertText: { fontSize: 12, color: "#C62828" },

  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#90A4AE",
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1
  },

  // GRID SYSTEM
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },

  // DASHBOARD BUTTON
  dashBtn: {
    width: "48%", // 2 Kolom
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ECEFF1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    elevation: 2,
    height: 160, // Tinggi tetap agar rapi
    justifyContent: "space-between"
  },
  dashBtnDisabled: { backgroundColor: "#FAFAFA", borderColor: "#F5F5F5" },

  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12
  },
  btnContent: { flex: 1, justifyContent: "flex-end" },
  btnTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.textMain,
    marginBottom: 4
  },
  btnSubtitle: { fontSize: 11, color: THEME.textSec },

  lockIcon: {
    position: "absolute",
    top: 12,
    right: 12
  }
});

export default HomeCatatanPartograf;
