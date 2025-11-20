import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigate } from "react-router-native";

export default function ProfileScreen({ style }) {
  const navigate = useNavigate();

  const [username, setUsername] = useState("Memuat...");
  const [userToken, setUserToken] = useState(null);

  // Username Modal
  const [usernameModalVisible, setUsernameModalVisible] = useState(false);
  const [newUsername, setNewUsername] = useState("");

  // Password Modal
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isApiLoading, setIsApiLoading] = useState(false);

  // 🔹 Load user data dari API
  const loadUserData = async () => {
    setIsPageLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      setUserToken(token);

      if (!token) throw new Error("Token tidak ditemukan");

      const res = await fetch("https://restful-api-bmc-production.up.railway.app/api/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Gagal load profil");

      const fullUsername = data.data.username;
      setUsername(fullUsername);
      setNewUsername(fullUsername);

      await AsyncStorage.setItem("userName", fullUsername);
    } catch (error) {
      console.log("Gagal load data profil:", error);
      setUsername("Gagal Memuat");
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // 🔹 Update Password
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Harap isi semua field password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Password baru dan konfirmasi tidak cocok.");
      return;
    }

    setIsApiLoading(true);
    try {
      const body = JSON.stringify({
        password_lama: currentPassword,
        password_baru: newPassword,
        password_baru_confirmation: confirmPassword
      });

      const response = await fetch(
        "https://restful-api-bmc-production.up.railway.app/api/profile/ubah-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${userToken}`
          },
          body
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengubah password.");
      }

      Alert.alert("Sukses", data.message || "Password berhasil diubah.");
      setPasswordModalVisible(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      console.error("Gagal ganti password:", error);
      Alert.alert("Gagal", error.message);
    } finally {
      setIsApiLoading(false);
    }
  };

  // 🔹 Update Username
  const handleChangeUsername = async () => {
    const trimmedName = newUsername.trim();
    if (!trimmedName) {
      Alert.alert("Error", "Username tidak boleh kosong.");
      return;
    }
    if (trimmedName === username) {
      Alert.alert(
        "Info",
        "Username sama dengan yang lama, tidak perlu diubah."
      );
      setUsernameModalVisible(false);
      return;
    }

    setIsApiLoading(true);
    try {
      const body = JSON.stringify({ username: trimmedName });

      const response = await fetch("https://restful-api-bmc-production.up.railway.app/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${userToken}`
        },
        body
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengubah username.");
      }

      await AsyncStorage.setItem("userName", trimmedName);
      setUsername(trimmedName);
      Alert.alert("Sukses", data.message || "Username berhasil diubah.");
      setUsernameModalVisible(false);
    } catch (error) {
      console.error("Gagal ganti username:", error);
      Alert.alert("Gagal", error.message);
    } finally {
      setIsApiLoading(false);
    }
  };

  // 🔹 Render input password dengan toggle show/hide
  const renderPasswordInput = (
    value,
    setValue,
    showPassword,
    setShowPassword,
    placeholder
  ) => (
    <View style={styles.inputWrapper}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        secureTextEntry={!showPassword}
        value={value}
        onChangeText={setValue}
        placeholderTextColor="#888"
      />
      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
        <Ionicons
          name={showPassword ? "eye" : "eye-off"}
          size={20}
          color="#777"
        />
      </TouchableOpacity>
    </View>
  );

  // 🔹 Logout
  const handleLogout = async () => {
    Alert.alert("Logout", "Apakah Anda yakin ingin keluar?", [
      { text: "Tidak", style: "cancel" },
      {
        text: "Ya",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("userToken");
            await AsyncStorage.removeItem("userName");
            navigate("/", { replace: true });
          } catch (error) {
            Alert.alert("Error", "Terjadi kesalahan saat logout.");
          }
        }
      }
    ]);
  };

  return (
    <ScrollView style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.profileHeader}>
        <FontAwesome name="user-circle" size={80} color="#bdbdbd" />
        {isPageLoading ? (
          <ActivityIndicator color="#333" style={{ marginTop: 10 }} />
        ) : (
          <Text style={styles.username}>{username}</Text>
        )}
      </View>

      {/* Menu */}
      <View style={styles.menuContainer}>
        <Text style={styles.menuTitle}>Akun</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setUsernameModalVisible(true)}
        >
          <Ionicons name="person-outline" size={22} color="#448AFF" />
          <Text style={styles.menuItemText}>Ubah Username</Text>
          <Ionicons name="chevron-forward-outline" size={22} color="#bdbdbd" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setPasswordModalVisible(true)}
        >
          <Ionicons name="lock-closed-outline" size={22} color="#448AFF" />
          <Text style={styles.menuItemText}>Ubah Password</Text>
          <Ionicons name="chevron-forward-outline" size={22} color="#bdbdbd" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { marginTop: 20 }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#FF5252" />
          <Text style={[styles.menuItemText, { color: "#FF5252" }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal Username */}
      <Modal
        visible={usernameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUsernameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ubah Username</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Username Baru"
                value={newUsername}
                onChangeText={setNewUsername}
                editable={!isApiLoading}
              />
            </View>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleChangeUsername}
              disabled={isApiLoading}
            >
              {isApiLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Simpan</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setUsernameModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Password */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ubah Password</Text>
            {renderPasswordInput(
              currentPassword,
              setCurrentPassword,
              showCurrentPassword,
              setShowCurrentPassword,
              "Password Saat Ini"
            )}
            {renderPasswordInput(
              newPassword,
              setNewPassword,
              showNewPassword,
              setShowNewPassword,
              "Password Baru"
            )}
            {renderPasswordInput(
              confirmPassword,
              setConfirmPassword,
              showConfirmPassword,
              setShowConfirmPassword,
              "Konfirmasi Password Baru"
            )}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleChangePassword}
              disabled={isApiLoading}
            >
              {isApiLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setPasswordModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F3F5" },
  profileHeader: {
    backgroundColor: "#fff",
    paddingVertical: 40,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5
  },
  username: { fontSize: 22, fontWeight: "bold", color: "#333", marginTop: 10 },
  menuContainer: { marginTop: 20, marginHorizontal: 20 },
  menuTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#999",
    marginBottom: 10,
    textTransform: "uppercase"
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3
  },
  menuItemText: { flex: 1, marginLeft: 15, fontSize: 16, color: "#333" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    width: "100%",
    alignItems: "center"
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#F2F3F5",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 12,
    marginBottom: 10,
    height: 45
  },
  input: { flex: 1, fontSize: 14, height: "100%" },
  saveButton: {
    backgroundColor: "#448AFF",
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: "center",
    width: "100%",
    marginTop: 10
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  cancelButton: { marginTop: 10, padding: 10 },
  cancelButtonText: { color: "#999", fontSize: 14 }
});
