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
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  KeyboardAvoidingView // Added this import
} from "react-native";
import { Ionicons, FontAwesome, MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigate } from "react-router-native";

// ======================= MEDICAL THEME ==========================
const THEME = {
  bg: "#F4F6F8",       // Background Abu-abu Klinis
  primary: "#448AFF",  // Biru Utama
  accent: "#00897B",   // Teal
  cardBg: "#FFFFFF",
  textMain: "#263238", // Dark Blue Grey
  textSec: "#78909C",  // Abu-abu Teks
  border: "#ECEFF1",   // Border Halus
  inputBg: "#FAFAFA",  // Background Input
  danger: "#EF5350",   // Merah Error/Logout
  success: "#66BB6A"   // Hijau Sukses
};

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
      Alert.alert("Form Tidak Lengkap", "Harap isi semua kolom password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Validasi Gagal", "Password baru dan konfirmasi tidak cocok.");
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

      Alert.alert("Sukses", "Password berhasil diperbarui.");
      setPasswordModalVisible(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      Alert.alert("Gagal", error.message);
    } finally {
      setIsApiLoading(false);
    }
  };

  // 🔹 Update Username
  const handleChangeUsername = async () => {
    const trimmedName = newUsername.trim();
    if (!trimmedName) {
      Alert.alert("Validasi Gagal", "Username tidak boleh kosong.");
      return;
    }
    if (trimmedName === username) {
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
      Alert.alert("Sukses", "Username berhasil diperbarui.");
      setUsernameModalVisible(false);
    } catch (error) {
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
    label,
    placeholder
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          secureTextEntry={!showPassword}
          value={value}
          onChangeText={setValue}
          placeholderTextColor="#B0BEC5"
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={THEME.textSec}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  // 🔹 Logout
  const handleLogout = async () => {
    Alert.alert("Konfirmasi Logout", "Apakah Anda yakin ingin keluar dari sesi ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("userToken");
            await AsyncStorage.removeItem("userName");
            navigate("/", { replace: true });
          } catch (error) {
            Alert.alert("Error", "Gagal memproses logout.");
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <ScrollView style={[styles.container, style]} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Header Profil */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <FontAwesome5 name="user-nurse" size={40} color={THEME.primary} />
          </View>
          
          <View style={styles.profileInfo}>
            {isPageLoading ? (
              <ActivityIndicator size="small" color={THEME.primary} />
            ) : (
              <>
                <Text style={styles.profileName}>{username}</Text>
                <Text style={styles.profileRole}>Bidan Profesional</Text>
              </>
            )}
          </View>
          
          <TouchableOpacity style={styles.editBadge} onPress={() => setUsernameModalVisible(true)}>
             <MaterialIcons name="edit" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Menu Pengaturan */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>PENGATURAN AKUN</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setUsernameModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: "#E3F2FD" }]}>
              <Ionicons name="person" size={20} color={THEME.primary} />
            </View>
            <Text style={styles.menuText}>Ubah Username</Text>
            <MaterialIcons name="chevron-right" size={24} color={THEME.textSec} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setPasswordModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: "#E0F2F1" }]}>
              <Ionicons name="lock-closed" size={20} color={THEME.accent} />
            </View>
            <Text style={styles.menuText}>Ganti Password</Text>
            <MaterialIcons name="chevron-right" size={24} color={THEME.textSec} />
          </TouchableOpacity>
        </View>

        {/* Menu Lainnya (Logout) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>SESI</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: "#FFEBEE" }]}>
              <MaterialIcons name="logout" size={20} color={THEME.danger} />
            </View>
            <Text style={[styles.menuText, { color: THEME.danger }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* MODAL UBAH USERNAME */}
        <Modal
          visible={usernameModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setUsernameModalVisible(false)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ubah Username</Text>
                <TouchableOpacity onPress={() => setUsernameModalVisible(false)}>
                  <Ionicons name="close" size={24} color={THEME.textSec} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username Baru</Text>
                <TextInput
                  style={styles.simpleInput}
                  placeholder="Masukkan username baru"
                  value={newUsername}
                  onChangeText={setNewUsername}
                  autoCapitalize="none"
                  editable={!isApiLoading}
                />
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleChangeUsername}
                disabled={isApiLoading}
              >
                {isApiLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>SIMPAN PERUBAHAN</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* MODAL UBAH PASSWORD */}
        <Modal
          visible={passwordModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPasswordModalVisible(false)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ganti Password</Text>
                <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                  <Ionicons name="close" size={24} color={THEME.textSec} />
                </TouchableOpacity>
              </View>

              {renderPasswordInput(
                currentPassword,
                setCurrentPassword,
                showCurrentPassword,
                setShowCurrentPassword,
                "Password Saat Ini",
                "Masukkan password lama"
              )}
              
              {renderPasswordInput(
                newPassword,
                setNewPassword,
                showNewPassword,
                setShowNewPassword,
                "Password Baru",
                "Minimal 6 karakter"
              )}

              {renderPasswordInput(
                confirmPassword,
                setConfirmPassword,
                showConfirmPassword,
                setShowConfirmPassword,
                "Konfirmasi Password",
                "Ulangi password baru"
              )}

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleChangePassword}
                disabled={isApiLoading}
              >
                {isApiLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>UPDATE PASSWORD</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}

