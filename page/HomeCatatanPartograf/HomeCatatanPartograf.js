import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useNavigate, useLocation } from "react-router-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ------------------ COMPONENT MENU CARD ------------------
const MenuCard = ({
  title,
  icon,
  color,
  iconColor,
  onPress,
  disabled = false,
  loading = false
}) => (
  <TouchableOpacity
    style={[
      styles.card,
      { backgroundColor: color },
      disabled && styles.cardDisabled
    ]}
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.7}
  >
    <View style={styles.iconCircle}>
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <MaterialIcons name={icon} size={32} color={iconColor} />
      )}
    </View>
    <Text style={[styles.cardText, disabled && { color: "#999" }]}>
      {title}
    </Text>
    {disabled && (
      <Text style={styles.cardStatusText}>Harus isi Data Partograf</Text>
    )}
  </TouchableOpacity>
);

const HomeCatatanPartograf = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const partografId = location.state?.partografId;

  const [catatanPartografId, setCatatanPartografId] = useState(null);
  const [isCheckingId, setIsCheckingId] = useState(true);
  const isMonitorDisabled = !catatanPartografId;

  // Cek apakah Catatan ID sudah disimpan
  useEffect(() => {
    const loadCatatanId = async () => {
      setIsCheckingId(true);
      if (partografId) {
        const savedCatatanId = await AsyncStorage.getItem(
          `catatanId_${partografId}`
        );
        if (savedCatatanId) {
          setCatatanPartografId(savedCatatanId);
        }
      }
      setIsCheckingId(false);
    };
    loadCatatanId();
  }, [partografId]);

  const handleDataPartografPress = () => {
    if (partografId) {
      navigate(`/partograf/${partografId}/catatan`);
    } else {
      Alert.alert("Error", "ID Partograf tidak ditemukan.");
    }
  };

  const handleMonitorKontraksiPress = () => {
    if (!catatanPartografId) {
      Alert.alert(
        "Aksi Ditolak",
        "Anda harus mengisi 'Data Partograf' terlebih dahulu."
      );
      return;
    }

    navigate(`/partograf/${partografId}/kontraksi`, {
      state: { catatanPartografId }
    });
  };

  // --------- RENDER CONTENT ----------
  const renderContent = () => {
    const statusText = catatanPartografId
      ? "Catatan Aktif Ditemukan"
      : "Menunggu Input Data Partograf";
    const statusColor = catatanPartografId
      ? styles.statusTextSuccess
      : styles.statusTextWarning;
    const statusIcon = catatanPartografId
      ? "checkmark-circle-outline"
      : "alert-circle-outline";

    if (isCheckingId) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#AB47BC" />
          <Text style={styles.infoText}>Memeriksa status catatan...</Text>
        </View>
      );
    }

    return (
      <View style={styles.contentWrapper}>
        {/* STATUS BOX */}
        <View style={styles.statusBox}>
          <Ionicons
            name={statusIcon}
            size={24}
            style={{ marginRight: 8 }}
            color={statusColor.color}
          />
          <Text style={[styles.statusText, statusColor]}>{statusText}</Text>
        </View>

        <Text style={styles.infoDetail}>
          ID Rujukan: {partografId || "N/A"}
        </Text>

        {/* GRID MENU */}
        <View style={styles.gridContainer}>
          {/* MONITOR KONTRAKSI */}
          <MenuCard
            title="Monitor Kontraksi"
            icon="monitor-heart"
            color="#E3F2FD"
            iconColor="#2962FF"
            onPress={handleMonitorKontraksiPress}
            disabled={isMonitorDisabled}
          />

          {/* DATA PARTOGRAF */}
          <MenuCard
            title="Data Partograf"
            icon="description"
            color="#FCE4EC"
            iconColor="#D81B60"
            onPress={handleDataPartografPress}
          />

          {/* PER 30 MENIT */}
          <MenuCard
            title="Per 30 Menit"
            icon="access-time"
            color="#E8F5E9"
            iconColor="#4CAF50"
            onPress={() => navigate(`/partograf/${partografId}/catatan/per30`)}
          />

          {/* PER 4 JAM */}
          <MenuCard
            title="Per 4 Jam"
            icon="medical-services"
            color="#FFF3E0"
            iconColor="#FFA000"
            onPress={() => navigate(`/partograf/${partografId}/catatan/per4jam`)}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#AB47BC" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate("/home")}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Catatan Perkembangan</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.mainContent}>{renderContent()}</View>
    </SafeAreaView>
  );
};

// ------------------ STYLE ------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#AB47BC",
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4
  },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  mainContent: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center"
  },

  contentWrapper: { width: "100%", alignItems: "center" },

  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E0E0E0"
  },
  statusText: { fontSize: 14, fontWeight: "bold" },
  statusTextSuccess: { color: "#388E3C" },
  statusTextWarning: { color: "#FBC02D" },
  infoDetail: { marginBottom: 30, fontSize: 13, color: "#888" },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 400
  },

  loadingContainer: {
    alignItems: "center",
    padding: 50,
    borderRadius: 10,
    backgroundColor: "#FFF",
    elevation: 3
  },

  card: {
    width: "48%",
    aspectRatio: 1.3,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  cardDisabled: {
    borderColor: "#D32F2F",
    borderWidth: 2,
    backgroundColor: "#FAFAFA",
    elevation: 1
  },
  iconCircle: {
    width: 60,
    height: 60,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    elevation: 3
  },
  cardText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    textAlign: "center"
  },
  cardStatusText: {
    position: "absolute",
    bottom: 5,
    fontSize: 10,
    color: "#D32F2F",
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 5
  }
});

export default HomeCatatanPartograf;
