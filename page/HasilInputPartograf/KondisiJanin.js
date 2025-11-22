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
import { Ionicons } from "@expo/vector-icons";

export default function KondisiJanin() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState({
    djj: null,
    penyusupan: null,
    air_ketuban: null
  });

  const [loading, setLoading] = useState(true);

  // ===================== FETCH API =====================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `https://restful-api-bmc-production.up.railway.app/api/partograf/${id}/catatan`
        );

        const json = await res.json();

        const latest = json.data[0];

        setData({
          djj: latest.djj ?? null,
          penyusupan: latest.penyusupan ?? null,
          warna_air_ketuban: latest.air_ketuban ?? null
        });
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
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigate(`/partograf/${id}/hasil-input`)}
      >
        <Ionicons name="arrow-back" size={24} color="#1A2530" />
        <Text style={styles.backText}>Kembali</Text>
      </TouchableOpacity>

      <Text style={styles.header}>Kondisi Janin</Text>

      {/* ===================== DJJ ===================== */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Detak Jantung Janin (DJJ)</Text>
        <Text style={styles.value}>{data.djj ?? "Belum dicatat"}</Text>
      </View>

      {/* ===================== PENYUSUPAN ===================== */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Penyusupan</Text>
        <Text style={styles.value}>{data.penyusupan ?? "Belum dicatat"}</Text>
      </View>

      {/* ===================== WARNA AIR KETUBAN ===================== */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Warna Air Ketuban</Text>
        <Text style={styles.value}>
          {data.warna_air_ketuban ?? "Belum dicatat"}
        </Text>
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  }
});
