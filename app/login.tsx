import { Link, Redirect } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Button,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { getTheme } from "../theme/colors";

export default function LoginScreen() {
  const scheme = useColorScheme();
  const theme = getTheme(scheme);
  const { signIn, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!loading && user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleLogin = async () => {
    setError(null);
    setPending(true);
    try {
      await signIn(email.trim(), password);
    } catch (e: any) {
      setError(e.message || "Erreur de connexion");
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
      {pending ? (
        <ActivityIndicator />
      ) : (
        <Button
          title="Se connecter"
          onPress={handleLogin}
          disabled={!email || !password}
        />
      )}
      <Text style={{ color: theme.colors.text, textAlign: "center" }}>
  Mot de passe oublié ? <Link href="/reset-password">Réinitialiser</Link>{"\n"}
  Pas de compte ? <Link href="/register">Inscription</Link>
      </Text>
    </View>
  );
}
