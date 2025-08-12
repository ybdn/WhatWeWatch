import { Link } from "expo-router";
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

export default function ResetPasswordScreen() {
  const scheme = useColorScheme();
  const theme = getTheme(scheme);
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async () => {
    setError(null);
    setPending(true);
    try {
      await resetPassword(email.trim());
      setDone(true);
    } catch (e: any) {
      setError(e.message || "Erreur");
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
        style={{ fontSize: 26, fontWeight: "700", color: theme.colors.text }}
      >
        Réinitialiser
      </Text>
      {done ? (
        <Text style={{ color: theme.colors.text }}>
          Si l&apos;email existe, un lien de réinitialisation a été envoyé.{" "}
          <Link href="/login">Retour connexion</Link>
        </Text>
      ) : (
        <>
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
          {error && <Text style={{ color: "red" }}>{error}</Text>}
          {pending ? (
            <ActivityIndicator />
          ) : (
            <Button
              title="Envoyer le lien"
              onPress={handle}
              disabled={!email}
            />
          )}
          <Text style={{ color: theme.colors.text, textAlign: "center" }}>
            <Link href="/login">Annuler</Link>
          </Text>
        </>
      )}
    </View>
  );
}
