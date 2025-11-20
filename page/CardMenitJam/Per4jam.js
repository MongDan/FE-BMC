import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigate, useParams } from "react-router-native";

export default function Per4Jam() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(
      `https://restful-api-bmc-production.up.railway.app/api/partograf/${id}/catatan`
    )
      .then((res) => res.json())
      .then((json) => {
        if (!mounted) return;
        setData(json.data || json || {});
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        Alert && Alert.alert && Alert.alert("Error", "Gagal mengambil data.");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [id]);

  const pembukaan = data.pembukaan_servik ?? data.pembukaan ?? "-";
  const sistolik = data.sistolik ?? "-";
  const diastolik = data.diastolik ?? "-";
  const suhu = data.suhu_ibu ?? data.suhu ?? "-";

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigate(-1)} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <Text style={styles.title}>Pencatatan Per 4 Jam</Text>
      <Text style={styles.sub}>Partograf ID: {id}</Text>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={styles.row}>
            <Text style={styles.label}>Pembukaan Serviks</Text>
            <Text style={styles.value}>{pembukaan}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Tekanan Darah</Text>
            <Text style={styles.value}>
              {sistolik}/{diastolik} mmHg
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Suhu Ibu</Text>
            <Text style={styles.value}>{suhu} °C</Text>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 0, backgroundColor: "#F7F7F7" },
  backBtn: { marginTop: 10, marginLeft: 10 },
  title: { fontSize: 22, fontWeight: "bold", marginTop: 6, marginLeft: 16 },
  sub: { color: "#666", marginBottom: 10, marginLeft: 16 },
  row: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 16,
    elevation: 2
  },
  label: { color: "#666", fontSize: 14, marginBottom: 6 },
  value: { fontSize: 18, fontWeight: "700" }
});
