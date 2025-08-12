import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  FlatList,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { deleteTotpFactor, listFactors } from "../lib/mfaService";
import { getTheme } from "../theme/colors";

interface FactorItemProps {
  id: string;
  created_at?: string;
}

export default function MfaManageScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<FactorItemProps[]>([]);
  const { show } = useToast();
  const scheme = useColorScheme();
  const { colors } = getTheme(scheme);

  async function refresh() {
    if (!user) return;
    setLoading(true);
    try {
      const list = await listFactors();
      setFactors(list);
    } catch (e: any) {
      show(e.message || "Erreur chargement facteurs", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTotpFactor(id);
      show("Facteur supprimé", "success");
      refresh();
    } catch (e: any) {
      show(e.message || "Erreur suppression", "error");
    }
  }

  useEffect(() => {
    refresh(); /* eslint-disable-line react-hooks/exhaustive-deps */
  }, [user?.id]);

  if (!user)
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Non connecté</Text>
      </View>
    );

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: colors.background }}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "600",
          marginBottom: 12,
          color: colors.text,
        }}
      >
        Mes facteurs MFA
      </Text>
      {loading && <ActivityIndicator />}
      {!loading && factors.length === 0 && (
        <Text style={{ color: colors.text, marginBottom: 16 }}>
          Aucun facteur TOTP. Activez-en un depuis l&apos;écran
          d&apos;activation.
        </Text>
      )}
      <FlatList
        data={factors}
        keyExtractor={(f) => f.id}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 12,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              borderRadius: 8,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: colors.text }}>ID: {item.id}</Text>
            <Button title="Supprimer" onPress={() => handleDelete(item.id)} />
          </View>
        )}
      />
      <Button title="Actualiser" onPress={refresh} />
    </View>
  );
}
