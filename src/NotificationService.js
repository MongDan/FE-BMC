import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// 1. Handler (Biar muncul pop-up di layar)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 2. Izin & Channel
export async function registerForPushNotificationsAsync() {
  try {
    if (Platform.OS === "android") {
      // Channel ini PENTING. ID-nya "default".
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        sound: true,
      });
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
  } catch (error) {
    console.log("Error izin:", error);
  }
}

// 3. JADWALKAN RUTIN (PAKAI DATE + CHANNEL ID)
export async function scheduleRutinReminder(namaPasien) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const triggerDate = new Date();
    triggerDate.setSeconds(triggerDate.getSeconds() + 20); // 20 Detik dari sekarang

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Waktunya Pantau Rutin",
        body: `Sudah 30 menit. Cek DJJ & Nadi Ibu ${namaPasien} sekarang.`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX, // Paksa Prioritas
      },
      trigger: {
        date: triggerDate, // Pake Waktu Spesifik
        channelId: "default", // <--- WAJIB DITAMBAH BIAR BUNYI KENCENG
      },
    });

    console.log("Jadwal Rutin (20s):", triggerDate.toLocaleTimeString());
  } catch (error) {
    console.log("Gagal jadwal rutin:", error);
  }
}

// 4. JADWALKAN VT (PAKAI DATE + CHANNEL ID)
export async function scheduleVTReminder(namaPasien) {
  try {
    const triggerDate = new Date();
    triggerDate.setSeconds(triggerDate.getSeconds() + 30); // 30 Detik

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "👩‍⚕️ Waktunya Periksa Dalam",
        body: `Sudah 4 jam. Cek Pembukaan & Molase Ibu ${namaPasien}.`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: {
        date: triggerDate,
        channelId: "default", // <--- WAJIB DITAMBAH
      },
    });

    console.log("Jadwal VT (30s):", triggerDate.toLocaleTimeString());
  } catch (error) {
    console.log("Gagal jadwal VT:", error);
  }
}

export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
