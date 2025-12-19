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
  Modal,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  Pressable,
  ScrollView
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigate } from "react-router-native";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  Feather
} from "@expo/vector-icons";

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

// Reuse CustomAlertModal dari ProfileScreen
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
    <Modal transparent visible={isVisible} animationType="fade">
      <View style={styles.alertBackdrop}>
        <View style={styles.alertBox}>
          <View
            style={[styles.iconCircle, { backgroundColor: iconColor + "15" }]}
          >
            <Feather name={name} size={30} color={iconColor} />
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
            <Text style={styles.primaryButtonText}>TUTUP</Text>
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
    if (!judul || !isi) {
      setAlert({
        visible: true,
        title: "Gagal",
        msg: "Judul dan isi tidak boleh kosong.",
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
          msg: "Materi berhasil diterbitkan.",
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
        title: "Error",
        msg: "Koneksi gagal.",
        type: "danger"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <CustomAlertModal
        isVisible={alert.visible}
        title={alert.title}
        message={alert.msg}
        type={alert.type}
        onClose={() => setAlert({ ...alert, visible: false })}
      />

      {/* Header ala Profile/Home */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate(-1)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={THEME.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pusat Edukasi</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        {/* Tab Switcher ala Profile Section */}
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
                  placeholder="Contoh: Gizi Ibu Hamil"
                  value={judul}
                  onChangeText={setJudul}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Isi Materi Lengkap</Text>
                <TextInput
                  style={[
                    styles.simpleInput,
                    { height: 150, textAlignVertical: "top" }
                  ]}
                  placeholder="Tuliskan penjelasan..."
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
                  <Text style={styles.menuText} numberOfLines={1}>
                    {item.judul_konten}
                  </Text>
                  <Text style={styles.subText}>ID: {item.id}</Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={THEME.textSec}
                />
              </TouchableOpacity>
            )}
            ListHeaderComponent={
              <Text style={styles.sectionTitle}>SEMUA MATERI</Text>
            }
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {/* Bottom Bar akan muncul secara otomatis jika ini adalah route yang dipanggil di dalam main navigasi */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: THEME.border
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: THEME.textMain },
  backBtn: { padding: 4 },
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
    alignItems: "center",
    elevation: 2
  },
  primaryButtonText: { color: "#FFF", fontWeight: "bold", letterSpacing: 0.5 },
  listContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: THEME.border,
    overflow: "hidden"
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
  subText: { fontSize: 11, color: THEME.textSec },
  alertBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  alertBox: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 30,
    alignItems: "center"
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: THEME.textMain,
    marginBottom: 10
  },
  alertMessage: {
    fontSize: 15,
    color: THEME.textSec,
    textAlign: "center",
    marginBottom: 30
  }
});
