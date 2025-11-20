import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { useParams, useNavigate } from "react-router-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

// ======================= MEDICAL THEME ==========================
const THEME = {
  bg: "#F4F6F8",
  card: "#FFFFFF",
  primary: "#0277BD",
  textMain: "#263238",
  textSec: "#78909C",
  border: "#CFD8DC",
  inputBg: "#FAFAFA",
  chipActive: "#E1F5FE",
  chipTextActive: "#0277BD"
};

// ======================= MEDICAL CHIP SELECTOR ==========================
function MedicalChipPicker({ label, value, onChange, options }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipContainer}>
        {options.map((op, idx) => {
          const isActive = value === op.value;
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => onChange(op.value)}
              style={[
                styles.chip,
                isActive && styles.chipActive
              ]}
            >
              {isActive && <MaterialIcons name="check" size={16} color={THEME.chipTextActive} style={{marginRight: 4}} />}
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {op.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function Per4jam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    pembukaan: "",
    penyusupan: "",
    warnaKetuban: "",
    tekananDarah: "",
    suhu: ""
  });

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!form.pembukaan || !form.penyusupan || !form.warnaKetuban || !form.tekananDarah || !form.suhu) {
      Alert.alert("Data Belum Lengkap", "Mohon lengkapi seluruh kolom observasi.");
      return;
    }
    Alert.alert("Sukses", "Data Observasi 4 Jam berhasil disimpan ke rekam medis.");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigate(`/home-catatan`, { state: { partografId: id } })} style={styles.backBtn}>
           <MaterialIcons name="arrow-back" size={24} color={THEME.textMain} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Observasi Lanjutan (4 Jam)</Text>
        <TouchableOpacity onPress={handleSubmit}>
           <Text style={styles.saveLink}>SIMPAN</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex:1}}>
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* SECTION 1: CERVIX & HEAD */}
          <View style={styles.medicalCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="human-pregnant" size={20} color={THEME.primary} />
              <Text style={styles.cardTitle}>STATUS SERVIKS & KEPALA</Text>
            </View>
            
            <View style={styles.inputRow}>
               <View style={styles.halfInput}>
                 <Text style={styles.fieldLabel}>Pembukaan (cm)</Text>
                 <TextInput 
                    style={styles.medInput} 
                    keyboardType="numeric" 
                    value={form.pembukaan}
                    onChangeText={t => handleChange("pembukaan", t)}
                    placeholder="0-10"
                 />
               </View>
               <View style={styles.halfInput}>
                 <Text style={styles.fieldLabel}>Penyusupan</Text>
                 <TextInput 
                    style={styles.medInput} 
                    value={form.penyusupan}
                    onChangeText={t => handleChange("penyusupan", t)}
                    placeholder="0 / + / ++"
                 />
               </View>
            </View>
          </View>

          {/* SECTION 2: FLUIDS */}
          <View style={styles.medicalCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="water-outline" size={20} color="#00897B" />
              <Text style={[styles.cardTitle, { color: "#00897B" }]}>CAIRAN KETUBAN</Text>
            </View>
            
            <MedicalChipPicker
              label="Kondisi / Warna"
              value={form.warnaKetuban}
              onChange={(v) => handleChange("warnaKetuban", v)}
              options={[
                { label: "Jernih (J)", value: "jernih" },
                { label: "Keruh (K)", value: "keruh" },
                { label: "Mekonium (M)", value: "mekonium" },
                { label: "Darah (D)", value: "darah" }, // Added standard med option
                { label: "Kering (K)", value: "kering" }
              ]}
            />
          </View>

          {/* SECTION 3: MATERNAL VITALS */}
          <View style={styles.medicalCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="doctor" size={20} color="#C2185B" />
              <Text style={[styles.cardTitle, { color: "#C2185B" }]}>KONDISI IBU</Text>
            </View>

            <View style={styles.inputRow}>
               <View style={styles.halfInput}>
                 <Text style={styles.fieldLabel}>Tekanan Darah</Text>
                 <TextInput 
                    style={styles.medInput} 
                    value={form.tekananDarah}
                    onChangeText={t => handleChange("tekananDarah", t)}
                    placeholder="120/80"
                 />
               </View>
               <View style={styles.halfInput}>
                 <Text style={styles.fieldLabel}>Suhu Tubuh (°C)</Text>
                 <TextInput 
                    style={styles.medInput} 
                    keyboardType="numeric" 
                    value={form.suhu}
                    onChangeText={t => handleChange("suhu", t)}
                    placeholder="36.5"
                 />
               </View>
            </View>
          </View>

          <TouchableOpacity style={styles.submitBlockBtn} onPress={handleSubmit}>
             <MaterialIcons name="save-alt" size={20} color="#FFF" style={{marginRight: 8}} />
             <Text style={styles.submitBtnText}>VERIFIKASI & SIMPAN</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  
  appBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 16, paddingHorizontal: 16, backgroundColor: "#FFF",
    borderBottomWidth: 1, borderBottomColor: "#E0E0E0"
  },
  appBarTitle: { fontSize: 16, fontWeight: "700", color: THEME.textMain },
  saveLink: { fontSize: 14, fontWeight: "bold", color: THEME.primary },
  
  scrollContent: { padding: 16 },

  // CARDS
  medicalCard: {
    backgroundColor: "#FFF", borderRadius: 8, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: THEME.border,
    shadowColor: "#000", shadowOffset: {width:0, height:1}, shadowOpacity: 0.02, elevation: 1
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16,
    borderBottomWidth: 1, borderBottomColor: "#F5F5F5", paddingBottom: 8
  },
  cardTitle: { fontSize: 13, fontWeight: "700", color: THEME.primary, marginLeft: 8, letterSpacing: 0.5 },

  // INPUTS
  inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: THEME.textSec, marginBottom: 6 },
  medInput: {
    borderWidth: 1, borderColor: THEME.border, borderRadius: 4,
    paddingVertical: 10, paddingHorizontal: 12, fontSize: 15,
    backgroundColor: THEME.inputBg, color: THEME.textMain
  },

  // CHIPS
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: THEME.border, borderRadius: 20,
    paddingVertical: 8, paddingHorizontal: 12, marginRight: 8, marginBottom: 8,
    backgroundColor: "#FFF"
  },
  chipActive: {
    backgroundColor: THEME.chipActive,
    borderColor: THEME.chipTextActive
  },
  chipText: { fontSize: 13, color: THEME.textSec },
  chipTextActive: { color: THEME.chipTextActive, fontWeight: "bold" },

  // BUTTON
  submitBlockBtn: {
    backgroundColor: THEME.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 16, borderRadius: 8, marginTop: 8, marginBottom: 30,
    shadowColor: THEME.primary, shadowOffset: {width:0, height:2}, shadowOpacity: 0.2, elevation: 2
  },
  submitBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 14, letterSpacing: 0.5 }
});