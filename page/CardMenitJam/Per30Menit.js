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
import { useNavigate, useParams } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// util format waktu
const formatTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export default function Per30Menit() {
  const navigate = useNavigate();
  const { id } = useParams(); // partograf id (atau patient id)

  // data fetch
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({}); // raw response fields: djj, nadi_ibu, ...

  // stopwatch states
  const [isRunning, setIsRunning] = useState(false);
  const [timeMs, setTimeMs] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const intervalRef = useRef(null);

  // values loaded from AsyncStorage
  const [catatanPartografId, setCatatanPartografId] = useState(null);
  const [userToken, setUserToken] = useState(null);

  const HISTORY_KEY = (cId) => `kontraksi_history_${cId}`;
  const CATATAN_KEY = `catatanId_${id}`;

  // load token + catatanPartografId + history
  useEffect(() => {
    const load = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        setUserToken(token);

        const savedCatatanId = await AsyncStorage.getItem(CATATAN_KEY);
        if (savedCatatanId) {
          setCatatanPartografId(savedCatatanId);
          const storedHistory = await AsyncStorage.getItem(HISTORY_KEY(savedCatatanId));
          if (storedHistory) setHistory(JSON.parse(storedHistory));
        }
      } catch (e) {
        console.error("Load AsyncStorage error", e);
      }
    };
    load();
  }, []);

  // fetch data (djj, nadi, pembukaan, dll)
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`https://restful-api-bmc-production.up.railway.app/api/partograf/${id}/catatan`)
      .then((res) => res.json())
      .then((json) => {
        if (!mounted) return;
        const payload = json.data || json; // backend bisa bungkus di data
        setData(payload || {});
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        Alert.alert("Error", "Gagal mengambil data dari server.");
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [id]);

  // stopwatch interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setTimeMs(prev => prev + 1000), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const startStopHandler = () => {
    if (isRunning) return stopKontraksi();
    setStartTime(new Date());
    setTimeMs(0);
    setIsRunning(true);
  };

  const stopKontraksi = async () => {
    setIsRunning(false);
    const endTime = new Date();
    const durasiMs = endTime - startTime;

    if (durasiMs < 1000) {
      return Alert.alert("Gagal", "Durasi terlalu singkat.");
    }

    const kontraksiData = {
      waktu_mulai: startTime.toISOString(),
      waktu_selesai: endTime.toISOString(),
      durasi: formatTime(durasiMs)
    };

    await simpanKontraksi(kontraksiData);
  };

  const simpanKontraksi = async (kontraksi) => {
    if (!catatanPartografId) {
      Alert.alert("Error", "Catatan Partograf belum tersedia. Isi data partograf terlebih dahulu.");
      return;
    }
    if (!userToken) {
      Alert.alert("Error", "Token pengguna tidak ditemukan. Silakan login ulang.");
      return;
    }

    setIsSaving(true);

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
        try { json = JSON.parse(text); } catch {}
        const errMsg = json.message || `Gagal (${res.status})`;
        Alert.alert("Gagal", errMsg);
        return;
      }

      try { json = JSON.parse(text); } catch (e) {
        console.warn("Response not JSON on success:", text);
      }

      const saved = {
        id: json.data?.id || Date.now(),
        ...kontraksi,
        durasi: json.data?.durasi || kontraksi.durasi
      };

      // update history local + AsyncStorage
      setHistory(prev => {
        const newHist = [saved, ...prev];
        AsyncStorage.setItem(HISTORY_KEY(catatanPartografId), JSON.stringify(newHist));
        return newHist;
      });

      Alert.alert("Berhasil", `Kontraksi dicatat (${saved.durasi})`);
    } catch (err) {
      console.error("Save kontraksi error:", err);
      Alert.alert("Error", "Tidak dapat terhubung ke server.");
    } finally {
      setIsSaving(false);
    }
  };

  // Render kecil untuk DJJ & Nadi
  const renderVitals = () => {
    const djj = data.djj ?? data.denyut_jantung_janin ?? "-";
    const nadi = data.nadi_ibu ?? data.nadi ?? "-";
    return (
      <View style={styles.vitalsWrap}>
        <View style={styles.vitalCard}>
          <Text style={styles.vitalLabel}>DJJ</Text>
          <Text style={styles.vitalValue}>{djj}</Text>
        </View>
        <View style={styles.vitalCard}>
          <Text style={styles.vitalLabel}>Nadi</Text>
          <Text style={styles.vitalValue}>{nadi}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate(-1)}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Per 30 Menit</Text>
        <View style={{ width: 24 }} />
      </View>

      <StatusBar backgroundColor="#673AB7" barStyle="light-content" />

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Vitals */}
          {renderVitals()}

          {/* Stopwatch */}
          <View style={styles.stopwatchArea}>
            <Text style={styles.stopwatchLabel}>Durasi Kontraksi Saat Ini</Text>
            <Text style={styles.stopwatchTime}>{formatTime(timeMs)}</Text>

            <TouchableOpacity
              style={[styles.actionButton, isRunning ? styles.stopButton : styles.startButton]}
              onPress={startStopHandler}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Ionicons name={isRunning ? "stop" : "play"} size={36} color="#FFF" />
              )}
            </TouchableOpacity>

            <Text style={styles.actionLabel}>
              {isRunning ? "TAP UNTUK SIMPAN" : "MULAI KONTRAKSI"}
            </Text>
          </View>

          {/* Riwayat */}
          <Text style={styles.historyTitle}>Riwayat Kontraksi ({history.length})</Text>
          {history.length === 0 ? (
            <Text style={styles.emptyHistory}>Belum ada kontraksi dicatat.</Text>
          ) : (
            history.map(h => (
              <View key={h.id} style={styles.historyCard}>
                <View>
                  <Text style={styles.historyDuration}>Durasi: {h.durasi}</Text>
                  <Text style={styles.historyDetail}>Mulai: {new Date(h.waktu_mulai).toLocaleTimeString()}</Text>
                  <Text style={styles.historyDetail}>Selesai: {new Date(h.waktu_selesai).toLocaleTimeString()}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4f8" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#673AB7",
    alignItems: "center"
  },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "bold" },

  vitalsWrap: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  vitalCard: { flex: 1, backgroundColor: "#fff", padding: 16, borderRadius: 12, marginRight: 10, elevation: 2 },
  vitalLabel: { color: "#666", marginBottom: 6 },
  vitalValue: { fontSize: 22, fontWeight: "700" },

  stopwatchArea: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
    elevation: 4,
    marginBottom: 16
  },
  stopwatchLabel: { color: "#666", marginBottom: 6 },
  stopwatchTime: { fontSize: 48, fontWeight: "300", marginBottom: 12 },

  actionButton: { width: 88, height: 88, borderRadius: 44, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  startButton: { backgroundColor: "#4CAF50" },
  stopButton: { backgroundColor: "#D32F2F" },

  actionLabel: { fontWeight: "600", color: "#333" },

  historyTitle: { fontWeight: "bold", marginTop: 8, marginBottom: 8, marginLeft: 2 },
  emptyHistory: { textAlign: "center", color: "#999", marginTop: 10 },
  historyCard: { backgroundColor: "#FFF", padding: 12, marginBottom: 8, borderRadius: 10, elevation: 2, flexDirection: "row", justifyContent: "space-between" },
  historyDuration: { fontWeight: "700" },
  historyDetail: { color: "#666", fontSize: 12 }
});
