import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Keyboard,
  Modal // Balik ke Modal Native
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigate } from "react-router-native";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";

const THEME = {
  bg: "#F4F6F8",
  primary: "#448AFF",
  cardBg: "#FFFFFF",
  textMain: "#263238",
  textSec: "#78909C",
  border: "#ECEFF1",
  inputBg: "#FAFAFA",
  danger: "#EF5350",
  success: "#66BB6A",
  warning: "#FFB300"
};

// === COMPONENT: NATIVE MODAL ALERT ===
function CustomAlertModal({
  isVisible,
  onClose,
  title,
  message,
  type = "info"
}) {
  const iconMap = {
    danger: { name: "alert-triangle", color: THEME.danger },
    success: { name: "check-circle", color: THEME.success },
    info: { name: "info", color: THEME.primary }
  };

  const { name, color: iconColor } = iconMap[type] || iconMap.info;

  return (
    <Modal
      transparent={true}
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose} // Penting untuk tombol back Android
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.alertBox}>
          <View
            style={[styles.iconCircle, { backgroundColor: iconColor + "15" }]}
          >
            <Feather name={name} size={35} color={iconColor} />
          </View>

          <Text style={styles.alertTitle}>{title}</Text>
          <Text style={styles.alertMessage}>{message}</Text>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { width: "100%", backgroundColor: iconColor }
            ]}
            onPress={onClose}
          >
            <Text style={styles.primaryButtonText}>MENGERTI</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function TambahEdukasi() {
  const navigate = useNavigate();
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [kontenList, setKontenList] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("create");

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    msg: "",
    type: "info"
  });

  const fetchKonten = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(
        "https://restful-api-bmc-production-v2.up.railway.app/api/konten-edukasi"
      );
      const data = await res.json();
      if (res.ok) setKontenList(data.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchKonten();
  }, []);

  const handleSubmit = async () => {
    Keyboard.dismiss(); // Kunci utama agar UI stabil sebelum modal muncul

    if (!judul.trim() || !isi.trim()) {
      setAlert({
        visible: true,
        title: "Data Kosong",
        msg: "Judul dan isi materi harus terisi sebelum diterbitkan.",
        type: "danger"
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      const res = await fetch(
        "https://restful-api-bmc-production-v2.up.railway.app/api/konten-edukasi",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ judul_konten: judul, isi_konten: isi })
        }
      );

      if (res.ok) {
        setAlert({
          visible: true,
          title: "Berhasil",
          msg: "Materi edukasi berhasil diterbitkan.",
          type: "success"
        });
        setJudul("");
        setIsi("");
        setActiveTab("list");
        fetchKonten();
      }
    } catch (err) {
      setAlert({
        visible: true,
        title: "Gagal",
        msg: "Koneksi server bermasalah.",
        type: "danger"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* NATIVE MODAL COMPONENT */}
      <CustomAlertModal
        isVisible={alert.visible}
        title={alert.title}
        message={alert.msg}
        type={alert.type}
        onClose={() => setAlert({ ...alert, visible: false })}
      />

      <View style={styles.container}>
        <View style={styles.tabWrapper}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "create" && styles.tabActive]}
            onPress={() => setActiveTab("create")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "create" && styles.tabTextActive
              ]}
            >
              Buat Baru
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === "list" && styles.tabActive]}
            onPress={() => setActiveTab("list")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "list" && styles.tabTextActive
              ]}
            >
              Daftar Materi
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "create" ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>FORMULIR EDUKASI</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Judul Materi</Text>
                <TextInput
                  style={styles.simpleInput}
                  placeholder="Judul"
                  value={judul}
                  onChangeText={setJudul}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Isi Materi</Text>
                <TextInput
                  style={[
                    styles.simpleInput,
                    { height: 150, textAlignVertical: "top" }
                  ]}
                  placeholder="Isi..."
                  value={isi}
                  onChangeText={setIsi}
                  multiline
                />
              </View>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>TERBITKAN MATERI</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={kontenList}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={fetchKonten} />
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() =>
                  navigate("/lihat-konten", { state: { kontenData: item } })
                }
              >
                <View
                  style={[styles.menuIconBox, { backgroundColor: "#E3F2FD" }]}
                >
                  <Ionicons name="book" size={20} color={THEME.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuText}>{item.judul_konten}</Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={THEME.textSec}
                />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.bg },
  container: { flex: 1, padding: 20 },
  tabWrapper: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: THEME.border
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10
  },
  tabActive: { backgroundColor: THEME.primary },
  tabText: { fontSize: 14, fontWeight: "600", color: THEME.textSec },
  tabTextActive: { color: "#FFF" },
  sectionCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.border
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.textSec,
    marginBottom: 15,
    letterSpacing: 1
  },
  inputGroup: { marginBottom: 16 },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.textSec,
    marginBottom: 8
  },
  simpleInput: {
    backgroundColor: THEME.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 14,
    fontSize: 15,
    color: THEME.textMain
  },
  primaryButton: {
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center"
  },
  primaryButtonText: { color: "#FFF", fontWeight: "bold", letterSpacing: 0.5 },
  listContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5"
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16
  },
  menuText: { fontSize: 15, fontWeight: "600", color: THEME.textMain },

  // === MODAL STYLES (NATIVE VERSION) ===
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  alertBox: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 30,
    alignItems: "center",
    elevation: 20, // Penting untuk Android agar di atas layer lain
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: THEME.textMain,
    marginBottom: 10,
    textAlign: "center"
  },
  alertMessage: {
    fontSize: 14,
    color: THEME.textSec,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 20
  }
});
