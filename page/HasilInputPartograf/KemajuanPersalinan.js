import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from "react-native";
import { useParams, useNavigate } from "react-router";
import { Ionicons } from "@expo/vector-icons";

export default function KemajuanPersalinan() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState({
    pembukaan_servik: null,
    kontraksi: []
  });
  const [loading, setLoading] = useState(true);

  // ===================== FORMAT TANGGAL =====================
  const formatDate = (dateString) => {
    if (!dateString) return "-";

    const d = new Date(dateString);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // ===================== FETCH API =====================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `https://restful-api-bmc-production.up.railway.app/api/partograf/${id}/catatan`
        );

        const json = await res.json();

        const latest = json.data[0] ?? null;

        if (latest) {
          setData({
            pembukaan_servik: latest.pembukaan_servik,
            kontraksi: latest.kontraksi || []
          });
        }
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Tombol Back */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigate(`/partograf/${id}/hasil-input`)}
      >
        <Ionicons name="arrow-back" size={24} color="#1A2530" />
        <Text style={styles.backText}>Kembali</Text>
      </TouchableOpacity>

      <Text style={styles.header}>Kemajuan Persalinan</Text>

      {/* ===================== CARD PEMBUKAAN SERVIK ===================== */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pembukaan Servik</Text>
        <Text style={styles.value}>
          {data.pembukaan_servik ?? "Belum dicatat"}
        </Text>
      </View>

      {/* ===================== CARD KONTRAKSI ===================== */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Kontraksi</Text>

        {data.kontraksi.length === 0 ? (
          <Text style={styles.empty}>Tidak ada kontraksi</Text>
        ) : (
          data.kontraksi.map((item, idx) => (
            <View key={idx} style={styles.listItem}>
              <Text style={styles.listText}>
                • Mulai: {formatDate(item.waktu_mulai)}
              </Text>
              <Text style={styles.listText}>
                • Selesai: {formatDate(item.waktu_selesai)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

// ===================== STYLE =====================
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#F7F9FC",
    flex: 1
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15
  },
  backText: {
    marginLeft: 6,
    fontSize: 16,
    color: "#1A2530",
    fontWeight: "600"
  },

  header: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 20,
    color: "#1A2530"
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 14,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: "#333"
  },
  value: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0A84FF"
  },
  listItem: {
    marginBottom: 12,
    backgroundColor: "#F1F6FF",
    padding: 10,
    borderRadius: 10
  },
  listText: {
    fontSize: 14,
    color: "#333"
  },
  empty: {
    color: "#777",
    fontStyle: "italic"
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  }
});
