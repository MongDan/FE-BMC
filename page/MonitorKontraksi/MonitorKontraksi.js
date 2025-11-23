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
import { SafeAreaView } from "react-native-safe-area-context";

// ================= THEME CONFIGURATION =================
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

// ================= LOGIC HELPERS (TIDAK DIUBAH) =================
const toLocalISOString = (date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localTime = new Date(date.getTime() - tzOffset);
  return localTime.toISOString().slice(0, -1);
};

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

// ================= MAIN COMPONENT =================
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

  const stopKontraksi = async () => {
    setIsRunning(false);
    const start = startTimeRef.current || startTime;
    const now = new Date();

    const rawDiffMs = now - start;
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
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar backgroundColor={THEME.bg} barStyle="dark-content" />

      {/* === Header App Bar === */}
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
        {/* === KARTU SCANNER UTAMA === */}
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
                    style={{ marginLeft: isRunning ? 0 : 4 }} // Center visual adjustment
                  />
                )}
              </Animated.View>
              <Text style={styles.controlLabel}>
                {isRunning ? "HENTIKAN REKAM" : "MULAI KONTRAKSI"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Mode Offline */}
        {!catatanPartografId && (
          <View style={styles.infoBox}>
            <MaterialIcons name="info-outline" size={20} color="#EF6C00" />
            <Text style={styles.infoText}>
              Mode Bebas. Data tersimpan lokal di HP.
            </Text>
          </View>
        )}

        {/* === BAGIAN RIWAYAT (REDESIGNED UI) === */}
        <View style={styles.historySection}>
          <Text style={styles.sectionHeader}>RIWAYAT MONITORING</Text>

          {groupedHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="heart-pulse"
                size={48}
                color="#CFD8DC"
              />
              <Text style={styles.emptyText}>
                Belum ada data kontraksi terekam
              </Text>
            </View>
          ) : (
            groupedHistory.map((group, groupIndex) => (
              <View key={groupIndex} style={styles.timelineGroup}>
                {/* Header Group (10 Menit) */}
                <View style={styles.timelineHeader}>
                  <View style={styles.timeBadge}>
                    <MaterialIcons name="access-time" size={14} color="#FFF" />
                    <Text style={styles.timeBadgeText}>{group.title}</Text>
                  </View>
                  <View style={styles.freqContainer}>
                    <Text style={styles.freqLabel}>Frekuensi:</Text>
                    <Text style={styles.freqValue}>{group.count}x</Text>
                  </View>
                </View>

                {/* List Item Cards */}
                <View style={styles.cardList}>
                  {group.data.map((item, i) => (
                    <View key={i} style={styles.historyCard}>
                      {/* Left: Duration (Hero Info) */}
                      <View style={styles.cardLeft}>
                        <Text style={styles.durationLabel}>Durasi</Text>
                        <Text style={styles.durationValue}>{item.durasi}</Text>
                        <Text style={styles.durationUnit}>menit : detik</Text>
                      </View>

                      {/* Divider Vertical */}
                      <View style={styles.cardDivider} />

                      {/* Middle: Time Details */}
                      <View style={styles.cardMiddle}>
                        <View style={styles.timeRow}>
                          <MaterialCommunityIcons
                            name="clock-start"
                            size={14}
                            color={THEME.textSec}
                          />
                          <Text style={styles.timeText}>
                            Mulai:{" "}
                            {new Date(item.waktu_mulai).toLocaleTimeString(
                              "id-ID",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </Text>
                        </View>
                        <View style={[styles.timeRow, { marginTop: 6 }]}>
                          <MaterialCommunityIcons
                            name="clock-end"
                            size={14}
                            color={THEME.textSec}
                          />
                          <Text style={styles.timeText}>
                            Selesai:{" "}
                            {item.waktu_selesai
                              ? new Date(item.waktu_selesai).toLocaleTimeString(
                                  "id-ID",
                                  { hour: "2-digit", minute: "2-digit" }
                                )
                              : "-"}
                          </Text>
                        </View>
                      </View>

                      {/* Right: Status Icon */}
                      <View style={styles.cardRight}>
                        {item.isDraft ? (
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: "#FFF3E0" },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="cloud-upload"
                              size={18}
                              color="orange"
                            />
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: "#E8F5E9" },
                            ]}
                          >
                            <Ionicons
                              name="checkmark"
                              size={18}
                              color={THEME.success}
                            />
                          </View>
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
    </SafeAreaView>
  );
};

// ================= STYLES (UPDATED UI) =================
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: THEME.bg },

  // --- Header ---
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

  // --- Main Card & Scanner ---
  medicalCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
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
    fontWeight: "800",
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
    marginBottom: 30,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
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

  // --- Controls ---
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
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
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

  // --- Info Box ---
  infoBox: {
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    marginLeft: 8,
    color: "#EF6C00",
    fontSize: 12,
    flex: 1,
    fontWeight: "500",
  },

  // === NEW HISTORY UI STYLES ===
  historySection: {
    marginTop: 10,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "800",
    color: THEME.textMain,
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECEFF1",
    borderStyle: "dashed",
  },
  emptyText: {
    marginTop: 10,
    color: "#B0BEC5",
    fontSize: 14,
  },

  // Timeline Groups
  timelineGroup: {
    marginBottom: 24,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 2,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  timeBadgeText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 6,
  },
  freqContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  freqLabel: {
    fontSize: 12,
    color: THEME.textSec,
    marginRight: 4,
  },
  freqValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: THEME.textMain,
  },

  // Card List
  cardList: {
    // Gap handled via margin in card for compatibility
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    // Modern Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F5F5F5",
  },

  // Card Internal Layout
  cardLeft: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70,
  },
  durationLabel: {
    fontSize: 10,
    color: THEME.textSec,
    marginBottom: 2,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  durationValue: {
    fontSize: 22,
    fontWeight: "800",
    color: THEME.primary,
  },
  durationUnit: {
    fontSize: 10,
    color: "#B0BEC5",
    marginTop: -2,
  },

  cardDivider: {
    width: 1,
    height: "70%",
    backgroundColor: "#ECEFF1",
    marginHorizontal: 16,
  },

  cardMiddle: {
    flex: 1,
    justifyContent: "center",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 12,
    color: THEME.textMain,
    marginLeft: 8,
    fontWeight: "600",
  },

  cardRight: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MonitorKontraksi;
