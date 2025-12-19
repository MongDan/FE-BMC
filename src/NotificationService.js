import * as Notifications from "expo-notifications";
import { Platform, Alert } from "react-native";

// 1. Config Handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 2. Permission & Channel (SUDAH DIPERBAIKI)
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    // KITA SAMAKAN ID-NYA JADI: 'partograf-reminders-final'
    await Notifications.setNotificationChannelAsync(
      "partograf-reminders-final",
      {
        name: "Pengingat Partograf",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      }
    );
  }

  // --- INI YANG KEMARIN HILANG, WAJIB ADA BIAR POPUP MUNCUL ---
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.log("Izin notifikasi ditolak user!");
    return;
  }
}

// 3. Logic Hitung Detik
function getSecondsDiff(waktuCatat, minutesToAdd) {
  const inputDate = new Date(waktuCatat);
  const targetDate = new Date(inputDate.getTime() + minutesToAdd * 60000);
  const now = new Date();

  // Hitung selisih dalam detik (Bulat)
  const diff = Math.round((targetDate.getTime() - now.getTime()) / 1000);

  return { diff, targetDate };
}

// 4. JADWAL RUTIN (30 Menit)
export async function scheduleRutinReminder(namaPasien, waktuCatat) {
  await registerForPushNotificationsAsync();
  await Notifications.cancelAllScheduledNotificationsAsync();

  // SAYA KEMBALIKAN KE 30 MENIT (Sesuai request)
  const { diff, targetDate } = getSecondsDiff(waktuCatat, 1);

  // DEBUG LOG
  console.log(
    `Target Rutin: ${targetDate.toLocaleTimeString()} | Sisa Detik: ${diff}`
  );

  if (diff <= 0) {
    Alert.alert("Gagal", "Waktu sudah lewat.");
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Waktunya Pantau Rutin! ⏰",
      body: `Cek DJJ & Nadi ${namaPasien}. (Jadwal: ${targetDate.toLocaleTimeString()})`,
      sound: "default",
    },
    trigger: {
      // WAJIB ADA TYPE INI AGAR TIDAK ERROR
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: diff,
      channelId: "partograf-reminders-final", // SUDAH COCOK DENGAN ATAS
      repeats: false,
    },
  });
}

// 5. JADWAL VT (4 Jam = 240 Menit)
export async function scheduleVTReminder(namaPasien, waktuCatat) {
  await registerForPushNotificationsAsync();

  // SAYA KEMBALIKAN KE 240 MENIT (4 Jam)
  const { diff, targetDate } = getSecondsDiff(waktuCatat, 2);

  console.log(
    `Target VT: ${targetDate.toLocaleTimeString()} | Sisa Detik: ${diff}`
  );

  if (diff <= 0) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Waktunya Periksa Dalam! 🏥",
      body: `Cek pembukaan ${namaPasien}. (Jadwal: ${targetDate.toLocaleTimeString()})`,
      sound: "default",
    },
    trigger: {
      // WAJIB ADA TYPE INI AGAR TIDAK ERROR
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: diff,
      channelId: "partograf-reminders-final", // SUDAH COCOK DENGAN ATAS
      repeats: false,
    },
  });
}
