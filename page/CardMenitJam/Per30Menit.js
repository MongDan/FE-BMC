import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  StatusBar,
  Platform,
  Animated,
  Easing
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useParams, useLocation, useNavigate } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePickerModal from "react-native-modal-datetime-picker";

// ======================= MEDICAL THEME ==========================
const THEME = {
  bg: "#F4F6F8",
  card: "#FFFFFF",
  primary: "#0277BD",
  accent: "#C2185B",
  success: "#2E7D32",
  textMain: "#263238",
  textSec: "#78909C",
  border: "#CFD8DC",
  inputBg: "#FAFAFA",
  ringActive: "#00E5FF",
  ringIdle: "#B0BEC5",
  stopwatchBg: "#263238",
};

const formatTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

// ===================== Inline Stopwatch =====================
function InlineKontraksi({ catatanPartografId, userToken, onSaved }) {
  const [isRunning, setIsRunning] = useState(false);
  const [timeMs, setTimeMs] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef(null);
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const HISTORY_KEY = `kontraksi_history_${catatanPartografId}`;

  useEffect(() => {
    const load = async () => {
      if (!catatanPartografId) return;
      try {
        const st = await AsyncStorage.getItem(HISTORY_KEY);
        if (st) setHistory(JSON.parse(st));
      } catch (e) {}
    };
    load();
  }, [catatanPartografId]);

  useEffect(() => {
    let spinAnim, pulseAnim;
    if (isRunning) {
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
          Animated.timing(pulseValue, { toValue: 1.1, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseValue, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      pulseAnim.start();

      intervalRef.current = setInterval(() => setTimeMs((p) => p + 1000), 1000);
    } else {
      spinValue.setValue(0);
      pulseValue.setValue(1);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (spinAnim) spinAnim.stop();
      if (pulseAnim) pulseAnim.stop();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

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
    if (durasiMs < 2000) return Alert.alert("Invalid", "Durasi terlalu singkat.");
    const kontraksiData = {
      waktu_mulai: startTime.toISOString(),
      waktu_selesai: endTime.toISOString(),
      durasi: formatTime(durasiMs),
    };
    await simpanKontraksi(kontraksiData);
  };

  const simpanKontraksi = async (kontraksi) => {
    if (!catatanPartografId || !userToken) return Alert.alert("Error", "Token/ID Missing");
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://restful-api-bmc-production.up.railway.app/api/catatan-partograf/${catatanPartografId}/kontraksi`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${userToken}` },
          body: JSON.stringify({ waktu_mulai: kontraksi.waktu_mulai, waktu_selesai: kontraksi.waktu_selesai }),
        }
      );
      const text = await res.text();
      let json = {};
      try { json = JSON.parse(text); } catch {}
      if (!res.ok) return Alert.alert("Gagal", json.message || "Gagal menyimpan");
      const saved = { id: json.data?.id || Date.now(), ...kontraksi, durasi: json.data?.durasi || kontraksi.durasi };
      setHistory((prev) => {
        const newHist = [saved, ...prev];
        AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHist));
        return newHist;
      });
      Alert.alert("Tersimpan", `Kontraksi: ${saved.durasi}`);
      if (onSaved) onSaved(saved);
    } catch (err) { Alert.alert("Error", "Koneksi Error"); } 
    finally { setIsLoading(false); }
  };

  return (
    <View style={styles.medicalCard}>
      <View style={styles.cardHeader}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <MaterialCommunityIcons name="radar" size={20} color={THEME.primary} />
          <Text style={styles.cardTitle}>MONITOR KONTRAKSI</Text>
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
          <Animated.View style={[styles.rotatingRing, { transform: [{ rotate: spin }], borderColor: isRunning ? THEME.ringActive : THEME.ringIdle }]}>
            <View style={[styles.ringKnob, { backgroundColor: isRunning ? THEME.ringActive : "transparent" }]} />
          </Animated.View>
          <View style={styles.innerDisplay}>
            <Text style={styles.timerLabel}>DURATION</Text>
            <Text style={styles.timerDigits}>{formatTime(timeMs)}</Text>
            <Text style={styles.timerUnit}>MM : SS</Text>
          </View>
        </View>
        <TouchableOpacity onPress={startStopHandler} disabled={isLoading} activeOpacity={0.8} style={styles.controlBtnWrapper}>
          <Animated.View style={[styles.pulseButton, { backgroundColor: isRunning ? "#D32F2F" : THEME.primary, transform: [{ scale: pulseValue }] }]}>
            {isLoading ? <ActivityIndicator color="#FFF" size="large" /> : <FontAwesome5 name={isRunning ? "stop" : "play"} size={24} color="#FFF" />}
          </Animated.View>
          <Text style={styles.controlLabel}>{isRunning ? "HENTIKAN REKAM" : "MULAI KONTRAKSI"}</Text>
        </TouchableOpacity>
      </View>
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
          history.map((h, i) => (
            <View key={h.id} style={[styles.tr, i % 2 === 0 && styles.trEven]}>
              <Text style={styles.td}>{new Date(h.waktu_mulai).toLocaleTimeString("id-ID", {hour: '2-digit', minute:'2-digit'})}</Text>
              <Text style={styles.td}>{h.waktu_selesai ? new Date(h.waktu_selesai).toLocaleTimeString("id-ID", {hour: '2-digit', minute:'2-digit'}) : "-"}</Text>
              <Text style={[styles.td, {fontWeight: 'bold', color: THEME.textMain}]}>{h.durasi}</Text>
              <View style={styles.tdRight}><Ionicons name="checkmark-circle" size={16} color={THEME.success} /></View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

// ===================== MAIN PAGE =====================
export default function Per30Menit() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [catatanPartografId, setCatatanPartografId] = useState(location.state?.catatanPartografId || null);
  const [loading, setLoading] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [djj, setDjj] = useState("");
  const [nadi, setNadi] = useState("");
  const [waktuCatat, setWaktuCatat] = useState(new Date());
  const [isPickerVisible, setPickerVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem("userToken");
      setUserToken(token);
      if (!catatanPartografId) {
        const saved = await AsyncStorage.getItem(`catatanId_${id}`);
        if (saved) setCatatanPartografId(saved);
      }
    };
    init();
  }, [id]);

  const submitVitals = async () => {
    if (!djj || !nadi) return Alert.alert("Form Kosong", "Isi DJJ, Nadi & Waktu Catat.");
    setLoading(true);
    try {
      const res = await fetch(`https://restful-api-bmc-production.up.railway.app/api/partograf/${id}/catatan`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${userToken}` },
          body: JSON.stringify({ partograf_id: id, djj, nadi_ibu: nadi, waktu_catat: waktuCatat.toISOString() })
      });
      const json = await res.json();
      if (res.ok) {
        if (json.data?.id) {
          await AsyncStorage.setItem(`catatanId_${id}`, json.data.id);
          setCatatanPartografId(json.data.id);
        }
        Alert.alert("Tersimpan", "Data Vital berhasil masuk rekam medis.");
      } else Alert.alert("Gagal", json.message);
    } catch (e) { Alert.alert("Error", "Network Error"); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor={THEME.bg} barStyle="dark-content" />
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigate(-1)} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={THEME.textMain} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Observasi Rutin (30 Menit)</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.patientInfoBar}>
           <FontAwesome5 name="file-medical-alt" size={16} color={THEME.primary} />
           <Text style={styles.patientInfoText}>NO. REKAM MEDIS: {id}</Text>
        </View>

        <View style={styles.medicalCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="heart-pulse" size={22} color={THEME.accent} />
            <Text style={[styles.cardTitle, { color: THEME.accent }]}>TANDA VITAL (DJJ & NADI)</Text>
          </View>

          <View style={styles.formRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>DJJ (Fetal)</Text>
              <View style={styles.inputBox}>
                <TextInput 
                  style={styles.input} 
                  value={djj} 
                  onChangeText={setDjj} 
                  keyboardType="numeric" 
                  placeholder="140" 
                  placeholderTextColor={THEME.textSec}
                />
                <Text style={styles.unit}>bpm</Text>
              </View>
            </View>
            <View style={{width: 16}} />
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nadi (Ibu)</Text>
              <View style={styles.inputBox}>
                <TextInput 
                  style={styles.input} 
                  value={nadi} 
                  onChangeText={setNadi} 
                  keyboardType="numeric" 
                  placeholder="80"
                  placeholderTextColor={THEME.textSec} 
                />
                <Text style={styles.unit}>bpm</Text>
              </View>
            </View>
          </View>

          <View style={{marginTop:16}}>
            <Text style={styles.label}>Waktu Catat</Text>
            <TouchableOpacity onPress={() => setPickerVisible(true)} style={[styles.inputBox, {paddingVertical:12}]}>
              <Text style={{color: THEME.textMain}}>{waktuCatat.toLocaleString()}</Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isPickerVisible}
              mode="datetime"
              date={waktuCatat}
              onConfirm={(date) => { setWaktuCatat(date); setPickerVisible(false); }}
              onCancel={() => setPickerVisible(false)}
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={submitVitals} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : (
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <MaterialIcons name="save" size={18} color="#FFF" style={{marginRight:8}}/>
                <Text style={styles.saveBtnText}>SIMPAN DATA VITAL</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <InlineKontraksi catatanPartografId={catatanPartografId} userToken={userToken} />
      </ScrollView>
    </View>
  );
}

// ======================= STYLES ==========================
const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: THEME.bg },
  appBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, paddingHorizontal: 16, backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: "#E0E0E0" },
  appBarTitle: { fontSize: 16, fontWeight: "700", color: THEME.textMain },
  backBtn: { padding: 4 },
  patientInfoBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E1F5FE', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#B3E5FC' },
  patientInfoText: { fontSize: 13, fontWeight: "bold", color: "#0277BD", marginLeft: 8, letterSpacing: 0.5 },
  medicalCard: { backgroundColor: "#FFF", borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: THEME.border, shadowColor: "#000", shadowOffset: {width:0, height:2}, shadowOpacity: 0.05, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#F5F5F5", paddingBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: THEME.textMain, marginLeft: 8, letterSpacing: 0.5 },
  scannerContainer: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
  ringBackground: { width: 220, height: 220, borderRadius: 110, backgroundColor: "#ECEFF1", justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: "#CFD8DC", marginBottom: 25, shadowColor: "#000", shadowOffset: {width:0, height:3}, shadowOpacity: 0.1, elevation: 5 },
  rotatingRing: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 4, borderStyle: 'dashed', borderColor: THEME.ringIdle, justifyContent: 'center', alignItems: 'center' },
  ringKnob: { position: 'absolute', top: -6, width: 12, height: 12, borderRadius: 6, shadowColor: THEME.ringActive, shadowOpacity: 0.5, shadowRadius: 5, elevation: 5 },
  innerDisplay: { width: 180, height: 180, borderRadius: 90, backgroundColor: THEME.stopwatchBg, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: "#FFF", shadowColor: "#000", shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, elevation: 8 },
  timerLabel: { color: "#90A4AE", fontSize: 10, letterSpacing: 2, marginBottom: 5 },
  timerDigits: { fontSize: 42, fontWeight: "bold", color: "#FFF", fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 2 },
  timerUnit: { color: THEME.primary, fontSize: 10, marginTop: 5, fontWeight: "bold" },
  controlBtnWrapper: { alignItems: 'center', marginTop: -20 },
  pulseButton: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: "#FFF", shadowColor: "#000", shadowOffset: {width:0, height:4}, shadowOpacity: 0.3, elevation: 6 },
  controlLabel: { marginTop: 12, fontSize: 11, fontWeight: "bold", color: THEME.textSec, textTransform: 'uppercase', letterSpacing: 0.5 },
  recBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEBEE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#D32F2F", marginRight: 6 },
  recText: { fontSize: 10, fontWeight: "bold", color: "#D32F2F" },
  formRow: { flexDirection: 'row' },
  inputGroup: { flex: 1 },
  label: { fontSize: 12, fontWeight: "600", color: THEME.textSec, marginBottom: 6 },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: THEME.border, borderRadius: 4, backgroundColor: THEME.inputBg, paddingHorizontal: 12 },
  input: { flex: 1, paddingVertical: 10, fontSize: 16, color: THEME.textMain, fontWeight: "600" },
  unit: { fontSize: 12, color: THEME.textSec },
  saveBtn: { backgroundColor: THEME.primary, borderRadius: 6, paddingVertical: 14, alignItems: 'center', marginTop: 20, shadowColor: THEME.primary, shadowOffset: {width:0, height:2}, shadowOpacity: 0.2, elevation: 2 },
  saveBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 14, letterSpacing: 0.5 },
  tableContainer: { borderWidth: 1, borderColor: "#EEE", borderRadius: 8, overflow: 'hidden', backgroundColor: "#FFF" },
  tableHeader: { flexDirection: 'row', backgroundColor: "#F1F3F4", padding: 12, borderBottomWidth: 1, borderBottomColor: "#E0E0E0" },
  th: { flex: 1, fontSize: 11, fontWeight: "bold", color: "#607D8B" },
  thRight: { width: 40, fontSize: 11, fontWeight: "bold", color: "#607D8B", textAlign: 'center' },
  tr: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: "#FAFAFA" },
  trEven: { backgroundColor: "#FAFAFA" },
  td: { flex: 1, fontSize: 13, color: THEME.textSec },
  tdRight: { width: 40, alignItems: 'center' },
  emptyText: { textAlign: 'center', padding: 20, color: "#B0BEC5", fontSize: 12, fontStyle: 'italic' }
});
