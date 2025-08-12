import * as Haptics from "expo-haptics";
import { Link, Redirect } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Button,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { PasswordField } from "../../components/PasswordField";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { tAuth } from "../../i18n/strings";
import { emailRegex } from "../../lib/password";
import { getTheme } from "../../theme/colors";

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
  // showPassword remplacé par PasswordField interne
  const passwordRef = useRef<TextInput | null>(null);

  if (!loading && user) {
    return <Redirect href="/(tabs)" />;
  }

  const emailNorm = email.trim().toLowerCase();
  const isEmailValid = emailRegex.test(emailNorm);

  const handleLogin = async () => {
    setError(null);
    setPending(true);
    try {
      if (!isEmailValid) throw new Error("Email invalide");
      await signIn(emailNorm, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      show(tAuth("loginButton") + " réussie", "success");
    } catch {
      // Ne pas révéler si email existe pour éviter enumeration
      setError(tAuth("invalidCredentials"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      show(tAuth("invalidCredentials"), "error");
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
        {tAuth("loginTitle")}
      </Text>
      <TextInput
        placeholder={tAuth("emailPlaceholder")}
        autoCapitalize="none"
        autoComplete="email"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
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
      <PasswordField
        ref={passwordRef as any}
        value={password}
        onChangeText={setPassword}
        returnKeyType="done"
        onSubmitEditing={handleLogin}
        disabled={pending}
      />
      {error && <Text style={{ color: "red" }}>{error}</Text>}
      {!pending && !error && password && email && !isEmailValid && (
        <Text style={{ color: "orange", fontSize: 12 }}>
          {tAuth("invalidEmailFormat")}
        </Text>
      )}
      <Button
        title={pending ? tAuth("loginButtonPending") : tAuth("loginButton")}
        onPress={handleLogin}
        disabled={pending || !email || !password || !isEmailValid}
      />
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
            opacity: pending ? 0.5 : 1,
          }}
          disabled={pending}
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
            opacity: pending ? 0.5 : 1,
          }}
          disabled={pending}
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
        {tAuth("forgotPassword")}{" "}
        <Link href="/(auth)/reset-password">{tAuth("resetLink")}</Link>
        {"\n"}
        {tAuth("noAccount")}{" "}
        <Link href="/(auth)/register">{tAuth("signup")}</Link>
      </Text>
    </View>
  );
}
