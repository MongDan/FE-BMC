import React, { useState, useEffect } from "react";
import { NativeRouter, Routes, Route } from "react-router-native";
import { View, Text } from "react-native";
import SplashScreen from "./page/splashScreen/SplashScreen";
import LoginScreen from "./page/LoginScreen/LoginScreen";
import HomeScreen from "./page/HomeScreen/HomeScreen";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Saat loading tampilkan SplashScreen
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NativeRouter>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/home" element={<HomeScreen />} />
      </Routes>
    </NativeRouter>
  );
}
