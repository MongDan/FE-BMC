import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import TambahPasienForm from "./TambahPasienForm";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ProfileScreen from "../ProfileScreen/ProfileScreen";
import { useNavigate } from "react-router-native";

const formatNoReg = (noReg) => {
  if (!noReg) return "";
  return noReg.toString().replace(".00", "");
};

const formatDatetime = (datetime) => {
  if (!datetime) return "-";
  const date = new Date(datetime);
  return `${date.getDate()} ${date.toLocaleString("id-ID", {
    month: "short",
  })} ${date.getFullYear()}, ${date.getHours()}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
};

const PasienCard = ({ pasien, onPress }) => {
  const status = pasien.persalinan?.status || "tidak diketahui";

  const getStatusStyle = () => {
    switch (status) {
      case "aktif":
        return {
          borderColor: "#29b6f6",
          badgeColor: "#29b6f6",
          badgeText: "Aktif",
        };

      case "tidak_aktif":
        return {
          borderColor: "#bdbdbd",
          badgeColor: "#bdbdbd",
          badgeText: "Tidak Aktif",
        };

      case "selesai":
        return {
          borderColor: "#4CAF50",
          badgeColor: "#4CAF50",
          badgeText: "Selesai",
        };

      case "rujukan":
        return {
          borderColor: "#FBC02D",
          badgeColor: "#FBC02D",
          badgeText: "Rujukan",
        };

      default:
        return {
          borderColor: "#e0e0e0",
          badgeColor: "#bdbdbd",
          badgeText: "Tidak Diketahui",
        };
    }
  };

  const { borderColor, badgeColor, badgeText } = getStatusStyle();

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={[styles.card, { borderColor }]}>
        <FontAwesome name="user-circle" size={50} color="#555" />

        <View style={styles.cardInfo}>
          <Text style={styles.cardNama}>{pasien.nama}</Text>
          <Text style={styles.cardDetail}>Umur: {pasien.umur} tahun</Text>
          <Text style={styles.cardDetail}>
            No. Register: {formatNoReg(pasien.no_reg)}
          </Text>
          <Text style={styles.cardDetail}>Alamat: {pasien.alamat}</Text>

          {pasien.jam_ketuban_pecah && (
            <View style={styles.cardDateRow}>
              <Ionicons
                name="calendar"
                size={16}
                color="#777"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.cardDetail}>
                Jam Ketuban Pecah: {formatDatetime(pasien.jam_ketuban_pecah)}
              </Text>
            </View>
          )}

          {pasien.tgl_jam_mules && (
            <View style={styles.cardDateRow}>
              <Ionicons
                name="calendar"
                size={16}
                color="#777"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.cardDetail}>
                Tgl & Jam Mulai Mules: {formatDatetime(pasien.tgl_jam_mules)}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>{badgeText}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const navigate = useNavigate();

  const [modalVisible, setModalVisible] = useState(false);
  const [userToken, setUserToken] = useState(null);
  const [pasienList, setPasienList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeScreen, setActiveScreen] = useState("home");

  const filteredPasienList = pasienList.filter((pasien) =>
    pasien.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchPasien = async (token) => {
    if (!token) return;

    setIsLoading(true);
    try {
      const res = await fetch(
        "https://restful-api-bmc-production.up.railway.app/api/bidan/pasien",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      setPasienList(data.daftar_pasien || []);
    } catch (err) {
      console.log("❌ ERROR FETCH:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (token) {
          setUserToken(token);
          fetchPasien(token);
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        console.log("❌ ERROR LOAD:", e);
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleFormSuccess = () => {
    setModalVisible(false);
    fetchPasien(userToken);
  };

  const renderHomeContent = () => {
    if (isLoading)
      return (
        <ActivityIndicator
          size="large"
          color="#448AFF"
          style={{ marginTop: 50 }}
        />
      );

    if (filteredPasienList.length === 0)
      return <Text style={styles.emptyText}>Tidak ada pasien ditemukan.</Text>;

    return filteredPasienList.map((pasien, index) => (
      <PasienCard
        key={pasien.no_reg || `pasien-${index}`}
        pasien={pasien}
        onPress={() =>
          navigate("/home-catatan", {
            state: { partografId: pasien.partograf_id },
          })
        }
      />
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLogo}>
          <Image
            source={require("../../assets/Logo.png")}
            style={styles.logoStetoskop}
          />
          <View>
            <Text style={styles.headerTitle}>Ruang</Text>
            <Text style={[styles.headerTitle, { color: "#448AFF" }]}>
              Bunda
            </Text>
          </View>
        </View>
        <Ionicons name="notifications-outline" size={24} color="#333" />
      </View>

      {activeScreen === "home" && (
        <>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#999"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari nama pasien..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView style={styles.contentArea}>
            {renderHomeContent()}
          </ScrollView>
        </>
      )}

      {activeScreen === "profile" && (
        <ProfileScreen style={styles.contentArea} />
      )}

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveScreen("home")}
        >
          <Ionicons
            name="home"
            size={24}
            color={activeScreen === "home" ? "#448AFF" : "#999"}
          />
          <Text
            style={
              activeScreen === "home" ? styles.navTextActive : styles.navText
            }
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.chatButton}>
          <MaterialIcons name="chat-bubble" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={40} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveScreen("profile")}
        >
          <FontAwesome
            name={activeScreen === "profile" ? "user" : "user-o"}
            size={24}
            color={activeScreen === "profile" ? "#448AFF" : "#999"}
          />
          <Text
            style={
              activeScreen === "profile" ? styles.navTextActive : styles.navText
            }
          >
            Profil
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TambahPasienForm
          onClose={() => setModalVisible(false)}
          onSuccess={handleFormSuccess}
          token={userToken}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerLogo: { flexDirection: "row", alignItems: "center" },
  logoStetoskop: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    marginRight: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 10,
    paddingHorizontal: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#eee",
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 40 },
  contentArea: { flex: 1, paddingHorizontal: 20, marginTop: 10 },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#999",
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    elevation: 2,
  },
  cardInfo: { flex: 1, marginLeft: 15 },
  cardNama: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 4,
  },
  cardDetail: { fontSize: 14, color: "#555", marginTop: 4 },
  cardDateRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  badge: {
    position: "absolute",
    top: 10,
    right: 15,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  badgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "bold" },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 60,
    backgroundColor: "#FFFFFF",
    elevation: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  navItem: { alignItems: "center", flex: 1 },
  navText: { fontSize: 12, color: "#999" },
  navTextActive: { fontSize: 12, color: "#448AFF", fontWeight: "bold" },
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#448AFF",
    justifyContent: "center",
    alignItems: "center",
    bottom: 25,
    elevation: 5,
  },
  chatButton: {
    position: "absolute",
    right: 20,
    bottom: 70,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#448AFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
});