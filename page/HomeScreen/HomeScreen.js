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
  Platform
} from "react-native";
// Menggunakan FontAwesome5 untuk ikon medis yang lebih lengkap
import { Ionicons, FontAwesome, MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import TambahPasienForm from "./TambahPasienForm";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ProfileScreen from "../ProfileScreen/ProfileScreen";
import { useNavigate } from "react-router-native";

// ======================= MEDICAL THEME COLORS ==========================
const THEME = {
  bg: "#F4F6F8",       // Background Abu-abu Klinis (lembut di mata)
  primary: "#448AFF",  // Biru Utama (sesuai logo awal)
  accent: "#00897B",   // Teal (aksen medis)
  cardBg: "#FFFFFF",
  textMain: "#263238", // Dark Blue Grey (lebih lembut dari hitam murni)
  textSec: "#78909C",  // Abu-abu Teks
  border: "#ECEFF1",   // Border Halus
  inputBg: "#FFFFFF",
  
  // Status Colors (Indikator kondisi pasien)
  active: "#29B6F6",   // Light Blue - Pasien Aktif
  inactive: "#BDBDBD", // Grey - Tidak Aktif
  done: "#66BB6A",     // Green - Selesai/Pulang
  referral: "#FFA726"  // Orange - Rujukan
};

// Utilitas Format
const formatNoReg = (noReg) => {
  if (!noReg) return "";
  return noReg.toString().replace(".00", "");
};

const formatDatetime = (datetime) => {
  if (!datetime) return "-";
  const date = new Date(datetime);
  return `${date.getDate()} ${date.toLocaleString("id-ID", {
    month: "short",
  })} ${date.getFullYear()}, ${date.getHours()}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
};

// ------------------ COMPONENT: PATIENT CARD (Kartu Rekam Medis) ------------------
const PasienCard = ({ pasien, onPress }) => {
  const status = pasien.persalinan?.status || "tidak diketahui";

  const getStatusConfig = () => {
    switch (status) {
      case "aktif": return { color: THEME.active, label: "Aktif", icon: "pulse" };
      case "tidak_aktif": return { color: THEME.inactive, label: "Non-Aktif", icon: "bed-outline" };
      case "selesai": return { color: THEME.done, label: "Selesai", icon: "checkmark-circle-outline" };
      case "rujukan": return { color: THEME.referral, label: "Rujukan", icon: "arrow-redo-outline" };
      default: return { color: THEME.inactive, label: "Unknown", icon: "help-circle-outline" };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.card, { borderLeftColor: statusConfig.color }]}>
        
        {/* Header Kartu: Nama & Status */}
        <View style={styles.cardHeader}>
          <View style={[styles.avatarCircle, { backgroundColor: THEME.primary + '15' }]}>
             <Text style={[styles.avatarText, { color: THEME.primary }]}>
                {pasien.nama.charAt(0).toUpperCase()}
             </Text>
          </View>
          
          <View style={styles.headerInfo}>
             <Text style={styles.cardName} numberOfLines={1}>{pasien.nama}</Text>
             <Text style={styles.cardReg}>No. RM: {formatNoReg(pasien.no_reg)}</Text>
          </View>

          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '15' }]}>
             <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} style={{marginRight: 4}}/>
             <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Body Kartu: Detail Pasien */}
        <View style={styles.cardBody}>
          {/* Baris 1: Umur & Alamat */}
          <View style={styles.infoRow}>
             <MaterialIcons name="cake" size={14} color={THEME.textSec} />
             <Text style={styles.infoText}>{pasien.umur} Th</Text>
             
             <Text style={styles.infoSeparator}>|</Text>
             
             <MaterialIcons name="location-on" size={14} color={THEME.textSec} />
             <Text style={[styles.infoText, {flex:1}]} numberOfLines={1}>{pasien.alamat}</Text>
          </View>

          {/* Baris 2: Data Klinis (Ketuban/Mules) jika ada */}
          {(pasien.jam_ketuban_pecah || pasien.tgl_jam_mules) && (
            <View style={styles.clinicalInfoContainer}>
               {pasien.jam_ketuban_pecah && (
                 <View style={styles.clinicalItem}>
                    <MaterialCommunityIcons name="water-outline" size={14} color="#0288D1" />
                    <Text style={styles.clinicalLabel}>Ketuban:</Text>
                    <Text style={styles.clinicalValue}>{formatDatetime(pasien.jam_ketuban_pecah)}</Text>
                 </View>
               )}
               {pasien.tgl_jam_mules && (
                 <View style={styles.clinicalItem}>
                    <MaterialCommunityIcons name="clock-time-four-outline" size={14} color="#E65100" />
                    <Text style={styles.clinicalLabel}>Mules:</Text>
                    <Text style={styles.clinicalValue}>{formatDatetime(pasien.tgl_jam_mules)}</Text>
                 </View>
               )}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const navigate = useNavigate();

  const [modalVisible, setModalVisible] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [pasienList, setPasienList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeScreen, setActiveScreen] = useState("home");

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
        console.log("❌ ERROR LOAD:", e);
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleFormSuccess = () => {
    setModalVisible(false);
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
           <MaterialIcons name="person-search" size={60} color={THEME.textSec + '50'} />
           <Text style={styles.emptyText}>Belum ada data pasien.</Text>
        </View>
      );

    return filteredPasienList.map((pasien, index) => (
      <PasienCard
        key={pasien.no_reg || `pasien-${index}`}
        pasien={pasien}
        onPress={() =>
          navigate("/home-catatan", {
            state: { partografId: pasien.partograf_id },
          })
        }
      />
    ));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        
        {/* HEADER: Logo & Nama Aplikasi Saja */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Pastikan path logo benar */}
            <Image 
              source={require("../../assets/Logo.png")} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={styles.appNameContainer}>
               <Text style={styles.appNameText}>Ruang</Text>
               <Text style={[styles.appNameText, { color: THEME.primary }]}>Bunda</Text>
            </View>
          </View>
          
          {/* Tombol Notifikasi */}
          <TouchableOpacity style={styles.iconButton}>
             <Ionicons name="notifications-outline" size={24} color={THEME.textMain} />
             {/* Dot indikator notifikasi */}
             <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>

        {/* KONTEN UTAMA */}
        <View style={styles.contentContainer}>
          {activeScreen === "home" ? (
            <>
              {/* Search Bar Modern */}
              <View style={styles.searchWrapper}>
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color={THEME.textSec} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Cari Pasien (Nama / No. RM)..."
                    placeholderTextColor={THEME.textSec}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>

              {/* List Pasien */}
              <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionTitle}>DAFTAR PASIEN</Text>
                {renderHomeContent()}
              </ScrollView>
            </>
          ) : (
            <ProfileScreen style={styles.profileArea} />
          )}
        </View>

        {/* TOMBOL CHAT MENGAMBANG (BUBBLE) */}
        <TouchableOpacity style={styles.chatFab} activeOpacity={0.8}>
           <MaterialIcons name="chat-bubble" size={24} color="white" />
        </TouchableOpacity>

        {/* BOTTOM NAVIGATION & TOMBOL TAMBAH */}
        <View style={styles.bottomNav}>
          {/* Tab Kiri: Home */}
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveScreen("home")}
          >
            <Ionicons
              name={activeScreen === "home" ? "home" : "home-outline"}
              size={24}
              color={activeScreen === "home" ? THEME.primary : THEME.textSec}
            />
            <Text style={[styles.navText, activeScreen === "home" && styles.navTextActive]}>
              Beranda
            </Text>
          </TouchableOpacity>

          {/* Tombol Tengah: Tambah Pasien (+) Besar */}
          <TouchableOpacity
            style={styles.addFab}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.9}
          >
            <Ionicons name="add" size={36} color="#FFF" />
          </TouchableOpacity>

          {/* Tab Kanan: Profil */}
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveScreen("profile")}
          >
            <FontAwesome5
              name={activeScreen === "profile" ? "user-alt" : "user"}
              size={20}
              color={activeScreen === "profile" ? THEME.primary : THEME.textSec}
            />
            <Text style={[styles.navText, activeScreen === "profile" && styles.navTextActive]}>
              Profil
            </Text>
          </TouchableOpacity>
        </View>

        {/* MODAL TAMBAH PASIEN */}
        <Modal
          visible={modalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <TambahPasienForm
            onClose={() => setModalVisible(false)}
            onSuccess={handleFormSuccess}
            token={userToken}
          />
        </Modal>
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

  // HEADER
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: "#FFF", 
    borderBottomWidth: 1, borderBottomColor: THEME.border,
    elevation: 2, shadowColor: "#000", shadowOffset: {width:0, height:1}, shadowOpacity: 0.05
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 32, height: 32, marginRight: 8 },
  appNameContainer: { flexDirection: 'column', justifyContent: 'center' }, // Stack vertikal atau horizontal sesuai selera
  appNameText: { fontSize: 18, fontWeight: "bold", color: THEME.textMain, lineHeight: 20 },
  
  iconButton: { padding: 8 },
  notifDot: {
    position: 'absolute', top: 8, right: 8, width: 8, height: 8,
    borderRadius: 4, backgroundColor: "#F44336", borderWidth: 1, borderColor: "#FFF"
  },

  // SEARCH BAR
  searchWrapper: { backgroundColor: "#FFF", paddingHorizontal: 20, paddingBottom: 16, paddingTop: 10 },
  searchContainer: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: THEME.bg, borderRadius: 10, paddingHorizontal: 12, height: 46,
    borderWidth: 1, borderColor: THEME.border
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: THEME.textMain },

  // CONTENT
  contentContainer: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 }, // Extra padding bawah agar tidak tertutup FAB
  profileArea: { flex: 1, padding: 20 },

  sectionTitle: {
    fontSize: 12, fontWeight: "700", color: THEME.textSec,
    marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase'
  },
  centerBox: { alignItems: 'center', marginTop: 80 },
  loadingText: { marginTop: 16, color: THEME.textSec, fontSize: 14 },
  emptyText: { marginTop: 16, color: THEME.textSec, fontSize: 14 },

  // CARD STYLES (MEDICAL)
  card: {
    backgroundColor: THEME.cardBg, borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4, // Indikator status di kiri
    borderLeftColor: THEME.inactive, // Default color, akan di-override inline style
    shadowColor: "#000", shadowOffset: {width:0, height:2}, shadowOpacity: 0.05, elevation: 2
  },
  cardHeader: { 
    flexDirection: 'row', alignItems: 'center', padding: 16, 
    borderBottomWidth: 1, borderBottomColor: "#FAFAFA" 
  },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22, 
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  avatarText: { fontSize: 18, fontWeight: "bold" },
  headerInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: "700", color: THEME.textMain, marginBottom: 2 },
  cardReg: { fontSize: 12, color: THEME.textSec },
  
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8
  },
  statusText: { fontSize: 10, fontWeight: "bold", textTransform: 'capitalize' },
  
  cardBody: { padding: 16, paddingTop: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoText: { fontSize: 13, color: THEME.textSec, marginLeft: 6 },
  infoSeparator: { marginHorizontal: 10, color: THEME.border, fontSize: 14 },
  
  clinicalInfoContainer: { 
    marginTop: 4, backgroundColor: "#F8F9FA", borderRadius: 8, padding: 10,
    flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap'
  },
  clinicalItem: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  clinicalLabel: { fontSize: 11, color: THEME.textSec, marginLeft: 6, marginRight: 4 },
  clinicalValue: { fontSize: 11, fontWeight: "bold", color: THEME.textMain },

  // === FLOATING CHAT BUTTON (BUBBLE) ===
  chatFab: {
    position: "absolute",
    right: 20,
    bottom: 90, // Di atas bottom nav
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: THEME.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: THEME.primary, shadowOffset: {width:0, height:4}, shadowOpacity: 0.3
  },

  // === BOTTOM NAV (DOCK STYLE) ===
  bottomNav: {
    flexDirection: "row", justifyContent: "space-around", alignItems: "center",
    height: 70, backgroundColor: "#FFFFFF",
    borderTopWidth: 1, borderTopColor: "#ECEFF1",
    elevation: 20, shadowColor: "#000", shadowOffset: {width:0, height:-4}, shadowOpacity: 0.05
  },
  navItem: { alignItems: "center", justifyContent: 'center', flex: 1, height: '100%' },
  navText: { fontSize: 10, marginTop: 4, color: THEME.textSec },
  navTextActive: { color: THEME.primary, fontWeight: "bold" },
  
  // === ADD BUTTON (CENTER BIG +) ===
  addFab: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: THEME.primary,
    justifyContent: "center", alignItems: 'center',
    bottom: 25, // Menonjol ke atas
    elevation: 8,
    shadowColor: THEME.primary, shadowOffset: {width:0, height:4}, shadowOpacity: 0.4,
    borderWidth: 4, borderColor: "#F4F6F8" // Border putih agar terlihat 'terpotong' dari nav bar
  },
});