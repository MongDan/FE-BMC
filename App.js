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

export default function App() {
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

          <Route path="/home-catatan" element={<HomeCatatanPartograf />} />
          <Route
            path="/partograf/:id/kontraksi"
            element={<MonitorKontraksi />}
          />
          <Route path="/partograf/:id/catatan" element={<CatatanPartograf />} />
          <Route path="/partograf/:id/catatan/per30" element={<Per30MenitPage />} />
          <Route path="/partograf/:id/catatan/per4jam" element={<Per4JamPage />} />
        </Routes>
      </NativeRouter>
    </SafeAreaProvider>
  );
}
