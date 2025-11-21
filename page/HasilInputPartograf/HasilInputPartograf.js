import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useParams, useNavigate } from "react-router-native";

// ======================= THEME ==========================
const THEME = {
  bg: "#F4F6F8",
  primary: "#0277BD",
  textMain: "#263238",
  textSec: "#78909C",
  cardBg: "#FFFFFF",
  border: "#ECEFF1",
  
  // Warna Kategori
  colorPersalinan: "#8E24AA", // Ungu
  colorJanin: "#00897B",      // Teal
  colorIbu: "#E53935",        // Merah
  colorObat: "#F57C00"        // Orange
};

// ------------------ COMPONENT: DASHBOARD BUTTON (Style Referensi) ------------------
const DashboardButton = ({
  title,
  subtitle,
  icon,
  color,
  onPress
}) => (
  <TouchableOpacity
    style={styles.dashBtn}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={[styles.iconCircle, { backgroundColor: color + "15" }]}>
      <MaterialCommunityIcons name={icon} size={32} color={color} />
    </View>

    <View style={styles.btnContent}>
      <Text style={styles.btnTitle}>{title}</Text>
      <Text style={styles.btnSubtitle}>{subtitle}</Text>
    </View>
    
    {/* Indikator Panah Kecil di pojok */}
    <View style={styles.arrowIcon}>
       <MaterialCommunityIcons name="chevron-right" size={20} color={THEME.textSec} />
    </View>
  </TouchableOpacity>
);

const HasilInputPartograf = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fungsi Navigasi
  const handlePress = (category) => {
    // Mengarahkan ke sub-halaman detail (Sesuaikan route ini nantinya)
    navigate(`/partograf/${id}/hasil/${category}`);
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar backgroundColor={THEME.bg} barStyle="dark-content" />

      {/* APP BAR */}
      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={() => navigate(-1)}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={THEME.textMain} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Hasil Input Partograf</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionHeader}>KATEGORI DATA</Text>

        <View style={styles.gridContainer}>
          {/* 1. KEMAJUAN PERSALINAN */}
          <DashboardButton
            title="Kemajuan Persalinan"
            subtitle="Pembukaan, Penurunan, Kontraksi"
            icon="human-pregnant"
            color={THEME.colorPersalinan}
            onPress={() => handlePress('persalinan')}
          />

          {/* 2. KONDISI JANIN */}
          <DashboardButton
            title="Kondisi Janin"
            subtitle="DJJ, Molase, Air Ketuban"
            icon="baby-face-outline"
            color={THEME.colorJanin}
            onPress={() => handlePress('janin')}
          />

          {/* 3. KONDISI IBU */}
          <DashboardButton
            title="Kondisi Ibu"
            subtitle="Nadi, Tensi, Suhu, Urin"
            icon="mother-heart"
            color={THEME.colorIbu}
            onPress={() => handlePress('ibu')}
          />

          {/* 4. OBAT & CAIRAN */}
          <DashboardButton
            title="Obat & Cairan"
            subtitle="Oksitosin, Cairan Infus"
            icon="pill"
            color={THEME.colorObat}
            onPress={() => handlePress('obat')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: THEME.bg },

  // APP BAR
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    elevation: 2
  },
  backBtn: { marginRight: 16 },
  appBarTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.textMain,
  },

  contentContainer: { padding: 20 },
  
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

  // BUTTON STYLES (Sesuai Referensi)
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
    height: 160,
    justifyContent: "space-between",
    position: 'relative'
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12
  },
  btnContent: {
    flex: 1,
    justifyContent: "flex-end"
  },
  btnTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.textMain,
    marginBottom: 4
  },
  btnSubtitle: {
    fontSize: 11,
    color: THEME.textSec
  },
  arrowIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    opacity: 0.5
  }
});

export default HasilInputPartograf;