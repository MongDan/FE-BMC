import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity, // Pakai ini biar aman
  StatusBar,
  ScrollView,
  Modal
  // Alert dihapus
} from "react-native";
import { MaterialCommunityIcons, Ionicons, Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useParams, useNavigate, useLocation } from "react-router-native";

// ======================= THEME ==========================
const THEME = {
  bg: "#F4F6F8",
  primary: "#0277BD",
  textMain: "#263238",
  textSec: "#78909C",
  cardBg: "#FFFFFF",
  border: "#ECEFF1",

  colorPersalinan: "#8E24AA",
  colorJanin: "#00897B",
  colorIbu: "#E53935",
  colorObat: "#F57C00",

  // Warna Modal
  success: "#2E7D32",
  danger: "#E53935",
  warning: "#FFB300",
  card: "#FFFFFF"
};

// ------------------ COMPONENT: CUSTOM MODAL ALERT ------------------
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
              { backgroundColor: iconColor + "15" }
            ]}
          >
            <Feather name={name} size={30} color={iconColor} />
          </View>
          <Text style={modalStyles.title}>{title}</Text>
          <Text style={modalStyles.message}>{message}</Text>
          <View style={modalStyles.buttonContainer}>
            {type === "confirm" ? (
              <>
                <TouchableOpacity
                  style={[
                    modalStyles.button,
                    modalStyles.ghostButton,
                    { flex: 1 }
                  ]}
                  onPress={onClose}
                >
                  <Text style={modalStyles.ghostButtonText}>{cancelText}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    modalStyles.button,
                    {
                      backgroundColor: mainButtonColor,
                      flex: 1,
                      marginLeft: 10
                    }
                  ]}
                  onPress={onConfirm}
                >
                  <Text style={modalStyles.buttonText}>{confirmText}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[
                  modalStyles.button,
                  { backgroundColor: singleButtonColor, minWidth: "50%" }
                ]}
                onPress={onClose}
              >
                <Text style={modalStyles.buttonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ------------------ DASHBOARD BUTTON ------------------
const DashboardButton = ({ title, subtitle, icon, color, onPress }) => (
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

    <View style={styles.arrowIcon}>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={THEME.textSec}
      />
    </View>
  </TouchableOpacity>
);

const HasilInputPartograf = () => {
  const { id } = useParams();
  const location = useLocation();
  const partografId = location.state?.partografId || id;
  const navigate = useNavigate();

  // --- STATE UNTUK CUSTOM MODAL ---
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
    confirmText: "OK",
    cancelText: "Tutup"
  });

  // Fungsi Helper Modal
  const showCustomAlert = (title, message, type = "info") => {
    setModalContent({
      title,
      message,
      type,
      confirmText: "OK",
      cancelText: "Tutup",
      onConfirm: null
    });
    setModalVisible(true);
  };

  // Fungsi navigasi menu
  const handlePress = (to) => {
    if (!partografId) {
      // GANTI ALERT BIASA KE MODAL ERROR
      showCustomAlert("Error", "Id Partograf tidak ditemukan.", "danger");
      return;
    }

    const finalPath = to.replace(":id", partografId);
    navigate(finalPath, { state: { partografId } });
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar backgroundColor={THEME.bg} barStyle="dark-content" />

      {/* --- RENDER CUSTOM MODAL --- */}
      <CustomAlertModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={modalContent.title}
        message={modalContent.message}
        type={modalContent.type}
        confirmText={modalContent.confirmText}
        onConfirm={modalContent.onConfirm}
        cancelText={modalContent.cancelText}
      />

      {/* APP BAR */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigate(-1)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={THEME.textMain} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Hasil Input Partograf</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionHeader}>KATEGORI DATA</Text>

        <View style={styles.gridContainer}>
          <DashboardButton
            title="Kemajuan Persalinan"
            subtitle="Pembukaan, Penurunan, Kontraksi"
            icon="human-pregnant"
            color={THEME.colorPersalinan}
            onPress={() =>
              handlePress("/partograf/:id/catatan/kemajuan-persalinan")
            }
          />

          <DashboardButton
            title="Kondisi Janin"
            subtitle="DJJ, Molase, Air Ketuban"
            icon="baby-face-outline"
            color={THEME.colorJanin}
            onPress={() => handlePress("/partograf/:id/catatan/kondisi-janin")}
          />

          <DashboardButton
            title="Kondisi Ibu"
            subtitle="Nadi, Tensi, Suhu, Urin"
            icon="mother-heart"
            color={THEME.colorIbu}
            onPress={() => handlePress("/partograf/:id/catatan/kondisi-ibu")}
          />

          <DashboardButton
            title="Obat & Cairan"
            subtitle="Oksitosin, Cairan Infus"
            icon="pill"
            color={THEME.colorObat}
            onPress={() =>
              handlePress("/partograf/:id/catatan/obat-dan-cairan")
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: THEME.bg },

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
    textAlign: "center",
    flex: 1,
    marginRight: 40
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

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
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
    height: 160,
    justifyContent: "space-between",
    position: "relative"
  },
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
  arrowIcon: { position: "absolute", top: 12, right: 12, opacity: 0.5 }
});

// --- STYLES KHUSUS MODAL ---
const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 20
  },
  alertBox: {
    width: "100%",
    backgroundColor: THEME.card,
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

export default HasilInputPartograf;
