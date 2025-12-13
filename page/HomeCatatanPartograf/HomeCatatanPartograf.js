import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome5,
  Ionicons,
} from "@expo/vector-icons";
import { useNavigate, useLocation } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

// === TEMA WARNA ===
const THEME = {
  bg: "#F4F6F8",
  textMain: "#263238",
  textSec: "#78909C",

  // Warna Menu
  menuRutin: "#FF7043", // Coral
  menuDalam: "#3949AB", // Indigo
  menuGrafik: "#00897B", // Teal
  menuRiwayat: "#6A1B9A", // Purple

  // Warna Status
  active: "#29B6F6",
  inactive: "#BDBDBD",
  done: "#66BB6A",
  referral: "#FFA726",
};

// HELPER: Status Config
const getStatusConfig = (status) => {
  const s = status ? status.toLowerCase() : "aktif";
  switch (s) {
    case "aktif":
      return { color: THEME.active, label: "Aktif", icon: "pulse" };
    case "tidak_aktif":
      return { color: THEME.inactive, label: "Non-Aktif", icon: "bed-outline" };
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

// COMPONENT BUTTON (Support Disabled State)
const DashboardButton = ({
  title,
  subtitle,
  icon,
  color,
  onPress,
  disabled,
}) => (
  <TouchableOpacity
    style={[styles.dashBtn, disabled && styles.dashBtnDisabled]}
    onPress={onPress}
    disabled={disabled} // Matikan klik kalau disabled
    activeOpacity={0.8}
  >
    <View
      style={[
        styles.iconCircle,
        { backgroundColor: disabled ? "#ECEFF1" : color + "15" },
      ]}
    >
      <MaterialCommunityIcons
        name={disabled ? "lock" : icon} // Ganti icon jadi gembok kalau dikunci
        size={32}
        color={disabled ? "#B0BEC5" : color}
      />
    </View>

    <View style={styles.btnContent}>
      <Text style={[styles.btnTitle, disabled && { color: "#90A4AE" }]}>
        {title}
      </Text>
      <Text style={styles.btnSubtitle}>
        {disabled ? "Terkunci (Arsip)" : subtitle}
      </Text>
    </View>
  </TouchableOpacity>
);

const HomeCatatanPartograf = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { partografId, name, noReg, status } = location.state || {};

  const [catatanPartografId, setCatatanPartografId] = useState(null);
  const [isCheckingId, setIsCheckingId] = useState(true);

  // === LOGIC PENGUCIAN (LOCK) ===
  // Input dikunci jika status BUKAN 'aktif'
  const isLocked = status && status !== "aktif";

  const statusConfig = getStatusConfig(status);

  useEffect(() => {
    const fetchStatusDariServer = async () => {
      if (!partografId) return;
      setIsCheckingId(true);
      try {
        const token = await AsyncStorage.getItem("userToken");
        const response = await fetch(
          `https://restful-api-bmc-production.up.railway.app/api/partograf/${partografId}/catatan`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const json = await response.json();
        if (response.ok && json.data && json.data.length > 0) {
          const sortedData = json.data.sort(
            (a, b) => new Date(b.waktu_catat) - new Date(a.waktu_catat)
          );
          setCatatanPartografId(sortedData[0].id);
        }
      } catch (error) {
        console.log("Error fetch:", error);
      } finally {
        setIsCheckingId(false);
      }
    };
    fetchStatusDariServer();
  }, [partografId]);

  // Alert kalau user coba klik menu terkunci (optional, karena button udah disabled)
  const handleLockedPress = () => {
    Alert.alert(
      "Akses Terkunci",
      "Pasien ini sudah tidak aktif. Anda hanya bisa melihat riwayat."
    );
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar backgroundColor={THEME.bg} barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={() => navigate("/home")}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={24} color={THEME.textMain} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Rekam Medis Digital</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40, padding: 20 }}>
        {/* KARTU PASIEN (Status Dinamis) */}
        <View
          style={[
            styles.patientCard,
            { borderLeftColor: statusConfig.color, borderLeftWidth: 4 },
          ]}
        >
          <View style={styles.patientRow}>
            <View style={styles.avatarBox}>
              <FontAwesome5 name="user-injured" size={24} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.patientLabel}>NAMA PASIEN</Text>
              <Text style={styles.patientValue}>{name || "Tanpa Nama"}</Text>
              <Text style={styles.patientReg}>No. Reg: {noReg || "-"}</Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusConfig.color + "15" },
              ]}
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
            </View>
          </View>
        </View>

        <Text style={styles.sectionHeader}>DASHBOARD OBSERVASI</Text>

        {isCheckingId ? (
          <ActivityIndicator
            size="large"
            color={THEME.menuRutin}
            style={{ marginTop: 20 }}
          />
        ) : (
          <View style={styles.gridContainer}>
            {/* 1. PANTAU RUTIN (DIKUNCI JIKA SELESAI/RUJUKAN) */}
            <DashboardButton
              title="Pantau Rutin"
              subtitle="DJJ, Nadi, & His"
              icon="heart-pulse"
              color={THEME.menuRutin}
              disabled={isLocked} // <--- LOGIC LOCK
              onPress={() =>
                navigate(`/partograf/${partografId}/catatan/per30`, {
                  state: { partografId, catatanPartografId, name: name },
                })
              }
            />

            {/* 2. PEMERIKSAAN DALAM (DIKUNCI JIKA SELESAI/RUJUKAN) */}
            <DashboardButton
              title="Periksa Dalam"
              subtitle="VT, Molase, Ketuban"
              icon="doctor"
              color={THEME.menuDalam}
              disabled={isLocked} // <--- LOGIC LOCK
              onPress={() =>
                navigate(`/partograf/${partografId}/catatan/per4jam`, {
                  state: { partografId, catatanPartografId, name: name },
                })
              }
            />

            {/* 3. GRAFIK (SELALU BUKA - Read Only) */}
            <DashboardButton
              title="Grafik Digital"
              subtitle="Visualisasi WHO"
              icon="chart-timeline-variant"
              color={THEME.menuGrafik}
              disabled={false} // Selalu aktif buat lihat data
              onPress={() =>
                navigate("/partograf-chart", { state: { partografId, noReg } })
              }
            />

            {/* 4. RIWAYAT (SELALU BUKA - Read Only Log) */}
            <DashboardButton
              title="Hasil Input"
              subtitle="Lihat Log Data"
              icon="file-document-outline"
              color={THEME.menuRiwayat}
              disabled={false} // Selalu aktif buat audit
              onPress={() =>
                navigate(`/partograf/${partografId}/hasil-input`, {
                  state: { partografId },
                })
              }
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: THEME.bg },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    elevation: 2,
  },
  appBarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.textMain,
    textTransform: "uppercase",
  },
  backBtn: { padding: 4 },

  patientCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#CFD8DC",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    elevation: 3,
  },
  patientRow: { flexDirection: "row", alignItems: "center" },
  avatarBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#78909C",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  patientLabel: {
    fontSize: 10,
    color: "#78909C",
    fontWeight: "bold",
    letterSpacing: 1,
  },
  patientValue: {
    fontSize: 16,
    color: "#263238",
    fontWeight: "bold",
    marginBottom: 2,
  },
  patientReg: { fontSize: 12, color: "#546E7A" },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase" },

  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#90A4AE",
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1,
  },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  dashBtn: {
    width: "48%",
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
    height: 150,
    justifyContent: "space-between",
  },

  // Style khusus kalau Disabled (Terkunci)
  dashBtnDisabled: {
    backgroundColor: "#F5F5F5",
    borderColor: "#EEEEEE",
    opacity: 0.8,
  },

  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  btnContent: { flex: 1, justifyContent: "flex-end" },
  btnTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.textMain,
    marginBottom: 4,
  },
  btnSubtitle: { fontSize: 11, color: THEME.textSec },
});

export default HomeCatatanPartograf;
