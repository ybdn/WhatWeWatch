import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Button, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function VerifyEmailScreen() {
  const { user, refreshEmailConfirmation, resendConfirmationEmail } = useAuth();
  const { show } = useToast();
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();

  const checkNow = async () => {
    try {
      setChecking(true);
      await refreshEmailConfirmation();
    } catch (e: any) {
      show(e.message || "Erreur", "error");
    } finally {
      setChecking(false);
    }
  };

  const resend = async () => {
    if (cooldown > 0) return;
    if (!user?.email) return;
    try {
      setSending(true);
      await resendConfirmationEmail(user.email);
      show("Email envoyé", "success");
      setCooldown(45);
    } catch (e: any) {
      show(e.message || "Erreur", "error");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (user?.emailConfirmed) {
      router.replace("/(tabs)");
    }
  }, [user?.emailConfirmed, router]);

  // Polling auto toutes les 6s si non confirmé
  useEffect(() => {
    if (user?.emailConfirmed) return;
    const interval = setInterval(() => {
      refreshEmailConfirmation().catch(() => {});
    }, 6000);
    return () => clearInterval(interval);
  }, [user?.emailConfirmed, refreshEmailConfirmation]);

  return (
    <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: "600", textAlign: "center" }}>
        Vérifie ton email
      </Text>
      <Text style={{ textAlign: "center" }}>
        Un email de confirmation a été envoyé à {user?.email}. Clique sur le
        lien pour activer ton compte.
      </Text>
      <Button
        title={
          sending
            ? "Envoi..."
            : cooldown > 0
            ? `Renvoyer (${cooldown}s)`
            : "Renvoyer l'email"
        }
        onPress={resend}
        disabled={sending || cooldown > 0}
      />
      <Button
        title={checking ? "Vérification..." : "J'ai confirmé"}
        onPress={checkNow}
        disabled={checking}
      />
      {(checking || sending) && <ActivityIndicator />}
    </View>
  );
}
