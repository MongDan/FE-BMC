import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigate, useLocation } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ---------------- UTIL ----------------
const formatTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

// =======================================================
//                    MAIN COMPONENT
// =======================================================
const MonitorKontraksi = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const catatanPartografId = state?.catatanPartografId;

  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [history, setHistory] = useState([]); // State untuk riwayat yang terlihat
  const [isLoading, setIsLoading] = useState(false);
  const [userToken, setUserToken] = useState(null);

  const intervalRef = useRef(null);

  // Kunci unik untuk menyimpan riwayat pasien ini
  const HISTORY_KEY = `kontraksi_history_${catatanPartografId}`;

  // ================== LOAD HISTORY (BARU) ==================
  useEffect(() => {
    const loadHistory = async () => {
      if (catatanPartografId) {
        try {
          const storedHistory = await AsyncStorage.getItem(HISTORY_KEY);
          if (storedHistory) {
            setHistory(JSON.parse(storedHistory));
          }
        } catch (e) {
          console.error("Gagal memuat riwayat kontraksi:", e);
        }
      }
    };
    loadHistory();
  }, [catatanPartografId]);

  // ================== LOAD TOKEN ==================
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token) {
          Alert.alert("Akses Ditolak", "Token tidak ditemukan.");
          navigate(-1);
          return;
        }
        setUserToken(token);
      } catch (err) {
        console.error("Error fetching token:", err);
      }
    };
    loadToken();
  }, []);

  // ================== STATUSBAR ==================
  useEffect(() => {
    StatusBar.setTranslucent(false);
    StatusBar.setBackgroundColor("#673AB7");
    StatusBar.setBarStyle("light-content");

    return () => {
      StatusBar.setTranslucent(false);
    };
  }, []);

  // ================== STOPWATCH ==================
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prev) => prev + 1000);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  // ================== HANDLER ==================
  const startStopHandler = () => {
    if (isRunning) return stopKontraksi();

    setStartTime(new Date());
    setTime(0);
    setIsRunning(true);
  };

  const stopKontraksi = async () => {
    setIsRunning(false);
    const endTime = new Date();
    const durasiMs = endTime - startTime;

    if (durasiMs < 2000) {
      return Alert.alert("Gagal", "Durasi terlalu singkat.");
    }

    const kontraksiData = {
      waktu_mulai: startTime.toISOString(),
      waktu_selesai: endTime.toISOString(),
      durasi: formatTime(durasiMs)
    };

    await simpanKontraksi(kontraksiData);
  };

  // ================== API HANDLER (MODIFIED SAVE) ==================
  const simpanKontraksi = async (kontraksi) => {
    if (!catatanPartografId || !userToken) {
      return Alert.alert(
        "Error",
        "ID Catatan Partograf atau Token tidak ditemukan."
      );
    }

    setIsLoading(true);

    try {
      const res = await fetch(
        `https://restful-api-bmc-production.up.railway.app/api/catatan-partograf/${catatanPartografId}/kontraksi`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`
          },
          body: JSON.stringify({
            waktu_mulai: kontraksi.waktu_mulai,
            waktu_selesai: kontraksi.waktu_selesai
          })
        }
      );

      const text = await res.text();
      let json = {};

      if (!res.ok) {
        let errorMessage = `Gagal (${res.status})`;

        try {
          json = JSON.parse(text);
          errorMessage = json.message || JSON.stringify(json);
        } catch {
          errorMessage = `Error Server (${res.status}). Respons bukan JSON.`;
        }

        return Alert.alert("Gagal", errorMessage);
      }

      try {
        json = JSON.parse(text);
      } catch (e) {
        Alert.alert(
          "Fatal Error",
          "Server merespons OK tetapi data bukan JSON yang valid."
        );
        console.error("JSON Parse Error on Success:", text, e);
        return;
      }

      const savedData = {
        ...kontraksi,
        id: json.data?.id || Date.now(),
        durasi: json.data?.durasi || kontraksi.durasi
      };

      // 1. Perbarui state lokal
      setHistory((prev) => {
        const newHistory = [savedData, ...prev];
        // 2. Simpan seluruh riwayat ke AsyncStorage
        AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
        return newHistory;
      });

      Alert.alert("Berhasil", `Kontraksi dicatat (${savedData.durasi})`);
    } catch (err) {
      Alert.alert("Error", "Tidak dapat terhubung ke server.");
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // =======================================================
  //                                UI
  // =======================================================
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate(-1)}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Monitor Kontraksi</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Stopwatch Area */}
      <View style={styles.stopwatchArea}>
        {/* Waktu Durasi */}
        <Text style={styles.stopwatchLabel}>Durasi Kontraksi Saat Ini</Text>
        <Text style={styles.stopwatchTime}>{formatTime(time)}</Text>

        {/* Tombol Start/Stop Lingkaran */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            isRunning ? styles.stopButton : styles.startButton
          ]}
          onPress={startStopHandler}
          disabled={isLoading || !userToken}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" size="large" />
          ) : (
            <Ionicons
              name={isRunning ? "stop" : "play"}
              size={40}
              color="#FFF"
            />
          )}
        </TouchableOpacity>

        {/* Label Aksi Tombol */}
        <Text style={styles.actionLabel}>
          {isRunning ? "TAP UNTUK SIMPAN" : "MULAI KONTRAKSI"}
        </Text>

        {startTime && isRunning && (
          <Text style={styles.startTimeText}>
            Mulai: {startTime.toLocaleTimeString("id-ID")}
          </Text>
        )}
      </View>

      {/* History */}
      <Text style={styles.historyTitle}>
        Riwayat Kontraksi ({history.length})
      </Text>

      <ScrollView style={styles.historyContainer}>
        {history.length === 0 ? (
          <Text style={styles.emptyHistory}>Belum ada kontraksi dicatat.</Text>
        ) : (
          history.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View>
                <Text style={styles.historyDuration}>
                  Durasi: {item.durasi} Detik
                </Text>
                <Text style={styles.historyDetail}>
                  Mulai:{" "}
                  {new Date(item.waktu_mulai).toLocaleTimeString("id-ID")}
                </Text>
                <Text style={styles.historyDetail}>
                  Selesai:{" "}
                  {new Date(item.waktu_selesai).toLocaleTimeString("id-ID")}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

// =======================================================
//                             STYLES
// =======================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4f8" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#673AB7", // Ungu
    alignItems: "center",
    elevation: 4
  },

  headerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold"
  },

  stopwatchArea: {
    backgroundColor: "#FFF",
    padding: 30,
    margin: 20,
    borderRadius: 15,
    elevation: 6,
    alignItems: "center"
  },

  stopwatchLabel: {
    fontSize: 16,
    color: "#888",
    fontWeight: "500",
    marginBottom: 5
  },

  stopwatchTime: {
    fontSize: 70,
    color: "#333",
    marginBottom: 25,
    fontWeight: "200",
    fontVariant: ["tabular-nums"]
  },

  actionButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    marginBottom: 10
  },

  startButton: {
    backgroundColor: "#4CAF50" // Hijau
  },

  stopButton: {
    backgroundColor: "#D32F2F" // Merah
  },

  actionLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#333"
  },

  startTimeText: { marginTop: 10, color: "#777", fontSize: 13 },

  historyTitle: {
    marginLeft: 20,
    marginBottom: 10,
    color: "#333",
    fontWeight: "bold"
  },

  historyContainer: { paddingHorizontal: 20 },

  historyCard: {
    backgroundColor: "#FFF",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: "#4CAF50",
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 1
  },

  historyDuration: { fontSize: 16, fontWeight: "bold" },
  historyDetail: { fontSize: 12, color: "#888" },
  emptyHistory: { textAlign: "center", marginTop: 20, color: "#999" }
});

export default MonitorKontraksi;
