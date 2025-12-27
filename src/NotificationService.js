import * as Notifications from "expo-notifications";
import { Platform, Alert } from "react-native";
// 👇 SAYA TAMBAHKAN IMPORT INI AGAR TIDAK CRASH SAAT MINTA TOKEN 👇
import * as Device from "expo-device";
import Constants from "expo-constants";

// 1. Config Handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 2. Permission & Channel
export async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === "android") {
    // Channel khusus Panic Button (Darurat)
    await Notifications.setNotificationChannelAsync("emergency-alert", {
      name: "Emergency Alert",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });

    // Channel Pengingat Partograf (Tetap ada sesuai kode lama kamu)
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

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      // Alert.alert("Izin Ditolak", "Notifikasi tidak akan muncul.");
      return;
    }

    // Ambil Project ID
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    try {
      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      token = pushTokenData.data;
      console.log("Expo Push Token:", token);
    } catch (e) {
      console.log("Error ambil token:", e);
    }
  } else {
    // Alert.alert("Info", "Gunakan HP Fisik untuk testing notifikasi.");
  }

  return token;
}

// 3. Logic Hitung Detik (SAMA PERSIS DENGAN FILE KAMU)
function getSecondsDiff(waktuCatat, minutesToAdd) {
  const inputDate = new Date(waktuCatat);
  const targetDate = new Date(inputDate.getTime() + minutesToAdd * 60000);
  const now = new Date();
  const diff = Math.round((targetDate.getTime() - now.getTime()) / 1000);
  return { diff, targetDate };
}

// 4. JADWAL RUTIN (SAMA PERSIS DENGAN FILE KAMU)
export async function scheduleRutinReminder(namaPasien, waktuCatat) {
  await registerForPushNotificationsAsync();
  const { diff, targetDate } = getSecondsDiff(waktuCatat, 1); // Balik ke 30 menit

  if (diff <= 0) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Waktunya Pantau Rutin! ⏰",
      body: `Cek DJJ & Nadi ${namaPasien}. (Jadwal: ${targetDate.toLocaleTimeString()})`,
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: diff,
      channelId: "partograf-reminders-final",
      repeats: false,
    },
  });
}

// 5. JADWAL VT (SAMA PERSIS DENGAN FILE KAMU)
export async function scheduleVTReminder(namaPasien, waktuCatat) {
  await registerForPushNotificationsAsync();
  const { diff, targetDate } = getSecondsDiff(waktuCatat, 2); // Balik ke 4 jam

  if (diff <= 0) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Waktunya Periksa Dalam! 🏥",
      body: `Cek pembukaan ${namaPasien}. (Jadwal: ${targetDate.toLocaleTimeString()})`,
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: diff,
      channelId: "partograf-reminders-final",
      repeats: false,
    },
  });
}

export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
