import { Link } from "expo-router";
import React, { useState } from "react";
import { Button, Text, TextInput, useColorScheme, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { tAuth } from "../../i18n/strings";
import { getTheme } from "../../theme/colors";

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
        {tAuth("forgotPassword")}
      </Text>
      {done ? (
        <Text style={{ color: theme.colors.text }}>
          {tAuth("resetDone")}{" "}
          <Link href="/(auth)/login">{tAuth("returnLogin")}</Link>
        </Text>
      ) : (
        <>
          <TextInput
            placeholder={tAuth("emailPlaceholder")}
            autoCapitalize="none"
            autoComplete="email"
            textContentType="username"
            keyboardType="email-address"
            returnKeyType="send"
            onSubmitEditing={handle}
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
          <Button
            title={pending ? tAuth("sendLinkPending") : tAuth("sendLink")}
            onPress={handle}
            disabled={pending || !email}
          />
          <Text style={{ color: theme.colors.text, textAlign: "center" }}>
            <Link href="/(auth)/login">{tAuth("cancel")}</Link>
          </Text>
        </>
      )}
    </View>
  );
}
