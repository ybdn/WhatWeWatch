import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  challengeTotpFactor,
  deleteTotpFactor,
  enrollTotpFactor,
  listFactors,
  verifyTotpFactor,
} from "../lib/mfaService";
import { getTheme } from "../theme/colors";

export default function MfaScreen() {
  const { user } = useAuth();
  const { show } = useToast();
  const scheme = useColorScheme();
  const { colors } = getTheme(scheme);
  const [loading, setLoading] = useState(false);
  const [factors, setFactors] = useState<any[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [secretUri, setSecretUri] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const refresh = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const list = await listFactors();
      setFactors(list);
    } catch (e: any) {
      show(e.message || "Erreur facteurs", "error");
    } finally {
      setLoading(false);
    }
  }, [user, show]);

  useEffect(() => {
    refresh();
  }, [user?.id, refresh]);
  async function startEnroll() {
    try {
      setEnrolling(true);
      const data: any = await enrollTotpFactor();
      setFactorId(data.id);
      setSecretUri(data.totp?.uri || data.uri || null);
      const ch: any = await challengeTotpFactor(data.id);
      setChallengeId(ch.id);
    } catch (e: any) {
      show(e.message || "Erreur enrollement", "error");
    } finally {
      setEnrolling(false);
    }
  }

  async function confirm() {
    if (!factorId || !challengeId) return;
    try {
      setEnrolling(true);
      await verifyTotpFactor(factorId, challengeId, code.trim());
      show("MFA activée", "success");
      setSecretUri(null);
      setFactorId(null);
      setChallengeId(null);
      setCode("");
      refresh();
    } catch (e: any) {
      show(e.message || "Code invalide", "error");
    } finally {
      setEnrolling(false);
    }
  }

  async function remove(id: string) {
    try {
      await deleteTotpFactor(id);
      show("Facteur supprimé", "success");
      refresh();
    } catch (e: any) {
      show(e.message || "Erreur suppression", "error");
    }
  }

  if (!user) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Non connecté</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 24, backgroundColor: colors.background }}>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "600",
          marginBottom: 12,
          color: colors.text,
        }}
      >
        MFA (TOTP)
      </Text>
      {loading && <ActivityIndicator />}
      {!loading && factors.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}
          >
            Facteurs actifs
          </Text>
          <FlatList
            data={factors}
            keyExtractor={(f) => f.id}
            renderItem={({ item }) => (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: colors.text }}>ID: {item.id}</Text>
                <TouchableOpacity onPress={() => remove(item.id)}>
                  <Text style={{ color: "#ff4d4f" }}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}
      {factors.length === 0 && !factorId && (
        <Button
          title={enrolling ? "..." : "Activer MFA"}
          onPress={startEnroll}
          disabled={enrolling}
        />
      )}
      {secretUri && (
        <View style={{ alignItems: "center", gap: 12, marginTop: 16 }}>
          <QRCode value={secretUri} size={180} />
          <Text
            style={{ fontSize: 12, color: colors.text, textAlign: "center" }}
          >
            Scanne le QR puis entre le code à 6 chiffres.
          </Text>
          <TextInput
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="Code"
            style={{
              borderWidth: 1,
              borderColor: colors.cardBorder,
              padding: 12,
              borderRadius: 8,
              width: "100%",
              color: colors.text,
            }}
          />
          <Button
            title="Confirmer"
            onPress={confirm}
            disabled={code.length < 6 || enrolling}
          />
          <Button
            title="Annuler"
            onPress={() => {
              setSecretUri(null);
              setFactorId(null);
              setChallengeId(null);
              setCode("");
            }}
            color="#999"
          />
        </View>
      )}
    </View>
  );
}
