import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Animated,
  Easing,
  Platform
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  MaterialIcons
} from "@expo/vector-icons";
import { useNavigate, useLocation } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useParams } from "react-router";

// ======================= MEDICAL THEME ==========================
const THEME = {
  bg: "#F4F6F8", // Abu-abu klinis
  card: "#FFFFFF", // Putih bersih
  primary: "#0277BD", // Medical Blue
  accent: "#C2185B", // Pink/Red
  success: "#2E7D32", // Hijau
  textMain: "#263238",
  textSec: "#78909C",
  border: "#CFD8DC",

  // Warna Khusus Stopwatch
  ringActive: "#00E5FF", // Cyan terang
  ringIdle: "#B0BEC5", // Abu-abu diam
  stopwatchBg: "#263238" // Layar gelap
};

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
  const { catatanPartografId, partografId } = useParams();

  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userToken, setUserToken] = useState(null);

  const intervalRef = useRef(null);

  // ANIMATION REFS
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  const HISTORY_KEY = `kontraksi_history_${catatanPartografId}`;

  // ================== LOAD HISTORY ==================
  useEffect(() => {
    const loadHistory = async () => {
      if (catatanPartografId) {
        try {
          const storedHistory = await AsyncStorage.getItem(HISTORY_KEY);
          if (storedHistory) {
            setHistory(JSON.parse(storedHistory));
          }
        } catch (e) {
          console.error("Gagal memuat riwayat:", e);
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

  // ================== ANIMATION LOOP ==================
  useEffect(() => {
    let spinAnim;
    let pulseAnim;

    if (isRunning) {
      // 1. Timer Interval
      intervalRef.current = setInterval(() => {
        setTime((prev) => prev + 1000);
      }, 1000);

      // 2. Cincin Berputar
      spinAnim = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true
        })
      );
      spinAnim.start();

      // 3. Denyut Tombol
      pulseAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
          })
        ])
      );
      pulseAnim.start();
    } else {
      clearInterval(intervalRef.current);
      spinValue.setValue(0);
      pulseValue.setValue(1);
    }

    return () => {
      clearInterval(intervalRef.current);
      if (spinAnim) spinAnim.stop();
      if (pulseAnim) pulseAnim.stop();
    };
  }, [isRunning]);

  // Interpolasi Putaran
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"]
  });

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

  // ================== API HANDLER ==================
  const simpanKontraksi = async (kontraksi) => {
    if (!catatanPartografId || !userToken) {
      return Alert.alert("Error", "ID Catatan Partograf / Token hilang.");
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
        try {
          json = JSON.parse(text);
        } catch {}
        return Alert.alert("Gagal", json.message || `Error ${res.status}`);
      }

      try {
        json = JSON.parse(text);
      } catch {}

      const savedData = {
        ...kontraksi,
        id: json.data?.id || Date.now(),
        durasi: json.data?.durasi || kontraksi.durasi
      };

      setHistory((prev) => {
        const newHistory = [savedData, ...prev];
        AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
        return newHistory;
      });

      Alert.alert("Tersimpan", `Kontraksi dicatat (${savedData.durasi})`);
    } catch (err) {
      Alert.alert("Error", "Koneksi gagal.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // =======================================================
  //                            UI
  // =======================================================
  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor={THEME.bg} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={() => navigate(`/home-catatan/${partografId}`)}
          style={styles.backBtn}
        >
          <MaterialIcons name="arrow-back" size={24} color={THEME.textMain} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Monitor Kontraksi</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* === MEDICAL SCANNER UI === */}
        <View style={styles.medicalCard}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialCommunityIcons
                name="radar"
                size={20}
                color={THEME.primary}
              />
              <Text style={styles.cardTitle}>SCANNER KONTRAKSI</Text>
            </View>
            {isRunning && (
              <View style={styles.recBadge}>
                <View style={styles.recDot} />
                <Text style={styles.recText}>REC</Text>
              </View>
            )}
          </View>

          {/* Scanner Area */}
          <View style={styles.scannerContainer}>
            {/* 1. Ring Background */}
            <View style={styles.ringBackground}>
              {/* 2. Animated Ring */}
              <Animated.View
                style={[
                  styles.rotatingRing,
                  { transform: [{ rotate: spin }] },
                  { borderColor: isRunning ? THEME.ringActive : THEME.ringIdle }
                ]}
              >
                <View
                  style={[
                    styles.ringKnob,
                    {
                      backgroundColor: isRunning
                        ? THEME.ringActive
                        : "transparent"
                    }
                  ]}
                />
              </Animated.View>

              {/* 3. Inner Display */}
              <View style={styles.innerDisplay}>
                <Text style={styles.timerLabel}>DURATION</Text>
                <Text style={styles.timerDigits}>{formatTime(time)}</Text>
                <Text style={styles.timerUnit}>MM : SS</Text>
              </View>
            </View>

            {/* 4. Floating Control Button */}
            <TouchableOpacity
              onPress={startStopHandler}
              disabled={isLoading || !userToken}
              activeOpacity={0.8}
              style={styles.controlBtnWrapper}
            >
              <Animated.View
                style={[
                  styles.pulseButton,
                  {
                    backgroundColor: isRunning ? "#D32F2F" : THEME.primary,
                    transform: [{ scale: pulseValue }]
                  }
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" size="large" />
                ) : (
                  <FontAwesome5
                    name={isRunning ? "stop" : "play"}
                    size={24}
                    color="#FFF"
                  />
                )}
              </Animated.View>
              <Text style={styles.controlLabel}>
                {isRunning ? "HENTIKAN REKAM" : "MULAI KONTRAKSI"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* === HISTORY TABLE === */}
        <View style={styles.historySection}>
          <Text style={styles.sectionHeader}>RIWAYAT ({history.length})</Text>

          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={styles.th}>MULAI</Text>
              <Text style={styles.th}>SELESAI</Text>
              <Text style={styles.th}>DURASI</Text>
              <Text style={styles.thRight}>STS</Text>
            </View>

            {history.length === 0 ? (
              <Text style={styles.emptyText}>Belum ada data kontraksi</Text>
            ) : (
              history.map((item, i) => (
                <View
                  key={item.id}
                  style={[styles.tr, i % 2 === 0 && styles.trEven]}
                >
                  <Text style={styles.td}>
                    {new Date(item.waktu_mulai).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </Text>
                  <Text style={styles.td}>
                    {item.waktu_selesai
                      ? new Date(item.waktu_selesai).toLocaleTimeString(
                          "id-ID",
                          { hour: "2-digit", minute: "2-digit" }
                        )
                      : "-"}
                  </Text>
                  <Text
                    style={[
                      styles.td,
                      { fontWeight: "bold", color: THEME.textMain }
                    ]}
                  >
                    {item.durasi}
                  </Text>
                  <View style={styles.tdRight}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={THEME.success}
                    />
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// ======================= STYLES (CLINICAL PRO) ==========================
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: THEME.bg },

  // APP BAR
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0"
  },
  appBarTitle: { fontSize: 16, fontWeight: "700", color: THEME.textMain },
  backBtn: { padding: 4 },

  // MEDICAL CARD
  medicalCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: THEME.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    elevation: 2
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    paddingBottom: 12
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.textMain,
    marginLeft: 8,
    letterSpacing: 0.5
  },

  // SCANNER UI
  scannerContainer: { alignItems: "center", marginTop: 10, marginBottom: 10 },

  ringBackground: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#ECEFF1",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CFD8DC",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    elevation: 5
  },
  rotatingRing: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 4,
    borderStyle: "dashed",
    borderColor: THEME.ringIdle,
    justifyContent: "center",
    alignItems: "center"
  },
  ringKnob: {
    position: "absolute",
    top: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: THEME.ringActive,
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5
  },
  innerDisplay: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: THEME.stopwatchBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    elevation: 8
  },
  timerLabel: {
    color: "#90A4AE",
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 8
  },
  timerDigits: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFF",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 2
  },
  timerUnit: {
    color: THEME.primary,
    fontSize: 10,
    marginTop: 8,
    fontWeight: "bold"
  },

  // BUTTON
  controlBtnWrapper: { alignItems: "center", marginTop: -25 },
  pulseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    elevation: 6
  },
  controlLabel: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: "bold",
    color: THEME.textSec,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },

  // REC BADGE
  recBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D32F2F",
    marginRight: 6
  },
  recText: { fontSize: 10, fontWeight: "bold", color: "#D32F2F" },

  // HISTORY SECTION
  historySection: { marginTop: 10 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.textSec,
    marginBottom: 10,
    marginLeft: 4
  },

  // TABLE
  tableContainer: {
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#FFF"
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F1F3F4",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0"
  },
  th: { flex: 1, fontSize: 11, fontWeight: "bold", color: "#607D8B" },
  thRight: {
    width: 40,
    fontSize: 11,
    fontWeight: "bold",
    color: "#607D8B",
    textAlign: "center"
  },
  tr: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FAFAFA"
  },
  trEven: { backgroundColor: "#FAFAFA" },
  td: { flex: 1, fontSize: 13, color: THEME.textSec },
  tdRight: { width: 40, alignItems: "center" },
  emptyText: {
    textAlign: "center",
    padding: 20,
    color: "#B0BEC5",
    fontSize: 12,
    fontStyle: "italic"
  }
});

export default MonitorKontraksi;
