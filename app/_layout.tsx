import { Stack, usePathname, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";

function Gate() {
  const { loading, user, profile } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Redirections d'onboarding selon l'état du compte
  if (!loading && user) {
    // 1. Email non confirmé -> verify-email
    if (user.emailConfirmed === false) {
      const allowed = [
        "/verify-email",
        "/login",
        "/register",
        "/reset-password",
      ];
      if (!allowed.includes(pathname)) {
        router.replace("/verify-email");
      }
    } else if (profile && !profile.display_name) {
      // 2. Profil incomplet -> profile-completion
      const allowed = [
        "/profile-completion",
        "/login",
        "/register",
        "/reset-password",
        "/verify-email",
      ];
      if (!allowed.includes(pathname)) {
        router.replace("/profile-completion");
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
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="profile-completion" />
      <Stack.Screen name="verify-email" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
