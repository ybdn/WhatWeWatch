import React, { useState } from "react";
import { ActivityIndicator, Button, Text, TextInput, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useToast } from "../context/ToastContext";
import {
  challengeTotpFactor,
  enrollTotpFactor,
  verifyTotpFactor,
} from "../lib/mfaService";

export default function MfaEnableScreen() {
  const { show } = useToast();
  const [secretUri, setSecretUri] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const startEnroll = async () => {
    try {
      setLoading(true);
      const data = await enrollTotpFactor();
      // data: { id, type, status, totp: { secret, uri } }
      setFactorId(data.id);
      setSecretUri(data.totp?.uri || null);
      // lancer challenge directement pour activer verify
      const challenge = await challengeTotpFactor(data.id);
      setChallengeId(challenge.id);
    } catch (e: any) {
      show(e.message || "Erreur MFA", "error");
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!factorId || !challengeId) return;
    try {
      setLoading(true);
      await verifyTotpFactor(factorId, challengeId, code);
      show("MFA activée", "success");
    } catch (e: any) {
      show(e.message || "Code invalide", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 24, gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>
        Activer MFA (TOTP)
      </Text>
      {!factorId && !loading && (
        <Button title="Générer secret" onPress={startEnroll} />
      )}
      {loading && <ActivityIndicator />}
      {secretUri && (
        <View style={{ alignItems: "center", gap: 12 }}>
          <QRCode value={secretUri} size={180} />
          <Text style={{ fontSize: 12, textAlign: "center" }}>
            Scanne avec Google Authenticator / Authy puis entre le code.
          </Text>
          <TextInput
            placeholder="Code à 6 chiffres"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            style={{
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              width: "100%",
            }}
          />
          <Button
            title="Confirmer"
            onPress={confirm}
            disabled={code.length < 6 || loading}
          />
        </View>
      )}
    </View>
  );
}
