import React, { useState, useEffect } from "react";
import { BackHandler, Alert,Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  NativeRouter,
  Routes,
  Route,
  useLocation, 
  useNavigate, 
} from "react-router-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Pages
import SplashScreen from "./page/splashScreen/SplashScreen";
import LoginScreen from "./page/LoginScreen/LoginScreen";
import HomeScreen from "./page/HomeScreen/HomeScreen";
import HomeCatatanPartograf from "./page/HomeCatatanPartograf/HomeCatatanPartograf";
import CatatanPartograf from "./page/CatatanPartograf/CatatanPartograf";
import MonitorKontraksi from "./page/MonitorKontraksi/MonitorKontraksi";

// Page Baru
import Per30MenitPage from "./page/CardMenitJam/Per30Menit";
import Per4JamPage from "./page/CardMenitJam/Per4jam";
import HasilInputPartograf from "./page/HasilInputPartograf/HasilInputPartograf";
import KemajuanPersalinan from "./page/HasilInputPartograf/KemajuanPersalinan";
import KondisiIbu from "./page/HasilInputPartograf/KondisiIbu";
import ObatDanCairan from "./page/HasilInputPartograf/ObatDanCairan";
import KondisiJanin from "./page/HasilInputPartograf/KondisiJanin";
import PartografView from "./page/View/PartografView";
import TambahEdukasi from "./page/KontenEdukasi/TambahEdukasi";
import LihatEdukasi from "./page/KontenEdukasi/LihatEdukasi";
import { registerForPushNotificationsAsync } from "./src/NotificationService";

function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const onBackPress = () => {
      const isRootScreen =
        location.pathname === "/home" || location.pathname === "/";

      if (isRootScreen) {
        setModalVisible(true);
        return true;
      } else {
        navigate(-1);
        return true;
      }
    };
    const backHandlerSubscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );
    return () => backHandlerSubscription.remove();
    
  }, [location, navigate]);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={modalStyles.backdrop}>
        <View style={modalStyles.container}>
          {/* Ikon Header */}
          <View style={modalStyles.iconContainer}>
            <Ionicons name="log-out-outline" size={40} color="#E53935" />
          </View>

          {/* Teks Judul & Pesan */}
          <Text style={modalStyles.title}>Keluar Aplikasi?</Text>
          <Text style={modalStyles.message}>
            Apakah Anda yakin ingin menutup aplikasi RuangBunda?
          </Text>

          {/* Tombol Aksi */}
          <View style={modalStyles.buttonRow}>
            {/* Tombol Batal */}
            <TouchableOpacity
              style={[modalStyles.button, modalStyles.btnCancel]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={modalStyles.textCancel}>Batal</Text>
            </TouchableOpacity>

            {/* Tombol Keluar */}
            <TouchableOpacity
              style={[modalStyles.button, modalStyles.btnExit]}
              onPress={() => BackHandler.exitApp()}
            >
              <Text style={modalStyles.textExit}>Ya, Keluar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// === APP UTAMA ===
export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <NativeRouter>
        <BackButtonHandler />

        <Routes>
          <Route path="/" element={<LoginScreen />} />
          <Route path="/home" element={<HomeScreen />} />

          <Route path="/home-catatan/:id" element={<HomeCatatanPartograf />} />

          {/* ROUTE LAMA */}
          <Route
            path="/monitor-kontraksi/:catatanPartografId/:partografId"
            element={<MonitorKontraksi />}
          />

          <Route path="/partograf-chart" element={<PartografView />} />

          {/* ROUTE BARU */}
          <Route
            path="/monitor-kontraksi-draft/:partografId"
            element={<MonitorKontraksi />}
          />

          <Route path="/partograf/:id/catatan" element={<CatatanPartograf />} />
          <Route
            path="/partograf/:id/catatan/per30"
            element={<Per30MenitPage />}
          />
          <Route
            path="/partograf/:id/catatan/per4jam"
            element={<Per4JamPage />}
          />
          <Route
            path="/partograf/:id/hasil-input"
            element={<HasilInputPartograf />}
          />
          <Route
            path="/partograf/:id/catatan/kemajuan-persalinan"
            element={<KemajuanPersalinan />}
          />
          <Route
            path="/partograf/:id/catatan/kondisi-ibu"
            element={<KondisiIbu />}
          />
          <Route
            path="/partograf/:id/catatan/kondisi-janin"
            element={<KondisiJanin />}
          />
          <Route
            path="/partograf/:id/catatan/obat-dan-cairan"
            element={<ObatDanCairan />}
          />
          <Route path="/konten-edukasi" element={<TambahEdukasi />} />
          <Route path="/lihat-konten" element={<LihatEdukasi />} />
        </Routes>
      </NativeRouter>
    </SafeAreaProvider>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Latar belakang gelap transparan
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "80%",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    elevation: 10, // Shadow untuk Android
    shadowColor: "#000", // Shadow untuk iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#FFEBEE", // Merah muda lembut
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#263238",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#78909C",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  btnCancel: {
    backgroundColor: "#F5F5F5",
    marginRight: 8,
  },
  btnExit: {
    backgroundColor: "#E53935", // Merah Danger
    marginLeft: 8,
    elevation: 2,
  },
  textCancel: {
    color: "#78909C",
    fontWeight: "bold",
    fontSize: 14,
  },
  textExit: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
});
