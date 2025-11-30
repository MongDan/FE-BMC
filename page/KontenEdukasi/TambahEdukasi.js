import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    Alert,
    ActivityIndicator,
    StatusBar,
    RefreshControl,
    Modal // 👈 Import Modal
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigate } from "react-router-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons"; // 👈 Tambahkan icon

// ===== THEME CONFIGURATION =====
const COLORS = {
    primary: "#1976D2",
    primaryDark: "#0D47A1",
    accent: "#64B5F6",
    secondary: "#BBDEFB",
    background: "#F8F9FA",
    white: "#FFFFFF",
    textMain: "#263238",
    textSec: "#607D8B",
    border: "#E0E0E0",
    danger: "#E53935",
    success: "#1E88E5", 
    inputBg: "#FFFFFF"
};

export default function TambahEdukasi() {
    const navigate = useNavigate();

    // State Data
    const [judul, setJudul] = useState("");
    const [isi, setIsi] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [kontenList, setKontenList] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // State UI
    const [activeTab, setActiveTab] = useState("create");
    const [focusedInput, setFocusedInput] = useState(null);

    // 💡 MODAL STATES
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const closeModal = () => {
        setShowError(false);
        setShowSuccess(false);
    };

    // ===== Fetch List Konten Edukasi =====
    const fetchKonten = async () => {
        setRefreshing(true);
        try {
            const res = await fetch(
                "https://restful-api-bmc-production.up.railway.app/api/konten-edukasi"
            );
            const data = await res.json();
            if (res.ok) {
                setKontenList(data.data || []);
            }
        } catch (err) {
            console.log(err);
        } finally {
            setRefreshing(false);
        }
    };

    // Fetch saat halaman pertama kali dirender
    useEffect(() => {
        fetchKonten();
    }, []);

    // Re-fetch saat tab "list" dipilih
    useEffect(() => {
        if (activeTab === "list") {
            fetchKonten();
        }
    }, [activeTab]);

    // ===== Tambah Konten =====
    const handleSubmit = async () => {
        if (!judul || !isi) {
            setErrorMessage("Judul dan isi materi tidak boleh kosong.");
            setShowError(true);
            return;
        }

        setIsLoading(true);
        try {
            const token = await AsyncStorage.getItem("userToken");
            const res = await fetch(
                "https://restful-api-bmc-production.up.railway.app/api/konten-edukasi",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        accept: "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ judul_konten: judul, isi_konten: isi })
                }
            );

            const data = await res.json();

            if (res.ok) {
                // 💡 Ganti Alert Sukses
                setSuccessMessage("Materi edukasi berhasil diterbitkan!");
                setShowSuccess(true);
                
                // Reset form setelah sukses
                setJudul("");
                setIsi("");
                setActiveTab("list");
                fetchKonten();
                
            } else {
                // 💡 Ganti Alert Gagal API
                setErrorMessage(data.message || "Terjadi kesalahan saat menerbitkan materi.");
                setShowError(true);
            }
        } catch (err) {
            // 💡 Ganti Alert Gagal Koneksi
            setErrorMessage("Gagal terhubung ke server. Periksa koneksi internet Anda.");
            setShowError(true);
        } finally {
            setIsLoading(false);
        }
    };

    // --- UI COMPONENTS ---
    // --- HEADER DENGAN BACK BUTTON ---
    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* Tombol Back */}
            <TouchableOpacity
                onPress={() => navigate("/home")}
                style={{
                    marginRight: 12,
                    width: 40
                }}
                activeOpacity={0.7}
            >
                {/* Menggunakan ikon MaterialIcons untuk konsistensi */}
                <MaterialIcons name="arrow-back" size={28} color={COLORS.white} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
                <Text style={styles.headerGreeting}>Halo, Bidan</Text>
                <Text style={styles.headerTitle}>Pusat Edukasi</Text>
            </View>

            <View style={styles.headerBadge}>
                <Text style={{ fontSize: 20 }}>🩺</Text>
            </View>
        </View>
    );

    const renderTabs = () => (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[styles.tabButton, activeTab === "create" && styles.tabActive]}
                onPress={() => setActiveTab("create")}
                activeOpacity={0.7}
            >
                <Text
                    style={[
                        styles.tabText,
                        activeTab === "create"
                            ? styles.tabTextActive
                            : styles.tabTextInactive
                    ]}
                >
                    + Buat Baru
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tabButton, activeTab === "list" && styles.tabActive]}
                onPress={() => setActiveTab("list")}
                activeOpacity={0.7}
            >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === "list"
                                ? styles.tabTextActive
                                : styles.tabTextInactive
                        ]}
                    >
                        Daftar Materi
                    </Text>
                    {kontenList.length > 0 && (
                        <View style={styles.badgeCount}>
                            <Text style={styles.badgeText}>{kontenList.length}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );

    const renderCreateForm = () => (
        <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Publikasi Edukasi Pasien</Text>
            <Text style={styles.formSubtitle}>
                Bagikan informasi kesehatan yang valid dan bermanfaat.
            </Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Judul Topik</Text>
                <TextInput
                    style={[
                        styles.input,
                        focusedInput === "judul" && styles.inputFocused
                    ]}
                    placeholder="Misal: Persiapan Persalinan"
                    value={judul}
                    onChangeText={setJudul}
                    onFocus={() => setFocusedInput("judul")}
                    onBlur={() => setFocusedInput(null)}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Materi Lengkap</Text>
                <TextInput
                    style={[
                        styles.input,
                        styles.textArea,
                        focusedInput === "isi" && styles.inputFocused
                    ]}
                    placeholder="Tuliskan detail edukasi..."
                    value={isi}
                    onChangeText={setIsi}
                    multiline
                    textAlignVertical="top"
                    onFocus={() => setFocusedInput("isi")}
                    onBlur={() => setFocusedInput(null)}
                />
            </View>

            <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <Text style={styles.submitBtnText}>TERBITKAN MATERI</Text>
                )}
            </TouchableOpacity>
        </View>
    );

    const renderListItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.cardIconContainer}>
                    <Text>📄</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.cardTitle}>{item.judul_konten}</Text>
                    <Text style={styles.cardId}>ID: {item.id}</Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <Text style={styles.cardContent} numberOfLines={2}>
                    {item.isi_konten}
                </Text>
            </View>

            <View style={styles.cardFooter}>
                <TouchableOpacity
                    style={styles.actionBtnDetail}
                    onPress={() =>
                        navigate("/lihat-konten", { state: { kontenData: item } })
                    }
                >
                    <Text style={styles.detailText}>BACA SELENGKAPNYA →</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

            {/* ================= MODAL ERROR ================= */}
            <Modal
                visible={showError}
                transparent
                animationType="fade"
                onRequestClose={closeModal}
            >
                <View style={styles.feedbackOverlay}>
                    <View style={styles.feedbackCardError}>
                        <View style={styles.feedbackIconBoxError}>
                            <MaterialIcons name="warning" size={40} color={COLORS.danger} />
                        </View>
                        <Text style={styles.feedbackTitleError}>Perhatian!</Text>
                        <Text style={styles.feedbackSubtitle}>{errorMessage}</Text>
                        <TouchableOpacity onPress={closeModal} style={styles.feedbackButtonError}>
                            <Text style={styles.feedbackButtonText}>Tutup</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            
            {/* ================= MODAL SUCCESS ================= */}
            <Modal
                visible={showSuccess}
                transparent
                animationType="fade"
                onRequestClose={closeModal}
            >
                <View style={styles.feedbackOverlay}>
                    <View style={styles.feedbackCardSuccess}>
                        <View style={styles.feedbackIconBoxSuccess}>
                            <Ionicons name="checkmark-circle-outline" size={40} color={COLORS.success} />
                        </View>
                        <Text style={styles.feedbackTitleSuccess}>Berhasil!</Text>
                        <Text style={styles.feedbackSubtitle}>{successMessage}</Text>
                        <TouchableOpacity onPress={closeModal} style={styles.feedbackButtonSuccess}>
                            <Text style={styles.feedbackButtonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            
            {renderHeader()}
            {renderTabs()}
            <View style={styles.contentContainer}>
                {activeTab === "create" ? (
                    <View style={{ flex: 1, padding: 20 }}>{renderCreateForm()}</View>
                ) : (
                    <FlatList
                        data={kontenList}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderListItem}
                        contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={fetchKonten}
                                colors={[COLORS.primary]}
                            />
                        }
                        ListEmptyComponent={
                            !refreshing && (
                                <View style={styles.emptyState}>
                                    <Text style={{ fontSize: 40, marginBottom: 10 }}>📭</Text>
                                    <Text style={styles.emptyText}>
                                        Belum ada materi edukasi.
                                    </Text>
                                    <Text style={styles.emptySubText}>
                                        Tekan tab 'Buat Baru' untuk mulai.
                                    </Text>
                                </View>
                            )
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // SAFE AREA
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background
    },

    // HEADER
    headerContainer: {
        backgroundColor: COLORS.primary,
        padding: 24,
        paddingBottom: 30,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    headerGreeting: {
        color: COLORS.accent,
        fontSize: 14,
        fontWeight: "600"
    },
    headerTitle: {
        color: COLORS.white,
        fontSize: 24,
        fontWeight: "bold"
    },
    headerBadge: {
        backgroundColor: "rgba(255,255,255,0.2)",
        padding: 10,
        borderRadius: 12
    },

    // TABS
    tabContainer: {
        flexDirection: "row",
        backgroundColor: COLORS.white,
        marginHorizontal: 20,
        marginTop: -20,
        borderRadius: 12,
        padding: 4,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10
    },
    tabActive: {
        backgroundColor: COLORS.secondary
    },
    tabText: {
        fontWeight: "600",
        fontSize: 14
    },
    tabTextActive: {
        color: COLORS.primaryDark
    },
    tabTextInactive: {
        color: COLORS.textSec
    },
    badgeCount: {
        backgroundColor: COLORS.danger,
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 1,
        marginLeft: 6
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontWeight: "bold"
    },

    // CONTENT CONTAINER
    contentContainer: {
        flex: 1
    },

    // FORM
    formContainer: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05
    },
    formTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginBottom: 4
    },
    formSubtitle: {
        fontSize: 13,
        color: COLORS.textSec,
        marginBottom: 20
    },
    inputGroup: {
        marginBottom: 16
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.textMain,
        marginBottom: 8
    },
    input: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 10,
        padding: 14,
        fontSize: 15,
        color: COLORS.textMain
    },
    inputFocused: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.white,
        borderWidth: 1.5
    },
    textArea: {
        height: 140
    },
    submitBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10,
        elevation: 3,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3
    },
    submitBtnText: {
        color: COLORS.white,
        fontWeight: "bold",
        fontSize: 15,
        letterSpacing: 1
    },

    // CARD
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        borderWidth: 1,
        borderColor: "#F0F0F0"
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 12
    },
    cardIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#E0F2F1",
        justifyContent: "center",
        alignItems: "center"
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
        flexWrap: "wrap"
    },
    cardId: {
        fontSize: 11,
        color: COLORS.textSec,
        marginTop: 2
    },
    cardBody: {
        backgroundColor: "#FAFAFA",
        padding: 12,
        borderRadius: 8,
        marginBottom: 12
    },
    cardContent: {
        fontSize: 14,
        color: COLORS.textSec,
        lineHeight: 20
    },
    cardFooter: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#F5F5F5",
        paddingTop: 10
    },
    actionBtnDetail: {
        backgroundColor: COLORS.secondary,
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        width: "100%"
    },
    detailText: {
        color: COLORS.primaryDark,
        fontSize: 13,
        fontWeight: "700",
        letterSpacing: 0.5
    },

    // EMPTY STATE
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 60,
        opacity: 0.6
    },
    emptyText: {
        fontSize: 16,
        fontWeight: "bold",
        color: COLORS.textMain,
        marginTop: 10
    },
    emptySubText: {
        fontSize: 14,
        color: COLORS.textSec,
        marginTop: 4
    },
    
    // ================= MODAL FEEDBACK STYLES =================
    feedbackOverlay: {
        flex: 1, 
        backgroundColor: "rgba(0,0,0,0.5)", 
        justifyContent: "center", 
        alignItems: "center"
    },
    // Modal Success
    feedbackCardSuccess: {
        width: "85%", 
        backgroundColor: COLORS.white, 
        borderRadius: 16, 
        padding: 30, 
        alignItems: "center",
        shadowColor: COLORS.success, 
        shadowOffset: {width:0, height:4}, 
        shadowOpacity: 0.3, 
        elevation: 10
    },
    feedbackIconBoxSuccess: {
        width: 70, 
        height: 70, 
        borderRadius: 35, 
        backgroundColor: "#E3F2FD", // Biru sangat muda
        justifyContent: "center", 
        alignItems: "center", 
        marginBottom: 20
    },
    feedbackTitleSuccess: { 
        fontSize: 20, 
        fontWeight: "bold", 
        color: COLORS.primaryDark, 
        marginBottom: 8 
    },
    feedbackButtonSuccess: {
        backgroundColor: COLORS.primary, 
        borderRadius: 10, 
        paddingVertical: 10, 
        paddingHorizontal: 30
    },
    // Modal Error
    feedbackCardError: {
        width: "85%", 
        backgroundColor: COLORS.white, 
        borderRadius: 16, 
        padding: 30, 
        alignItems: "center",
        shadowColor: COLORS.danger, 
        shadowOffset: {width:0, height:4}, 
        shadowOpacity: 0.3, 
        elevation: 10
    },
    feedbackIconBoxError: {
        width: 70, 
        height: 70, 
        borderRadius: 35, 
        backgroundColor: "#FFEBEE", // Merah sangat muda
        justifyContent: "center", 
        alignItems: "center", 
        marginBottom: 20
    },
    feedbackTitleError: { 
        fontSize: 20, 
        fontWeight: "bold", 
        color: COLORS.danger, 
        marginBottom: 8 
    },
    feedbackButtonError: {
        backgroundColor: COLORS.danger, 
        borderRadius: 10, 
        paddingVertical: 10, 
        paddingHorizontal: 30
    },
    // General Feedback Text
    feedbackSubtitle: { 
        fontSize: 14, 
        color: COLORS.textMain, 
        textAlign: "center", 
        marginBottom: 20 
    },
    feedbackButtonText: { 
        color: COLORS.white, 
        fontSize: 16, 
        fontWeight: "bold" 
    }
});