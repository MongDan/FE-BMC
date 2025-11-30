import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocation, useNavigate } from "react-router-native";
import {
  MaterialIcons,
  Ionicons,
  MaterialCommunityIcons
} from "@expo/vector-icons"; // Tambahkan MaterialCommunityIcons

// ======================= THEME CONFIGURATION (BIRU) ==========================
const COLORS = {
  primary: "#1976D2", // Biru Utama (Header)
  primaryDark: "#0D47A1", // Biru Gelap
  background: "#F0F3F7", // Background lebih terang
  cardBg: "#FFFFFF",
  white: "#FFFFFF",
  textMain: "#263238",
  textSec: "#78909C",
  danger: "#E53935",
  success: "#4CAF50",
  border: "#E0E0E0",
  cancel: "#B0BEC5"
};

export default function LihatEdukasi() {
  const location = useLocation();
  const navigate = useNavigate();

  const { kontenData } = location.state || {};
  const [isDeleting, setIsDeleting] = useState(false);

  // MODAL STATES
  const [showConfirm, setShowConfirm] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const closeModal = () => {
    setShowConfirm(false);
    setShowError(false);
    setShowSuccess(false);
  };

  const handleDelete = async () => {
    setShowConfirm(true);
  };

  const confirmDeletion = async () => {
    closeModal();
    setIsDeleting(true);

    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token)
        throw new Error("Token tidak ditemukan. Silakan login ulang.");

      const res = await fetch(
        `https://restful-api-bmc-production.up.railway.app/api/konten-edukasi/${kontenData.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (res.ok) {
        setSuccessMessage("Materi edukasi berhasil dihapus.");
        setShowSuccess(true);
        setTimeout(() => navigate("/konten-edukasi", { replace: true }), 1500);
      } else {
        const data = await res.json();
        setErrorMessage(data.message || "Gagal menghapus konten.");
        setShowError(true);
      }
    } catch (err) {
      setErrorMessage(err.message || "Terjadi kesalahan server/koneksi.");
      setShowError(true);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!kontenData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text
          style={{ textAlign: "center", marginTop: 50, color: COLORS.textMain }}
        >
          Data tidak ditemukan.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      {/* ================= MODAL KONFIRMASI HAPUS ================= */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.feedbackOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconBox}>
              <MaterialIcons
                name="delete-forever"
                size={40}
                color={COLORS.danger}
              />
            </View>
            <Text style={styles.confirmTitle}>Hapus Permanen?</Text>
            <Text style={styles.confirmSubtitle}>
              Materi ini akan hilang dari aplikasi pasien. Yakin ingin
              menghapus?
            </Text>

            <View style={styles.confirmButtonContainer}>
              <TouchableOpacity
                onPress={closeModal}
                style={[styles.confirmButton, styles.cancelButton]}
              >
                <Text style={styles.confirmButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDeletion}
                style={[styles.confirmButton, styles.deleteConfirmButton]}
              >
                <Text style={styles.confirmButtonText}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL ERROR ================= */}
      <Modal
        visible={showError}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.feedbackOverlay}>
          <View style={styles.feedbackCardError}>
            <View style={styles.feedbackIconBoxError}>
              <MaterialIcons
                name="error-outline"
                size={40}
                color={COLORS.danger}
              />
            </View>
            <Text style={styles.feedbackTitleError}>Gagal!</Text>
            <Text style={styles.feedbackSubtitle}>{errorMessage}</Text>
            <TouchableOpacity
              onPress={closeModal}
              style={styles.feedbackButtonError}
            >
              <Text style={styles.feedbackButtonText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL SUCCESS ================= */}
      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.feedbackOverlay}>
          <View style={styles.feedbackCardSuccess}>
            <View style={styles.feedbackIconBoxSuccess}>
              <Ionicons
                name="checkmark-circle-outline"
                size={40}
                color={COLORS.success}
              />
            </View>
            <Text style={styles.feedbackTitleSuccess}>Berhasil!</Text>
            <Text style={styles.feedbackSubtitle}>{successMessage}</Text>
            <TouchableOpacity
              onPress={closeModal}
              style={styles.feedbackButtonSuccess}
            >
              <Text style={styles.feedbackButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header Baru */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate(-1)} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Edukasi</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Judul dan ID */}
        <View style={styles.cardHeader}></View>
        <Text style={styles.judul}>{kontenData.judul_konten}</Text>

        {/* Body Konten */}
        <View style={styles.bodyContainer}>
          <Text style={styles.isi}>{kontenData.isi_konten}</Text>
        </View>

        {/* Tombol Hapus (Di Dalam ScrollView/Konten) */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color={COLORS.danger} />
          ) : (
            <>
              <MaterialIcons
                name="delete"
                size={20}
                color={COLORS.danger}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.deleteText}>HAPUS MATERI INI</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // ================= HEADER =================
  header: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
    shadowColor: COLORS.textMain
  },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: "bold" },
  backBtn: { padding: 5 }, // Area sentuh untuk ikon

  // ================= CONTENT =================
  content: {
    padding: 20,
    paddingBottom: 40
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 5
  },
  labelId: {
    color: COLORS.textSec,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5
  },
  judul: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.textMain,
    lineHeight: 32,
    marginBottom: 20,
    paddingHorizontal: 5
  },

  bodyContainer: {
    backgroundColor: COLORS.cardBg,
    padding: 20,
    borderRadius: 12,
    minHeight: 300,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    marginBottom: 25
  },
  isi: {
    fontSize: 16,
    color: COLORS.textMain,
    lineHeight: 26,
    textAlign: "justify"
  },

  // ================= DELETE BUTTON =================
  deleteButton: {
    backgroundColor: COLORS.white,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
    elevation: 1
  },
  deleteText: {
    color: COLORS.danger,
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1
  },

  // ================= MODAL STYLES =================
  feedbackOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },

  // Konfirmasi Hapus Modal
  confirmCard: {
    width: "85%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    elevation: 10
  },
  confirmIconBox: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textMain,
    marginBottom: 8
  },
  confirmSubtitle: {
    fontSize: 14,
    color: COLORS.textSec,
    textAlign: "center",
    marginBottom: 30
  },
  confirmButtonContainer: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around"
  },
  confirmButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5
  },
  cancelButton: {
    backgroundColor: COLORS.cancel
  },
  deleteConfirmButton: {
    backgroundColor: COLORS.danger
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold"
  },

  // General Feedback Modal (Success/Error)
  feedbackSubtitle: {
    fontSize: 14,
    color: COLORS.textMain,
    textAlign: "center",
    marginBottom: 20
  },
  feedbackButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold"
  },

  // Modal Error
  feedbackCardError: {
    width: "85%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    elevation: 10
  },
  feedbackIconBoxError: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20
  },
  feedbackTitleError: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.danger,
    marginBottom: 8
  },
  feedbackButtonError: {
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 30
  },

  // Modal Success
  feedbackCardSuccess: {
    width: "85%",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    elevation: 10
  },
  feedbackIconBoxSuccess: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20
  },
  feedbackTitleSuccess: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.success,
    marginBottom: 8
  },
  feedbackButtonSuccess: {
    backgroundColor: COLORS.success,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 30
  }
});
