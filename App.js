import React, { useState, useEffect } from "react";
import { NativeRouter, Routes, Route } from "react-router-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Pages
import SplashScreen from "./page/splashScreen/SplashScreen";
import LoginScreen from "./page/LoginScreen/LoginScreen";
import HomeScreen from "./page/HomeScreen/HomeScreen";
import HomeCatatanPartograf from "./page/HomeCatatanPartograf/HomeCatatanPartograf";
import CatatanPartograf from "./page/CatatanPartograf/CatatanPartograf";
import MonitorKontraksi from "./page/MonitorKontraksi/MonitorKontraksi";

// → Tambahan 2 page baru
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
        <Routes>
          <Route path="/" element={<LoginScreen />} />
          <Route path="/home" element={<HomeScreen />} />

          <Route path="/home-catatan/:id" element={<HomeCatatanPartograf />} />

          {/* ROUTE LAMA (Tetap ada untuk edit/lihat history) */}
          <Route
            path="/monitor-kontraksi/:catatanPartografId/:partografId"
            element={<MonitorKontraksi />}
          />

          <Route path="/partograf-chart" element={<PartografView />} />

          {/* === ROUTE BARU (MODE BEBAS/DRAFT) === */}
          {/* Hanya butuh partografId pasien, tanpa catatanId */}
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
