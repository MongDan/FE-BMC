import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useParams, useNavigate } from "react-router-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// === HELPERS ===
const formatTime = (dateString) => {
  if (!dateString) return "-";
  const d = new Date(dateString);
  const hours = d.getUTCHours().toString().padStart(2, "0");
  const minutes = d.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const formatDateFull = (dateString) => {
  if (!dateString) return "-";
  const d = new Date(dateString);
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
    "Des",
  ];
  const day = d.getUTCDate();
  const month = months[d.getUTCMonth()];
  const hours = d.getUTCHours().toString().padStart(2, "0");
  const minutes = d.getUTCMinutes().toString().padStart(2, "0");

  return `${day} ${month}, ${hours}:${minutes}`;
};

const groupHistoryBy10Minutes = (data) => {
  if (!data || data.length === 0) return [];
  const sortedData = [...data].sort(
    (a, b) => new Date(b.waktu_mulai) - new Date(a.waktu_mulai)
  );
  const groups = {};
  sortedData.forEach((item) => {
    const date = new Date(item.waktu_mulai);
    const roundedMinutes = Math.floor(date.getUTCMinutes() / 10) * 10;
    const startH = date.getUTCHours().toString().padStart(2, "0");
    const startM = roundedMinutes.toString().padStart(2, "0");

    const endDate = new Date(date);
    endDate.setUTCMinutes(roundedMinutes + 10);
    const endH = endDate.getUTCHours().toString().padStart(2, "0");
    const endM = endDate.getUTCMinutes().toString().padStart(2, "0");

    const groupKey = `${startH}:${startM} - ${endH}:${endM}`;
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(item);
  });
  return Object.keys(groups).map((key) => ({
    title: key,
    data: groups[key],
    count: groups[key].length,
  }));
};

