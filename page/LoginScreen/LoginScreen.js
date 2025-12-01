import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal
} from "react-native";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigate } from "react-router-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false); // === STATE UNTUK KEGAGALAN ===
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("Terjadi kesalahan.");

  const closeErrorModal = () => {
    setShowError(false);
  };
  const navigate = useNavigate();

  const handleLogin = async () => {
    // --- Ganti alert() dengan Modal Error ---
    if (!username || !password) {
      setErrorMessage("Username dan Password tidak boleh kosong.");
      setShowError(true);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        "https://restful-api-bmc-production.up.railway.app/api/login-bidan",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({ username, password })
        }
      );

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Server mengembalikan response tidak valid.");
      }

      if (!response.ok) {
        throw new Error(data.message || "Username atau Password salah.");
      }

      setIsLoading(false);

      if (data.token) {
        await AsyncStorage.setItem("userToken", data.token);
      } else {
        throw new Error("Token tidak ditemukan di server.");
      }

      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        navigate("/home");
      }, 1500);
    } catch (error) {
      // --- JIKA GAGAL: Menggunakan Modal Error ---
      setIsLoading(false); // Pastikan pesan error selalu string yang valid
      const message = error.message
        ? String(error.message)
        : "Gagal terhubung ke server. Periksa koneksi internet Anda.";
      setErrorMessage(message);
      setShowError(true);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccess}
        onRequestClose={() => {}}
      >
        <View style={styles.successOverlay}>
          <View style={styles.successBox}>
            <View style={styles.iconCircle}>
              <FontAwesome name="check" size={40} color="#4CAF50" />
            </View>
            <Text style={styles.successTitle}>Login Berhasil! 🎉</Text>
            <Text style={styles.successSubtitle}>
              Mengalihkan ke beranda...
            </Text>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={showError}
        onRequestClose={closeErrorModal}
      >
        <View style={styles.successOverlay}>
          <View style={styles.errorBox}>
            <View style={styles.iconCircleError}>
              <FontAwesome name="times" size={40} color="#D32F2F" />
            </View>

            <Text style={styles.errorTitle}>Login Gagal</Text>
            <Text style={styles.errorSubtitle}>{errorMessage}</Text>
            <TouchableOpacity
              onPress={closeErrorModal}
              style={styles.errorButton}
            >
              <Text style={styles.errorButtonText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Image source={require("../../assets/Logo.png")} style={styles.logo} />

        <View style={styles.textBlock}>
          <Text style={styles.title}>Ruang</Text>
          <Text style={styles.subtitle}>Bunda</Text>
        </View>
      </View>

      <View style={styles.imageWrapper}>
        <Image
          source={require("../../assets/Dokter.webp")}
          style={styles.doctorImage}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.loginCard}>
          <Text style={styles.loginTitle}>Login</Text>
          <Text style={styles.label}>Username:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              placeholderTextColor="#ccc"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <FontAwesome
              name="user"
              size={20}
              color="#fff"
              style={styles.icon}
            />
          </View>
          <Text style={styles.label}>Password:</Text>
          <View style={styles.inputContainer}>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#ccc"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <FontAwesome
                name={showPassword ? "eye-slash" : "eye"}
                size={20}
                color="#fff"
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F6F2",
    alignItems: "center",
    justifyContent: "flex-end"
  },

  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center"
  },
  successBox: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10
  },
  iconCircle: {
    width: 80,
    height: 80,
    backgroundColor: "#E8F5E9",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8
  },
  successSubtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center"
  },

  errorBox: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10
  },
  iconCircleError: {
    width: 80,
    height: 80,
    backgroundColor: "#FFEBEE", // Merah sangat muda (soft)
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#D32F2F", // Merah gelap
    marginBottom: 8
  },
  errorSubtitle: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 20
  },
  closeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 5
  },
  errorButton: {
    backgroundColor: "#D32F2F", // Tombol berwarna merah
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 10
  },
  errorButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold"
  }, // ========================== // === UTAMA STYLES (Existing) // ==========================

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 50,
    marginLeft: 20,
    marginBottom: 10,
    alignSelf: "flex-start"
  },
  logo: {
    width: 55,
    height: 55,
    resizeMode: "contain",
    marginRight: 6
  },
  textBlock: { flexDirection: "column" },
  title: { fontSize: 22, fontWeight: "bold", color: "#000" },
  subtitle: { fontSize: 22, fontWeight: "bold", color: "#448AFF" },

  imageWrapper: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    alignItems: "center"
  },
  doctorImage: {
    width: "100%",
    height: 500,
    resizeMode: "contain"
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    width: "100%"
  },
  loginCard: {
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    width: "100%",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    paddingVertical: 70,
    paddingHorizontal: 25,
    alignItems: "center",
    elevation: 4
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
    marginTop: -30
  },

  label: {
    alignSelf: "flex-start",
    marginTop: 10,
    marginBottom: -10,
    fontSize: 14,
    color: "#000"
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#448AFF",
    borderRadius: 25,
    paddingHorizontal: 15,
    marginTop: 20,
    width: "97%",
    height: 45
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 14
  },
  icon: { marginLeft: 10 },

  loginButton: {
    backgroundColor: "#448AFF",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 45,
    marginTop: 20
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold"
  }
});
