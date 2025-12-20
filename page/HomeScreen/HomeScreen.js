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
  Pressable
} from "react-native";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  Feather
} from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigate } from "react-router-native";

// Import Komponen Eksternal
import TambahPasienForm from "./TambahPasienForm";
import ProfileScreen from "../ProfileScreen/ProfileScreen";
import TambahEdukasi from "../KontenEdukasi/TambahEdukasi";
import {
  registerForPushNotificationsAsync,
  cancelAllReminders
} from "../../src/NotificationService";

// ======================= THEME & UTILS ==========================
const THEME = {
  bg: "#F4F6F8",
  primary: "#448AFF",
  cardBg: "#FFFFFF",
  textMain: "#263238",
  textSec: "#78909C",
  border: "#ECEFF1",
  active: "#29B6F6",
  inactive: "#BDBDBD",
  done: "#66BB6A",
  referral: "#FFA726",
  danger: "#E53935"
};

const formatNoReg = (noReg) =>
  !noReg ? "" : noReg.toString().replace(".00", "");

// ======================= COMPONENT: PATIENT CARD ==========================
const PasienCard = ({ pasien, onPress, onStatusPress }) => {
  const status = pasien.persalinan?.status || "tidak diketahui";
  const getStatusConfig = () => {
    switch (status) {
      case "aktif":
        return { color: THEME.active, label: "Aktif", icon: "pulse" };
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
          label: "Non-Aktif",
          icon: "bed-outline"
        };
    }
  };
  const statusConfig = getStatusConfig();

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
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.color + "15" }
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
        <View style={styles.divider} />
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
    </TouchableOpacity>
  );
};

// ======================= MAIN SCREEN ==========================
export default function HomeScreen() {
  const navigate = useNavigate();
  const [activeScreen, setActiveScreen] = useState("home");
  const [modalVisible, setModalVisible] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [pasienList, setPasienList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPasienList = pasienList.filter((pasien) =>
    pasien.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchPasien = async (token) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        "https://restful-api-bmc-production-v2.up.railway.app/api/bidan/pasien",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await res.json();
      setPasienList(data.daftar_pasien || []);
    } catch (err) {
      console.log("Fetch Error:", err);
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

    // FIX: Sekarang manggil file eksternal TambahEdukasi.js
    if (activeScreen === "edukasi") {
      return <TambahEdukasi token={userToken} navigate={navigate} />;
    }

    return (
      <View style={{ flex: 1 }}>
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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
                    state: {
                      partografId: pasien.partograf_id,
                      name: pasien.nama,
                      noReg: pasien.no_reg
                    }
                  })
                }
              />
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <View style={styles.container}>
        {/* Header Section */}
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
              size={20}
              color={
                activeScreen === "profile" ? THEME.primary : THEME.textMain
              }
            />
          </TouchableOpacity>
        </View>

        {/* Dynamic Content Area */}
        <View style={styles.contentContainer}>{renderContent()}</View>

        {/* Bottom Navigation Bar */}
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
            <Ionicons name="add" size={32} color="#FFF" />
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

        {/* Modal Tambah Pasien */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <TambahPasienForm
            onClose={() => setModalVisible(false)}
            onSuccess={() => {
              setModalVisible(false);
              fetchPasien(userToken);
            }}
            token={userToken}
          />
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF" },
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
  appNameText: { fontSize: 18, fontWeight: "bold", color: THEME.textMain },
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.primary,
    justifyContent: "center",
    alignItems: "center",
    bottom: 25,
    elevation: 8,
    borderWidth: 4,
    borderColor: THEME.bg
  },
  labelAdd: {
    position: "absolute",
    bottom: 10,
    fontSize: 10,
    color: THEME.textSec,
    fontWeight: "600"
  }
});