// Komponen Bar Pembukaan
const PembukaanBar = ({ value }) => {
  const percentage = Math.min((value / 10) * 100, 100);
  return (
    <View style={styles.barContainer}>
      <View style={styles.barHeader}>
        <Text style={styles.barLabel}>Pembukaan Serviks</Text>
        <Text style={styles.barValue}>
          {value} <Text style={styles.barUnit}>cm</Text>
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
};

// Komponen Empty State
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

export default function KemajuanPersalinan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pembukaan");
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `https://restful-api-bmc-production.up.railway.app/api/partograf/${id}/catatan`
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

  const pembukaanData = useMemo(() => {
    return apiData
      .filter(
        (item) =>
          item.pembukaan_servik !== null || item.penurunan_kepala !== null
      )
      .sort((a, b) => new Date(b.waktu_catat) - new Date(a.waktu_catat));
  }, [apiData]);

  const kontraksiGroups = useMemo(() => {
    const allKontraksi = apiData.flatMap((item) => item.kontraksi || []);
    return groupHistoryBy10Minutes(allKontraksi);
  }, [apiData]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0277BD" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.appBar}>
        <TouchableOpacity
          // FIX: Arahkan ke /home-catatan/ID (Dashboard Utama) agar data ter-refresh
          // Sesuai dengan path yang ada di file HasilInputPartograf.js
          onPress={() => navigate("/home-catatan/" + id)}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kemajuan Persalinan</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "pembukaan" && styles.tabBtnActive,
          ]}
          onPress={() => setActiveTab("pembukaan")}
        >
          <MaterialCommunityIcons
            name="ruler"
            size={18}
            color={activeTab === "pembukaan" ? "#FFF" : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "pembukaan" && styles.tabTextActive,
            ]}
          >
            Pembukaan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "kontraksi" && styles.tabBtnActive,
          ]}
          onPress={() => setActiveTab("kontraksi")}
        >
          <MaterialCommunityIcons
            name="pulse"
            size={18}
            color={activeTab === "kontraksi" ? "#FFF" : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "kontraksi" && styles.tabTextActive,
            ]}
          >
            Kontraksi
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* TAB PEMBUKAAN */}
        {activeTab === "pembukaan" && (
          <>
            {pembukaanData.length === 0 ? (
              <EmptyState text="Belum ada data pembukaan" />
            ) : (
              pembukaanData.map((item, idx) => (
                <View key={idx} style={styles.card}>
                  <View style={styles.cardDateRow}>
                    <Ionicons name="time-outline" size={14} color="#888" />
                    <Text style={styles.cardDate}>
                      {formatDateFull(item.waktu_catat)}
                    </Text>
                  </View>

                  {/* Pembukaan Serviks */}
                  {item.pembukaan_servik !== null ? (
                    <PembukaanBar value={item.pembukaan_servik} />
                  ) : (
                    <Text style={styles.noDataText}>
                      - Pembukaan tidak dicatat -
                    </Text>
                  )}

                  <View style={styles.divider} />

                  {/* Penurunan Kepala */}
                  {item.penurunan_kepala !== null ? (
                    <View style={styles.rowBetween}>
                      <Text style={styles.label}>Penurunan Kepala</Text>
                      <View style={styles.dotsContainer}>
                        {[5, 4, 3, 2, 1].map((num) => (
                          <View
                            key={num}
                            style={[
                              styles.dot,
                              item.penurunan_kepala >= num
                                ? styles.dotActive
                                : styles.dotInactive,
                            ]}
                          />
                        ))}
                        <Text style={styles.valText}>
                          {item.penurunan_kepala}/5
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.noDataText}>
                      - Penurunan kepala tidak dicatat -
                    </Text>
                  )}
                </View>
              ))
            )}
          </>
        )}

        {/* TAB KONTRAKSI */}
        {activeTab === "kontraksi" && (
          <>
            {kontraksiGroups.length === 0 ? (
              <EmptyState text="Belum ada data kontraksi" />
            ) : (
              kontraksiGroups.map((group, idx) => (
                <View key={idx} style={styles.cardNoPadding}>
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupTitle}>{group.title}</Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{group.count}x</Text>
                    </View>
                  </View>
                  <View>
                    <View style={styles.thRow}>
                      <Text style={styles.th}>MULAI</Text>
                      <Text style={styles.th}>SELESAI</Text>
                      <Text style={[styles.th, { textAlign: "right" }]}>
                        DURASI
                      </Text>
                    </View>
                    {group.data.map((k, kIdx) => {
                      const start = new Date(k.waktu_mulai);
                      const end = new Date(k.waktu_selesai);
                      const durasi = Math.round((end - start) / 1000);
                      return (
                        <View key={kIdx} style={styles.tr}>
                          <Text style={styles.td}>
                            {formatTime(k.waktu_mulai)}
                          </Text>
                          <Text style={styles.td}>
                            {formatTime(k.waktu_selesai)}
                          </Text>
                          <Text
                            style={[
                              styles.td,
                              styles.tdBold,
                              { textAlign: "right" },
                            ]}
                          >
                            {durasi}"
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))
            )}
          </>
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
    paddingTop: 40,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  tabContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    marginHorizontal: 4,
  },
  tabBtnActive: { backgroundColor: "#0277BD" },
  tabText: { marginLeft: 6, fontWeight: "600", color: "#666", fontSize: 14 },
  tabTextActive: { color: "#FFF" },
  content: { padding: 16 },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  emptyIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
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
    shadowRadius: 2,
  },
  cardDateRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  cardDate: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "bold",
    color: "#888",
    textTransform: "uppercase",
  },
  barContainer: { marginBottom: 10 },
  barHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  barLabel: { fontSize: 14, color: "#555", fontWeight: "500" },
  barValue: { fontSize: 18, fontWeight: "bold", color: "#0277BD" },
  barUnit: { fontSize: 12, fontWeight: "normal", color: "#666" },
  track: { height: 10, backgroundColor: "#EEE", borderRadius: 5 },
  fill: { height: 10, backgroundColor: "#FBC02D", borderRadius: 5 },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 12 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { fontSize: 14, color: "#555", fontWeight: "500" },
  dotsContainer: { flexDirection: "row", alignItems: "center" },
  dot: { width: 12, height: 12, borderRadius: 6, marginHorizontal: 3 },
  dotActive: { backgroundColor: "#0277BD" },
  dotInactive: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "#DDD" },
  valText: {
    marginLeft: 8,
    fontWeight: "bold",
    color: "#0277BD",
    fontSize: 16,
  },
  noDataText: {
    fontSize: 12,
    color: "#AAA",
    fontStyle: "italic",
    marginBottom: 8,
  },
  cardNoPadding: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    overflow: "hidden",
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E1F5FE",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  groupTitle: { fontSize: 14, fontWeight: "bold", color: "#0277BD" },
  countBadge: {
    backgroundColor: "#FFF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  countText: { fontSize: 12, fontWeight: "bold", color: "#0277BD" },
  thRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  th: { flex: 1, fontSize: 11, fontWeight: "bold", color: "#888" },
  tr: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  td: { flex: 1, fontSize: 13, color: "#444" },
  tdBold: { fontWeight: "bold", color: "#0277BD" },
});
