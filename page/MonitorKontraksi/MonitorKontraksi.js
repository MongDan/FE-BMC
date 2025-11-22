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
  Platform,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  MaterialIcons,
} from "@expo/vector-icons";
import { useNavigate, useParams } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME = {
  bg: "#F4F6F8",
  card: "#FFFFFF",
  primary: "#0277BD",
  accent: "#C2185B",
  success: "#2E7D32",
  textMain: "#263238",
  textSec: "#78909C",
  border: "#CFD8DC",
  ringActive: "#00E5FF",
  ringIdle: "#B0BEC5",
  stopwatchBg: "#263238",
  groupHeaderBg: "#E3F2FD",
  groupHeaderText: "#1565C0",
};

const toLocalISOString = (date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localTime = new Date(date.getTime() - tzOffset);
  return localTime.toISOString().slice(0, -1);
};

// FIX: Menggunakan Math.round agar tampilan membulatkan ke detik terdekat
const formatTime = (ms) => {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

const groupHistoryBy10Minutes = (data) => {
  if (!data || data.length === 0) return [];
  const sortedData = [...data].sort(
    (a, b) => new Date(b.waktu_mulai) - new Date(a.waktu_mulai)
  );
  const groups = {};
  sortedData.forEach((item) => {
    const date = new Date(item.waktu_mulai);
    const roundedMinutes = Math.floor(date.getMinutes() / 10) * 10;
    date.setMinutes(roundedMinutes);
    date.setSeconds(0);
    date.setMilliseconds(0);

    const startTimeStr = date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endDate = new Date(date);
    endDate.setMinutes(roundedMinutes + 10);
    const endTimeStr = endDate.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const groupKey = `${startTimeStr} - ${endTimeStr}`;
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(item);
  });

  return Object.keys(groups).map((key) => ({
    title: key,
    data: groups[key],
    count: groups[key].length,
  }));
};

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
  const startTimeRef = useRef(null);

  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;

  const HISTORY_KEY = catatanPartografId
    ? `kontraksi_history_${catatanPartografId}`
    : `kontraksi_draft_${partografId}`;

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const storedHistory = await AsyncStorage.getItem(HISTORY_KEY);
        if (storedHistory) setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error(e);
      }
    };
    loadHistory();
  }, [catatanPartografId, partografId]);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (!token && catatanPartografId) {
          Alert.alert("Info", "Mode Offline / Token tidak ditemukan");
        }
        setUserToken(token);
      } catch (err) {
        console.error(err);
      }
    };
    loadToken();
  }, []);

  useEffect(() => {
    let spinAnim, pulseAnim;
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const now = new Date();
          const diff = now - startTimeRef.current;
          setTime(diff);
        }
      }, 200);

      spinAnim = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinAnim.start();
      pulseAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
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

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const startStopHandler = () => {
    if (isRunning) return stopKontraksi();
    const now = new Date();
    setStartTime(now);
    startTimeRef.current = now;
    setTime(0);
    setIsRunning(true);
  };

  // === LOGIKA STOP FIX ===
  const stopKontraksi = async () => {
    setIsRunning(false);
    const start = startTimeRef.current || startTime;
    const now = new Date();

    const rawDiffMs = now - start;
    // FIX: Gunakan Math.round agar sinkron dengan tampilan
    const secondsRounded = Math.round(rawDiffMs / 1000);
    const fixedDurationMs = secondsRounded * 1000;
    const fixedEndTime = new Date(start.getTime() + fixedDurationMs);

    setTime(fixedDurationMs);

    if (fixedDurationMs < 2000)
      return Alert.alert("Gagal", "Durasi terlalu singkat.");

    const kontraksiData = {
      waktu_mulai: toLocalISOString(start),
      waktu_selesai: toLocalISOString(fixedEndTime),
      durasi: formatTime(fixedDurationMs),
    };
    await simpanKontraksi(kontraksiData);
  };

  const simpanKontraksi = async (kontraksi) => {
    if (!catatanPartografId) {
      try {
        const draftItem = {
          ...kontraksi,
          id: `draft-${Date.now()}`,
          isDraft: true,
        };
        const newHistory = [draftItem, ...history];
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
        setHistory(newHistory);
        Alert.alert("Disimpan (Offline)", "Data disimpan di HP.");
      } catch (e) {
        Alert.alert("Error", "Gagal simpan draft.");
      }
      return;
    }

    if (!userToken) return Alert.alert("Error", "Token hilang.");
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://restful-api-bmc-production.up.railway.app/api/catatan-partograf/${catatanPartografId}/kontraksi`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            waktu_mulai: kontraksi.waktu_mulai,
            waktu_selesai: kontraksi.waktu_selesai,
          }),
        }
      );
      const text = await res.text();
      let json = {};
      try {
        json = JSON.parse(text);
      } catch {}

      if (!res.ok) return Alert.alert("Gagal", json.message || "Error");

      const savedData = {
        ...kontraksi,
        id: json.data?.id || Date.now(),
        durasi: json.data?.durasi || kontraksi.durasi,
        isDraft: false,
      };

      const newHistory = [savedData, ...history];
      setHistory(newHistory);
      AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      Alert.alert("Tersimpan", `Durasi: ${savedData.durasi}`);
    } catch (err) {
      Alert.alert("Error", "Koneksi gagal.");
    } finally {
      setIsLoading(false);
    }
  };

  const groupedHistory = groupHistoryBy10Minutes(history);

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor={THEME.bg} barStyle="dark-content" />
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigate(-1)} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={THEME.textMain} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>
          {catatanPartografId ? "Monitor (Tersambung)" : "Monitor (Mode Bebas)"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.medicalCard}>
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
          <View style={styles.scannerContainer}>
            <View style={styles.ringBackground}>
              <Animated.View
                style={[
                  styles.rotatingRing,
                  { transform: [{ rotate: spin }] },
                  {
                    borderColor: isRunning ? THEME.ringActive : THEME.ringIdle,
                  },
                ]}
              >
                <View
                  style={[
                    styles.ringKnob,
                    {
                      backgroundColor: isRunning
                        ? THEME.ringActive
                        : "transparent",
                    },
                  ]}
                />
              </Animated.View>
              <View style={styles.innerDisplay}>
                <Text style={styles.timerLabel}>DURATION</Text>
                <Text style={styles.timerDigits}>{formatTime(time)}</Text>
                <Text style={styles.timerUnit}>MM : SS</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={startStopHandler}
              disabled={isLoading}
              activeOpacity={0.8}
              style={styles.controlBtnWrapper}
            >
              <Animated.View
                style={[
                  styles.pulseButton,
                  {
                    backgroundColor: isRunning ? "#D32F2F" : THEME.primary,
                    transform: [{ scale: pulseValue }],
                  },
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

        {!catatanPartografId && (
          <View
            style={{
              backgroundColor: "#FFF3E0",
              padding: 12,
              borderRadius: 8,
              marginBottom: 15,
              flexDirection: "row",
            }}
          >
            <MaterialIcons name="info-outline" size={20} color="#EF6C00" />
            <Text
              style={{ marginLeft: 8, color: "#EF6C00", fontSize: 12, flex: 1 }}
            >
              Mode Bebas. Data tersimpan lokal di HP.
            </Text>
          </View>
        )}

        <View style={styles.historySection}>
          <Text style={styles.sectionHeader}>RIWAYAT PER 10 MENIT</Text>
          {groupedHistory.length === 0 ? (
            <Text style={styles.emptyText}>Belum ada data kontraksi</Text>
          ) : (
            groupedHistory.map((group, groupIndex) => (
              <View key={groupIndex} style={styles.groupContainer}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupTitle}>{group.title}</Text>
                  <View style={styles.freqBadge}>
                    <Text style={styles.freqText}>
                      Frekuensi: {group.count}x
                    </Text>
                  </View>
                </View>
                <View style={styles.tableContainer}>
                  <View style={styles.tableHeader}>
                    <Text style={styles.th}>MULAI</Text>
                    <Text style={styles.th}>DURASI</Text>
                    <Text style={styles.thRight}>STS</Text>
                  </View>
                  {group.data.map((item, i) => (
                    <View
                      key={i}
                      style={[styles.tr, i % 2 === 0 && styles.trEven]}
                    >
                      <Text style={styles.td}>
                        {new Date(item.waktu_mulai).toLocaleTimeString(
                          "id-ID",
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </Text>
                      <Text
                        style={[
                          styles.td,
                          { fontWeight: "bold", color: THEME.textMain },
                        ]}
                      >
                        {item.durasi}
                      </Text>
                      <View style={styles.tdRight}>
                        {item.isDraft ? (
                          <MaterialCommunityIcons
                            name="cloud-upload"
                            size={16}
                            color="orange"
                          />
                        ) : (
                          <Ionicons
                            name="checkmark-circle"
                            size={16}
                            color={THEME.success}
                          />
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: THEME.bg },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  appBarTitle: { fontSize: 16, fontWeight: "700", color: THEME.textMain },
  backBtn: { padding: 4 },
  medicalCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: THEME.border,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    paddingBottom: 12,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.textMain,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
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
    elevation: 5,
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
    alignItems: "center",
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
    elevation: 5,
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
    elevation: 8,
  },
  timerLabel: {
    color: "#90A4AE",
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 8,
  },
  timerDigits: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FFF",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 2,
  },
  timerUnit: {
    color: THEME.primary,
    fontSize: 10,
    marginTop: 8,
    fontWeight: "bold",
  },
  controlBtnWrapper: { alignItems: "center", marginTop: -25 },
  pulseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFF",
    elevation: 6,
  },
  controlLabel: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: "bold",
    color: THEME.textSec,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  recBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D32F2F",
    marginRight: 6,
  },
  recText: { fontSize: 10, fontWeight: "bold", color: "#D32F2F" },
  historySection: { marginTop: 10 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.textSec,
    marginBottom: 10,
    marginLeft: 4,
  },
  groupContainer: { marginBottom: 20 },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: THEME.groupHeaderBg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: THEME.groupHeaderText,
  },
  freqBadge: {
    backgroundColor: "#FFF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  freqText: { fontSize: 12, fontWeight: "bold", color: THEME.groupHeaderText },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#EEE",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: "hidden",
    backgroundColor: "#FFF",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F1F3F4",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  th: { flex: 1, fontSize: 11, fontWeight: "bold", color: "#607D8B" },
  thRight: {
    width: 40,
    fontSize: 11,
    fontWeight: "bold",
    color: "#607D8B",
    textAlign: "center",
  },
  tr: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FAFAFA",
  },
  trEven: { backgroundColor: "#FAFAFA" },
  td: { flex: 1, fontSize: 13, color: THEME.textSec },
  tdRight: { width: 40, alignItems: "center" },
  emptyText: {
    textAlign: "center",
    padding: 20,
    color: "#B0BEC5",
    fontSize: 12,
    fontStyle: "italic",
  },
});

export default MonitorKontraksi;
