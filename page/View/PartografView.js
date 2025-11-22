import React, { useEffect, useState } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Text,
  SafeAreaView, // Agar aman di iPhone berponi
} from "react-native";
import { WebView } from "react-native-webview";
import { useLocation, useNavigate } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons"; // Pastikan icon diimport

export default function PartografWebview() {
  const navigate = useNavigate(); // Untuk fungsi Back
  const location = useLocation();
  const { partografId, noReg } = location.state || {};

  const [url, setUrl] = useState(null);

  useEffect(() => {
    const prepareUrl = async () => {
      try {
        const userToken = await AsyncStorage.getItem("userToken");

        if (userToken && partografId && noReg) {
          // GANTI URL INI DENGAN URL VERCEL KAMU YANG SUDAH DEPLOY (JANGAN SALAH LINK)
          const baseUrl = "https://partograf-view-digital.vercel.app";

          const fullUrl = `${baseUrl}?token=${userToken}&no_reg=${noReg}&partograf_id=${partografId}`;
          setUrl(fullUrl);
        }
      } catch (e) {
        console.error("Gagal ambil token", e);
      }
    };

    prepareUrl();
  }, [partografId, noReg]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

        {/* === 1. HEADER NATIVE (TOMBOL BACK) === */}
        {/* Ini berada di LUAR Webview, jadi tidak akan mengganggu grafik */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigate(-1)} // Fungsi Kembali ke halaman sebelumnya
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Visualisasi Partograf</Text>

          {/* Dummy View biar Title di tengah */}
          <View style={{ width: 24 }} />
        </View>

        {/* === 2. AREA WEBVIEW === */}
        {!url ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#448AFF" />
          </View>
        ) : (
          <WebView
            source={{ uri: url }}
            style={{ flex: 1 }}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#448AFF" />
              </View>
            )}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  // Style untuk Header di atas
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#FFF",
    elevation: 2, // Bayangan tipis di Android
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  loadingContainer: {
    position: "absolute",
    height: "100%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
});
