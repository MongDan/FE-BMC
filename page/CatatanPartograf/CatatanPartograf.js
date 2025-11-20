import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar
} from "react-native";
import { useParams, useNavigate } from "react-router-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ... (Komponen FormInput, Picker, Card tetap sama)

function FormInput({ label, name, value, onChange, placeholder }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.inputField}
        value={value}
        placeholder={placeholder}
        placeholderTextColor="#b2bec3"
        onChangeText={(val) => onChange(name, val)}
      />
    </View>
  );
}

function Picker({ label, value, onChangeValue, options }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.inputLabel}>{label}</Text>

      <View style={styles.pickerWrap}>
        {options.map((item, i) => {
          const val = item.value || item;
          const text = item.label || item;

          return (
            <TouchableOpacity
              key={i}
              style={[styles.optionBox, value === val && styles.optionSelected]}
              onPress={() => onChangeValue(val)}
            >
              <Text
                style={[styles.optionText, value === val && { color: "#fff" }]}
              >
                {text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function Card({ title, iconColor, children }) {
  return (
    <View style={styles.card}>
      <View style={[styles.cardHeader, { borderLeftColor: iconColor }]}>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function CatatanPartograf() {
  const { id } = useParams(); // ID Partograf Utama
  const navigate = useNavigate();

  // MENGATUR STATUS BAR
  useEffect(() => {
    StatusBar.setTranslucent(false);
    StatusBar.setBackgroundColor("#1877f2");
    StatusBar.setBarStyle("light-content");

    return () => {
      StatusBar.setTranslucent(false);
      StatusBar.setBackgroundColor("transparent");
    };
  }, []);

  const emptyForm = {
    partograf_id: id,
    djj: "",
    pembukaan_servik: "",
    penurunan_kepala: "",
    nadi_ibu: "",
    suhu_ibu: "",
    sistolik: "",
    diastolik: "",
    aseton: "",
    protein: "",
    volume_urine: "",
    obat_cairan: "",
    air_ketuban: "",
    molase: ""
  };

  const [form, setForm] = useState(emptyForm);
  const resetForm = () => setForm({ ...emptyForm });

  useEffect(() => {
    setForm((prevForm) => ({ ...prevForm, partograf_id: id }));
  }, [id]);

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    // Diasumsikan token ada di AsyncStorage (seperti di MonitorKontraksi.js)
    const userToken = await AsyncStorage.getItem("userToken");
    if (!userToken) {
      Alert.alert("Akses Ditolak", "Token tidak ditemukan.");
      return;
    }

    try {
      const res = await fetch(
        `https://restful-api-bmc-production.up.railway.app/api/partograf/${id}/catatan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}` // Asumsi API ini juga butuh token
          },
          body: JSON.stringify(form)
        }
      );

      const json = await res.json();

      if (!res.ok) {
        return Alert.alert("Gagal", json.message || "Terjadi kesalahan");
      }

      // *** LOGIKA BARU: Menyimpan ID Catatan Partograf yang baru dibuat ***
      const newCatatanId = json.data?.id; // Asumsi API merespons dengan {data: {id: ...}}
      if (newCatatanId) {
        // Menyimpan ID Catatan Partograf ke AsyncStorage dengan kunci unik berdasarkan Partograf ID utama
        await AsyncStorage.setItem(`catatanId_${id}`, newCatatanId);
      }

      Alert.alert(
        "Berhasil",
        json.message || `Catatan berhasil disimpan. ID Baru: ${newCatatanId}`
      );
      resetForm();
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Tidak dapat terhubung ke server");
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate("/home")}>
          <Text style={styles.backHeader}>←</Text>
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>Catatan Partograf</Text>
          <Text style={styles.headerSubtitle}>ID Partograf: {id}</Text>
        </View>
      </View>

      <ScrollView style={styles.contentArea}>
        {/* CARD 1: Vital Signs */}
        <Card title="Vital Signs" iconColor="#e84118">
          <FormInput
            label="DJJ (Denyut Jantung Janin)"
            name="djj"
            value={form.djj}
            placeholder="Contoh: 140 (satuan kali/menit)"
            onChange={handleChange}
          />
          <FormInput
            label="Pembukaan Serviks"
            name="pembukaan_servik"
            value={form.pembukaan_servik}
            placeholder="0-10 (satuan cm)"
            onChange={handleChange}
          />

          <FormInput
            label="Penurunan Kepala (Hodge)"
            name="penurunan_kepala"
            value={form.penurunan_kepala}
            placeholder="0-5 (0=atas, 5=bawah/lahir)"
            onChange={handleChange}
          />

          <FormInput
            label="Nadi Ibu"
            name="nadi_ibu"
            value={form.nadi_ibu}
            placeholder="Contoh: 80 (satuan kali/menit)"
            onChange={handleChange}
          />

          <FormInput
            label="Suhu Ibu"
            name="suhu_ibu"
            value={form.suhu_ibu}
            placeholder="Contoh: 36.5 (satuan °C)"
            onChange={handleChange}
          />
        </Card>

        {/* CARD 2: Pemantauan Tambahan */}
        <Card title="Pemantauan Tambahan" iconColor="#487eb0">
          <FormInput
            label="Sistolik (Tekanan Darah)"
            name="sistolik"
            value={form.sistolik}
            placeholder="Contoh: 120 (satuan mmHg)"
            onChange={handleChange}
          />

          <FormInput
            label="Diastolik (Tekanan Darah)"
            name="diastolik"
            value={form.diastolik}
            placeholder="Contoh: 80 (satuan mmHg)"
            onChange={handleChange}
          />

          <Picker
            label="Aseton"
            value={form.aseton}
            onChangeValue={(v) => handleChange("aseton", v)}
            options={["-", "+"]}
          />

          <Picker
            label="Protein Urine"
            value={form.protein}
            onChangeValue={(v) => handleChange("protein", v)}
            options={["-", "+", "++", "+++"]}
          />

          <FormInput
            label="Volume Urine (ml)"
            name="volume_urine"
            value={form.volume_urine}
            placeholder="Contoh: 250"
            onChange={handleChange}
          />
        </Card>

        {/* CARD 3: Obat & Cairan */}
        <Card title="Obat & Cairan" iconColor="#0097e6">
          <FormInput
            label="Obat / Cairan"
            name="obat_cairan"
            value={form.obat_cairan}
            placeholder="Contoh: Oksitosin 10 IU atau RL 500ml"
            onChange={handleChange}
          />

          <Picker
            label="Air Ketuban"
            value={form.air_ketuban}
            onChangeValue={(v) => handleChange("air_ketuban", v)}
            options={[
              { label: "Jernih", value: "j" },
              { label: "Hijau", value: "h" },
              { label: "Mekonium", value: "m" }
            ]}
          />

          <Picker
            label="Molase (Penyusupan Tulang Kepala)"
            value={form.molase}
            onChangeValue={(v) => handleChange("molase", v)}
            options={["0", "1", "2", "3"]}
          />
        </Card>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Simpan Catatan Partograf</Text>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#eef2f7" },
  contentArea: { flex: 1, padding: 15 },
  header: {
    backgroundColor: "#1877f2",
    paddingVertical: 24,
    paddingHorizontal: 20,
    flexDirection: "row",
    gap: 15,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30
  },
  backHeader: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  headerSubtitle: { color: "#dfe6e9", fontSize: 13 },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 16,
    marginBottom: 25,
    elevation: 4
  },
  cardHeader: {
    borderLeftWidth: 6,
    paddingLeft: 10,
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2f3640"
  },
  inputLabel: {
    color: "#2f3640",
    marginBottom: 6,
    fontSize: 14
  },
  inputField: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dcdde1",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15
  },
  pickerWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  optionBox: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dcdde1",
    backgroundColor: "#f1f2f6"
  },
  optionSelected: {
    backgroundColor: "#1877f2",
    borderColor: "#1877f2"
  },
  optionText: {
    color: "#2f3640",
    fontSize: 14
  },
  submitButton: {
    backgroundColor: "#1877f2",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 5,
    elevation: 4
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  }
});
