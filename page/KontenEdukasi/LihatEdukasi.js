import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Modal,
  Platform
} from "react-native";
import {
  MaterialIcons,
  Ionicons,
  Feather,
  MaterialCommunityIcons
} from "@expo/vector-icons";
import { useLocation, useNavigate } from "react-router-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ======================= MEDICAL THEME ==========================
const THEME = {
  bg: "#F4F6F8",
  primary: "#448AFF",
  cardBg: "#FFFFFF",
  textMain: "#263238",
  textSec: "#78909C",
  border: "#ECEFF1",
  danger: "#EF5350",
  white: "#FFFFFF"
};

export default function LihatEdukasi() {
  const location = useLocation();
  const navigate = useNavigate();
  const { kontenData } = location.state || {};
  const [isLoading, setIsLoading] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  // === FUNGSI DELETE (TETAP SAMA) ===
  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      const res = await fetch(
        `https://restful-api-bmc-production-v2.up.railway.app/api/konten-edukasi/${kontenData.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.ok) navigate("/konten-edukasi", { replace: true });
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
      setConfirmVisible(false);
    }
  };

  if (!kontenData) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* HEADER: Putih Bersih ala Home/Profile */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate(-1)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={THEME.textMain} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Detail Materi</Text>
          <Text style={styles.headerSubTitle}>ID: {kontenData.id}</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteIconBtn}
          onPress={() => setConfirmVisible(true)}
        >
          <Feather name="trash-2" size={20} color={THEME.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Judul dengan Aksen Icon */}
          <View style={styles.judulRow}>
            <View style={styles.iconBox}>
              <MaterialCommunityIcons
                name="book-open-variant"
                size={22}
                color={THEME.primary}
              />
            </View>
            <Text style={styles.judulText}>{kontenData.judul_konten}</Text>
          </View>

          <View style={styles.divider} />

          {/* Isi Materi */}
          <Text style={styles.isiText}>{kontenData.isi_konten}</Text>
        </View>

        {/* Info Footer Pelengkap Desain */}
        <View style={styles.footerInfo}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={THEME.textSec}
          />
          <Text style={styles.footerInfoText}>
            Materi ini dapat dilihat oleh semua pasien.
          </Text>
        </View>
      </ScrollView>

      {/* MODAL KONFIRMASI HAPUS: Gaya ProfileScreen */}
      <Modal
        transparent
        visible={confirmVisible}
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.alertBox}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: THEME.danger + "15" }
              ]}
            >
              <Feather name="trash" size={30} color={THEME.danger} />
            </View>

            <Text style={styles.alertTitle}>Hapus Materi?</Text>
            <Text style={styles.alertMessage}>
              Data ini akan dihapus secara permanen dari server dan tidak dapat
              dikembalikan.
            </Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.btnCancel]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.btnTextCancel}>BATAL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.btnDelete]}
                onPress={handleDelete}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.btnTextDelete}>HAPUS</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.bg },

  // Header Style
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05
  },
  backBtn: { padding: 4 },
  headerTitleContainer: { flex: 1, marginLeft: 15 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: THEME.textMain },
  headerSubTitle: { fontSize: 11, color: THEME.textSec, fontWeight: "600" },
  deleteIconBtn: {
    padding: 8,
    backgroundColor: THEME.danger + "10",
    borderRadius: 10
  },

  // Content Style
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10
  },
  judulRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: THEME.primary + "15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15
  },
  judulText: {
    flex: 1,
    fontSize: 20,
    fontWeight: "bold",
    color: THEME.textMain,
    lineHeight: 28
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F3F5",
    marginBottom: 20
  },
  isiText: {
    fontSize: 16,
    color: THEME.textMain,
    lineHeight: 26,
    textAlign: "justify"
  },
  footerInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
    opacity: 0.7
  },
  footerInfoText: {
    fontSize: 12,
    color: THEME.textSec,
    marginLeft: 6,
    fontWeight: "500"
  },

  // Modal Style (Sync dengan Profile)
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  alertBox: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    elevation: 20
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: THEME.textMain,
    marginBottom: 10
  },
  alertMessage: {
    fontSize: 14,
    color: THEME.textSec,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 20
  },
  modalButtonContainer: { flexDirection: "row", gap: 12, width: "100%" },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  btnCancel: {
    backgroundColor: THEME.bg,
    borderWidth: 1,
    borderColor: THEME.border
  },
  btnDelete: { backgroundColor: THEME.danger },
  btnTextCancel: { color: THEME.textMain, fontWeight: "bold", fontSize: 14 },
  btnTextDelete: { color: "#FFF", fontWeight: "bold", fontSize: 14 }
});
