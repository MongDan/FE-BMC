import React, { useEffect, useState, useRef } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Text,
  Alert,
  Platform, // Import Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useLocation, useNavigate } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export default function PartografWebview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { partografId, noReg } = location.state || {};

  const [url, setUrl] = useState(null);
  const webViewRef = useRef(null);

  // 1. Setup URL (Sama seperti kodemu)
  useEffect(() => {
    const prepareUrl = async () => {
      try {
        const userToken = await AsyncStorage.getItem("userToken");
        // Gunakan IP lokal komputer jika testing di emulator (misal 192.168.x.x) atau URL Vercel
        // const baseUrl = "http://192.168.1.5:5500/index.html"; // Contoh jika pakai Live Server lokal
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
          encoding: "base64", // <--- Ganti jadi string biasa (pakai tanda kutip)
        });

        // Cek apakah fitur sharing tersedia
        if (await Sharing.isAvailableAsync()) {
          // Beritahu WebView bahwa proses Native sukses, loading di Web bisa berhenti
          postMessageToWebView("PDF_SHARED");

          // Buka Dialog Share (User bisa memilih 'Save to Files' atau kirim ke WA/Email)
          await Sharing.shareAsync(fileUri, {
            mimeType: "application/pdf",
            dialogTitle: `Simpan atau Bagikan ${filename}`,
            UTI: "com.adobe.pdf", // Khusus iOS agar dikenali sebagai PDF
          });
        } else {
          postMessageToWebView(
            "PDF_ERROR",
            "Sharing tidak didukung di perangkat ini."
          );
          Alert.alert("Error", "Fitur berbagi tidak tersedia.");
        }
      }
    } catch (error) {
      console.error("Error handling WebView message:", error);
      postMessageToWebView("PDF_ERROR", error.message);
      Alert.alert("Error Detail", `Gagal menyimpan file: ${error.message}`);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
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
            originWhitelist={["*"]} // PENTING: Agar bisa load konten lokal/https
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#448AFF" />
              </View>
            )}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onMessage={onWebViewMessage}
            // PENTING: Untuk Android agar permission file system lancar
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
    elevation: 2,
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textTransform: "uppercase",
  },
  loadingContainer: {
    position: "absolute",
    inset: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
});
