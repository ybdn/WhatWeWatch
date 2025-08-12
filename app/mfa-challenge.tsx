import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Button,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { challengeTotpFactor, verifyTotpFactor } from "../lib/mfaService";
import { getTheme } from "../theme/colors";

export default function MfaChallengeScreen() {
  const { mfaPending, refreshProfile } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { show } = useToast();
  const router = useRouter();
  const scheme = useColorScheme();
  const { colors } = getTheme(scheme);

  if (!mfaPending) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Aucun challenge</Text>
      </View>
    );
  }

  async function submit() {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const factorId = mfaPending!.factorId;
      const { id: challengeId } = await challengeTotpFactor(factorId);
      await verifyTotpFactor(factorId, challengeId, code.trim());
      show("MFA validée", "success");
      await refreshProfile();
      router.replace("/");
    } catch (e: any) {
      show(e.message || "Erreur MFA", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, backgroundColor: colors.background }}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "600",
          marginBottom: 12,
          color: colors.text,
        }}
      >
        Validation MFA
      </Text>
      <Text style={{ color: colors.text, marginBottom: 8 }}>
        Entrez le code à 6 chiffres de votre application TOTP.
      </Text>
      <TextInput
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
        placeholder="Code"
        placeholderTextColor={colors.textSecondary}
        style={{
          borderWidth: 1,
          borderColor: colors.cardBorder,
          padding: 12,
          borderRadius: 8,
          color: colors.text,
          marginBottom: 16,
        }}
      />
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Button title="Valider" onPress={submit} />
      )}
    </View>
  );
}
