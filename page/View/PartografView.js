import React, { useEffect, useState, useRef } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Text,
  // Alert, // Alert dihapus
  Platform,
  Modal,
  Pressable // Tambahan
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useLocation, useNavigate } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons, Feather } from "@expo/vector-icons"; // Tambah Feather
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

// ======================= MEDICAL THEME ==========================
const THEME = {
  bg: "#F4F6F8",
  primary: "#448AFF", // Sesuaikan dengan warna header di file ini
  cardBg: "#FFFFFF",
  textMain: "#263238",
  textSec: "#78909C",
  border: "#ECEFF1",
  danger: "#EF5350",
  success: "#66BB6A",
  warning: "#FFB300",
  card: "#FFFFFF"
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
  const singleButtonColor = iconColor;

  return (
    <Modal
      transparent={true}
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
                  { backgroundColor: singleButtonColor, minWidth: "50%" }
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

export default function PartografWebview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { partografId, noReg } = location.state || {};

  const [url, setUrl] = useState(null);
  const webViewRef = useRef(null);

  // --- STATE UNTUK CUSTOM MODAL ---
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
    confirmText: "Ya",
    cancelText: "Tutup"
  });

  // Fungsi Helper Alert
  const showCustomAlert = (title, message, type = "info", onConfirm = null) => {
    setAlertConfig({
      title,
      message,
      type,
      onConfirm,
      confirmText: "OK",
      cancelText: "Tutup"
    });
    setAlertVisible(true);
  };

  // 1. Setup URL
  useEffect(() => {
    const prepareUrl = async () => {
      try {
        const userToken = await AsyncStorage.getItem("userToken");
        // Gunakan IP lokal komputer jika testing di emulator (misal 192.168.x.x) atau URL Vercel
        // const baseUrl = "http://192.168.1.5:5500/index.html";
        const baseUrl = "https://partograf-view-digital.vercel.app";

        if (userToken && partografId && noReg) {
          const fullUrl = `${baseUrl}?token=${userToken}&no_reg=${noReg}&partograf_id=${partografId}`;
          setUrl(fullUrl);
        }
      } catch (e) {
        console.error("Gagal ambil token", e);
      }
    };
    prepareUrl();
  }, [partografId, noReg]);

  // 2. Helper kirim pesan balik ke WebView
  const postMessageToWebView = (action, message = null) => {
    if (webViewRef.current) {
      const dataToSend = JSON.stringify({ action, message });
      webViewRef.current.postMessage(dataToSend);
    }
  };

  // 3. Handler Pesan dari WebView (INTI FITUR DOWNLOAD)
  const onWebViewMessage = async (event) => {
    const rawData = event.nativeEvent.data;

    if (!rawData || typeof rawData !== "string") return;

    try {
      const data = JSON.parse(rawData);

      if (data.action === "EXPORT_PDF") {
        const { filename, data: base64Data } = data;

        // Simpan file ke Cache Directory dulu
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;

        // Tulis data base64 menjadi file fisik
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: "base64" // <--- Ganti jadi string biasa (pakai tanda kutip)
        });

        // Cek apakah fitur sharing tersedia
        if (await Sharing.isAvailableAsync()) {
          // Beritahu WebView bahwa proses Native sukses, loading di Web bisa berhenti
          postMessageToWebView("PDF_SHARED");

          // Buka Dialog Share
          await Sharing.shareAsync(fileUri, {
            mimeType: "application/pdf",
            dialogTitle: `Simpan atau Bagikan ${filename}`,
            UTI: "com.adobe.pdf" // Khusus iOS agar dikenali sebagai PDF
          });
        } else {
          postMessageToWebView(
            "PDF_ERROR",
            "Sharing tidak didukung di perangkat ini."
          );
          // GANTI ALERT ERROR
          showCustomAlert(
            "Error",
            "Fitur berbagi tidak tersedia di perangkat ini.",
            "danger"
          );
        }
      }
    } catch (error) {
      console.error("Error handling WebView message:", error);
      postMessageToWebView("PDF_ERROR", error.message);
      // GANTI ALERT ERROR DETAIL
      showCustomAlert(
        "Error Detail",
        `Gagal menyimpan file: ${error.message}`,
        "danger"
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
      {/* --- CUSTOM ALERT MODAL --- */}
      <CustomAlertModal
        isVisible={alertVisible}
        onClose={() => setAlertVisible(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
      />

      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigate(-1)}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Partograf Digital</Text>
          <View style={{ width: 24 }} />
        </View>

        {!url ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#448AFF" />
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ uri: url }}
            style={{ flex: 1 }}
            originWhitelist={["*"]}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#448AFF" />
              </View>
            )}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onMessage={onWebViewMessage}
            allowFileAccess={true}
            allowFileAccessFromFileURLs={true}
            allowUniversalAccessFromFileURLs={true}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#FFF",
    elevation: 2
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textTransform: "uppercase"
  },
  loadingContainer: {
    position: "absolute",
    inset: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white"
  }
});

// --- STYLES KHUSUS ALERT MODAL ---
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
