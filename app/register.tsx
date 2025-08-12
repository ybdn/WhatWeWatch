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

export default function RegisterScreen() {
  const scheme = useColorScheme();
  const theme = getTheme(scheme);
  const { signUp, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!loading && user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleRegister = async () => {
    setError(null);
    setPending(true);
    try {
      await signUp(email.trim(), password);
    } catch (e: any) {
      setError(e.message || "Erreur d'inscription");
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
        Inscription
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
        placeholder="Mot de passe (6+ caractères)"
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
          title="Créer le compte"
          onPress={handleRegister}
          disabled={!email || password.length < 6}
        />
      )}
      <Text style={{ color: theme.colors.text, textAlign: "center" }}>
        Déjà un compte ? <Link href="/login">Connexion</Link>
      </Text>
    </View>
  );
}
