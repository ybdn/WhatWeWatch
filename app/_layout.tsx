import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
  <Stack.Screen name="register" />
  <Stack.Screen name="reset-password" />
      </Stack>
    </AuthProvider>
  );
}
