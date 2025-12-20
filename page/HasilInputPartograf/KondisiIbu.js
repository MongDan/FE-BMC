import React, { useEffect, useState, useMemo } from "react";
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
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des"
  ];

  // KRITIK: Jangan pernah pakai getUTC... untuk data yang sudah dalam waktu lokal!
  const day = d.getDate(); // Ambil tanggal lokal
  const month = months[d.getMonth()]; // Ambil bulan lokal
  const hours = d.getHours().toString().padStart(2, "0"); // Jam lokal (15)
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

export default function KondisiIbuTabs() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("nadi");
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(true);

  // === Tab Config dengan icon dan unit ===
  const tabConfig = [
    { key: "nadi", label: "Nadi", unit: "bpm", icon: "heart-pulse" },
    { key: "tekanan", label: "TD", unit: "mmHg", icon: "speedometer" },
    { key: "suhu", label: "Suhu", unit: "°C", icon: "thermometer" },
    { key: "urine", label: "Urine", unit: "ml", icon: "cup-water" }
  ];

  // === Fetch Data ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `https://restful-api-bmc-production-v2.up.railway.app/api/partograf/${id}/catatan`
        );
        const json = await res.json();
        setApiData(Array.isArray(json.data) ? json.data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // === Sort by latest time ===
  const tabData = useMemo(() => {
    return apiData.sort(
      (a, b) => new Date(b.waktu_catat) - new Date(a.waktu_catat)
    );
  }, [apiData]);

  // === Render Value per Tab ===
  const renderValue = (item) => {
    switch (activeTab) {
      case "nadi":
        return item.nadi_ibu ?? null;
      case "tekanan":
        return item.sistolik && item.diastolik
          ? `${item.sistolik}/${item.diastolik}`
          : null;
      case "suhu":
        return item.suhu_ibu ?? null;
      case "urine":
        return item.volume_urine ?? null;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0277BD" />
      </View>
    );
  }

  // === Filter data null supaya tidak ditampilkan ===
  const filteredData = tabData.filter((item) => renderValue(item) !== null);

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
        <Text style={styles.headerTitle}>Kondisi Ibu</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {tabConfig.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabBtn,
              activeTab === tab.key && styles.tabBtnActive
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={18}
              color={activeTab === tab.key ? "#FFF" : "#666"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {filteredData.length === 0 ? (
          <EmptyState text={`Belum ada data ${activeTab}`} />
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
                <Text style={styles.label}>
                  {tabConfig.find((t) => t.key === activeTab).label}
                </Text>
                <Text style={styles.valueText}>
                  {renderValue(item)}{" "}
                  {tabConfig.find((t) => t.key === activeTab).unit}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ===================== STYLES =====================
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
  tabContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE"
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    marginHorizontal: 4
  },
  tabBtnActive: { backgroundColor: "#0277BD" },
  tabText: { marginLeft: 6, fontWeight: "600", color: "#666", fontSize: 14 },
  tabTextActive: { color: "#FFF" },
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
