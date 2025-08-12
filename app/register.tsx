import * as Haptics from "expo-haptics";
import { Link, Redirect } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { passwordHints, passwordScore } from "../lib/password";
import { getTheme } from "../theme/colors";

export default function RegisterScreen() {
  const scheme = useColorScheme();
  const theme = getTheme(scheme);
  const { signUp, user, loading, signInWithGoogle, signInWithApple } =
    useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const score = useMemo(() => passwordScore(password), [password]);
  const hints = useMemo(() => passwordHints(password), [password]);

  if (!loading && user) {
    return <Redirect href="/(tabs)" />;
  }

  const emailNorm = email.trim().toLowerCase();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm);

  const handleRegister = async () => {
    setError(null);
    setPending(true);
    try {
      if (!isEmailValid) throw new Error("Email invalide");
      await signUp(emailNorm, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setError(e.message || "Erreur d'inscription");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      {password.length > 0 && (
        <View style={{ gap: 4 }}>
          <Text style={{ color: theme.colors.text, fontSize: 12 }}>
            Sécurité: {score}/4
          </Text>
          {hints.length > 0 && (
            <Text style={{ color: "orange", fontSize: 11 }}>
              Manque: {hints.join(", ")}
            </Text>
          )}
        </View>
      )}
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
          title="Créer le compte"
          onPress={handleRegister}
          disabled={!email || score < 2 || !isEmailValid}
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
            signInWithGoogle().catch((e) => Alert.alert("Google", e.message))
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
            signInWithApple().catch((e) => Alert.alert("Apple", e.message))
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
        Déjà un compte ? <Link href="/login">Connexion</Link>
      </Text>
    </View>
  );
}
