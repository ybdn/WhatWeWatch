import * as Haptics from "expo-haptics";
import { Link, Redirect } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  Button,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { PasswordField } from "../../components/PasswordField";
import { PasswordStrengthBar } from "../../components/PasswordStrengthBar";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { tAuth } from "../../i18n/strings";
import { emailRegex, passwordHints, passwordScore } from "../../lib/password";
import { getTheme } from "../../theme/colors";

export default function RegisterScreen() {
  const scheme = useColorScheme();
  const theme = getTheme(scheme);
  const { signUp, user, loading, signInWithGoogle, signInWithApple } =
    useAuth();
  const { show } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // showPassword remplacé via PasswordField interne
  const passwordRef = useRef<TextInput | null>(null);
  const score = useMemo(() => passwordScore(password), [password]);
  const hints = useMemo(() => passwordHints(password), [password]);

  if (!loading && user) {
    return <Redirect href="/(tabs)" />;
  }

  const emailNorm = email.trim().toLowerCase();
  const isEmailValid = emailRegex.test(emailNorm);

  const handleRegister = async () => {
    setError(null);
    setPending(true);
    try {
      if (!isEmailValid) throw new Error(tAuth("invalidEmail"));
      await signUp(emailNorm, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      show(tAuth("registerSuccess"), "success");
    } catch (e: any) {
      setError(e.message || tAuth("registerErrorGeneric"));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      show(e.message || tAuth("registerErrorToast"), "error");
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
        {tAuth("registerTitle")}
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
        onSubmitEditing={handleRegister}
        disabled={pending}
        registerVariant
      />
      {password.length > 0 && (
        <View style={{ gap: 4 }}>
          <PasswordStrengthBar password={password} />
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
          {tAuth("invalidEmailFormat")}
        </Text>
      )}
      <Button
        title={
          pending ? tAuth("registerButtonPending") : tAuth("registerButton")
        }
        onPress={handleRegister}
        disabled={pending || !email || score < 2 || !isEmailValid}
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
        {tAuth("haveAccount")}{" "}
        <Link href="/(auth)/login">{tAuth("signin")}</Link>
      </Text>
    </View>
  );
}
