import * as Haptics from "expo-haptics";
import { Link, Redirect } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Button,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getTheme } from "../theme/colors";

export default function LoginScreen() {
  const scheme = useColorScheme();
  const theme = getTheme(scheme);
  const { signIn, user, loading, signInWithGoogle, signInWithApple } =
    useAuth();
  const { show } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!loading && user) {
    return <Redirect href="/(tabs)" />;
  }

  const emailNorm = email.trim().toLowerCase();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm);

  const handleLogin = async () => {
    setError(null);
    setPending(true);
    try {
      if (!isEmailValid) throw new Error("Email invalide");
      await signIn(emailNorm, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      show("Connexion réussie", "success");
    } catch (e: any) {
      setError(e.message || "Erreur de connexion");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      show(e.message || "Erreur de connexion", "error");
    } finally {
      setPending(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 24,
        justifyContent: "center",
        gap: 16,
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: "700",
          color: theme.colors.text,
          marginBottom: 8,
        }}
      >
        Connexion
      </Text>
      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          borderWidth: 1,
          borderColor: theme.colors.cardBorder,
          padding: 12,
          borderRadius: 8,
          color: theme.colors.text,
        }}
        value={email}
        onChangeText={setEmail}
        placeholderTextColor={theme.colors.tabBarInactive}
      />
      <TextInput
        placeholder="Mot de passe"
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: theme.colors.cardBorder,
          padding: 12,
          borderRadius: 8,
          color: theme.colors.text,
        }}
        value={password}
        onChangeText={setPassword}
        placeholderTextColor={theme.colors.tabBarInactive}
      />
      {error && <Text style={{ color: "red" }}>{error}</Text>}
      {!pending && !error && password && email && !isEmailValid && (
        <Text style={{ color: "orange", fontSize: 12 }}>
          Format email invalide
        </Text>
      )}
      {pending ? (
        <ActivityIndicator />
      ) : (
        <Button
          title="Se connecter"
          onPress={handleLogin}
          disabled={!email || !password || !isEmailValid}
        />
      )}
      <View
        style={{
          flexDirection: "row",
          gap: 12,
          justifyContent: "center",
          marginTop: 8,
        }}
      >
        <TouchableOpacity
          onPress={() =>
            signInWithGoogle().catch((e) =>
              show(e.message || "Erreur Google", "error")
            )
          }
          style={{
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.colors.cardBorder,
            flex: 1,
          }}
        >
          <Text
            style={{
              textAlign: "center",
              color: theme.colors.text,
              fontWeight: "600",
            }}
          >
            Google
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            signInWithApple().catch((e) =>
              show(e.message || "Erreur Apple", "error")
            )
          }
          style={{
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.colors.cardBorder,
            flex: 1,
          }}
        >
          <Text
            style={{
              textAlign: "center",
              color: theme.colors.text,
              fontWeight: "600",
            }}
          >
            Apple
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={{ color: theme.colors.text, textAlign: "center" }}>
        Mot de passe oublié ? <Link href="/reset-password">Réinitialiser</Link>
        {"\n"}
        Pas de compte ? <Link href="/register">Inscription</Link>
      </Text>
    </View>
  );
}
