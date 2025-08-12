import { Redirect } from "expo-router";
import React, { useState } from "react";
import { Button, Text, TextInput, useColorScheme, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { upsertProfile } from "../lib/profileService";
import { getTheme } from "../theme/colors";

export default function ProfileCompletion() {
  const { user } = useAuth();
  const scheme = useColorScheme();
  const theme = getTheme(scheme);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  if (!user) return <Redirect href="/login" />;

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await upsertProfile({ id: user.id, display_name: displayName.trim() });
    } finally {
      setSaving(false);
    }
  };
  return (
    <View
      style={{
        flex: 1,
        padding: 24,
        gap: 16,
        backgroundColor: theme.colors.background,
      }}
    >
      <Text
        style={{ fontSize: 24, fontWeight: "700", color: theme.colors.text }}
      >
        Compléter le profil
      </Text>
      <TextInput
        placeholder="Nom public"
        value={displayName}
        onChangeText={setDisplayName}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.cardBorder,
          padding: 12,
          borderRadius: 8,
          color: theme.colors.text,
        }}
        placeholderTextColor={theme.colors.tabBarInactive}
      />
      <Button
        title={saving ? "Sauvegarde..." : "Enregistrer"}
        onPress={save}
        disabled={!displayName.trim() || saving}
      />
    </View>
  );
}
