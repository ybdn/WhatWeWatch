import { Stack, usePathname, useRouter, Href } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";

export function Gate() {
  const { loading, user, profile, mfaPending } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Redirections d'onboarding selon l'état du compte
  if (!loading && user) {
    // MFA challenge prioritaire si en attente
    if (mfaPending && pathname !== "/mfa-challenge") {
      router.replace("/mfa-challenge" as Href);
      return null;
    }
    // 1. Email non confirmé -> verify-email
    if (user.emailConfirmed === false) {
      const allowed = [
        "/(onboarding)/verify-email",
        "/(auth)/login",
        "/(auth)/register",
        "/(auth)/reset-password",
      ];
      if (!allowed.includes(pathname)) {
        router.replace("/(onboarding)/verify-email");
      }
    } else if (profile && !profile.display_name) {
      // 2. Profil incomplet -> profile-completion
      const allowed = [
        "/(onboarding)/profile-completion",
        "/(auth)/login",
        "/(auth)/register",
        "/(auth)/reset-password",
        "/(onboarding)/verify-email",
      ];
      if (!allowed.includes(pathname)) {
        router.replace("/(onboarding)/profile-completion");
      }
    }
  }
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="mfa" />
      <Stack.Screen name="mfa-challenge" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Gate />
      </ToastProvider>
    </AuthProvider>
  );
}