// ======================= STYLES ==========================
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.bg },
  container: { flex: 1, padding: 20 },

  // PROFILE HEADER CARD
  profileCard: {
    backgroundColor: "#FFF", borderRadius: 16, padding: 20,
    flexDirection: "row", alignItems: "center", marginBottom: 24,
    borderWidth: 1, borderColor: THEME.border,
    shadowColor: "#000", shadowOffset: {width:0, height:2}, shadowOpacity: 0.05, elevation: 2
  },
  avatarContainer: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: "#E3F2FD",
    justifyContent: "center", alignItems: "center", marginRight: 16
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: "bold", color: THEME.textMain, marginBottom: 4 },
  profileRole: { fontSize: 14, color: THEME.textSec },
  editBadge: {
    backgroundColor: THEME.primary, width: 28, height: 28, borderRadius: 14,
    justifyContent: "center", alignItems: "center", position: 'absolute', top: 16, right: 16
  },

  // MENU SECTIONS
  sectionContainer: {
    backgroundColor: "#FFF", borderRadius: 16, paddingVertical: 8, marginBottom: 20,
    borderWidth: 1, borderColor: THEME.border, overflow: 'hidden'
  },
  sectionTitle: {
    fontSize: 12, fontWeight: "700", color: THEME.textSec, marginLeft: 20, marginTop: 12, marginBottom: 8, letterSpacing: 1
  },
  menuItem: {
    flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 20,
    backgroundColor: "#FFF"
  },
  menuIconBox: {
    width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 16
  },
  menuText: { flex: 1, fontSize: 15, fontWeight: "600", color: THEME.textMain },
  divider: { height: 1, backgroundColor: "#F5F5F5", marginLeft: 72 },

  // MODAL STYLES
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20
  },
  modalCard: {
    backgroundColor: "#FFF", borderRadius: 16, padding: 24,
    shadowColor: "#000", shadowOffset: {width:0, height:4}, shadowOpacity: 0.2, elevation: 10
  },
  modalHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: THEME.textMain },

  // INPUT STYLES
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: "600", color: THEME.textSec, marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: THEME.inputBg, borderRadius: 10, borderWidth: 1, borderColor: THEME.border,
    paddingHorizontal: 14
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: THEME.textMain },
  simpleInput: {
    backgroundColor: THEME.inputBg, borderRadius: 10, borderWidth: 1, borderColor: THEME.border,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: THEME.textMain
  },
  eyeIcon: { padding: 4 },

  // BUTTON STYLES
  primaryButton: {
    backgroundColor: THEME.primary, borderRadius: 12, paddingVertical: 14,
    alignItems: "center", marginTop: 10,
    shadowColor: THEME.primary, shadowOffset: {width:0, height:4}, shadowOpacity: 0.2, elevation: 4
  },
  primaryButtonText: { color: "#FFF", fontSize: 14, fontWeight: "bold", letterSpacing: 0.5 },
});