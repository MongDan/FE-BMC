import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from "react-native";
import { useParams, useNavigate } from "react-router-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// === HELPERS ===
const formatDateFull = (dateString) => {
  if (!dateString) return "-";
  
  // Format dari API lu: "2025-12-20 15:48:00"
  // Kita ganti spasi dengan "T" agar menjadi format ISO yang valid di semua perangkat (Android/iOS)
  const formattedString = dateString.replace(" ", "T");
  const d = new Date(formattedString);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
  ];

  // KRITIK: Jangan pernah pakai getUTC... untuk data yang sudah dalam waktu lokal!
  const day = d.getDate();           // Ambil tanggal lokal
  const month = months[d.getMonth()]; // Ambil bulan lokal
  const hours = d.getHours().toString().padStart(2, "0");     // Jam lokal (15)
  const minutes = d.getMinutes().toString().padStart(2, "0"); // Menit lokal (48)

  return `${day} ${month}, ${hours}:${minutes}`;
};

// === Empty State ===
const EmptyState = ({ text }) => (
  <View style={styles.emptyContainer}>
    <View style={styles.emptyIconBg}>
      <MaterialCommunityIcons
        name="clipboard-text-outline"
        size={32}
        color="#999"
      />
    </View>
    <Text style={styles.emptyText}>{text}</Text>
  </View>
);

export default function ObatDanCairan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `https://restful-api-bmc-production-v2.up.railway.app/api/partograf/${id}/catatan`
        );
        const json = await res.json();
        // Pastikan apiData selalu array
        setApiData(Array.isArray(json.data) ? json.data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0277BD" />
      </View>
    );
  }

  // Filter data yang tidak null
  const filteredData = apiData.filter((item) => item.obat_cairan != null);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.appBar}>
        <TouchableOpacity
          onPress={() => navigate(-1)}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Obat & Cairan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filteredData.length === 0 ? (
          <EmptyState text="Belum ada data obat & cairan" />
        ) : (
          filteredData.map((item, idx) => (
            <View key={idx} style={styles.card}>
              <View style={styles.cardDateRow}>
                <Ionicons name="time-outline" size={14} color="#888" />
                <Text style={styles.cardDate}>
                  {formatDateFull(item.waktu_catat)}
                </Text>
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>Obat & Cairan</Text>
                <Text style={styles.valueText}>{String(item.obat_cairan)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingTop: 40
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  content: { padding: 16 },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50
  },
  emptyIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10
  },
  emptyText: { color: "#999", fontStyle: "italic", fontSize: 14 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  cardDateRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  cardDate: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "bold",
    color: "#888",
    textTransform: "uppercase"
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  label: { fontSize: 14, color: "#555", fontWeight: "500" },
  valueText: { fontSize: 14, color: "#0277BD", fontWeight: "bold" }
});
