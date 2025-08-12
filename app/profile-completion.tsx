import { Redirect } from "expo-router";
import React, { useState } from "react";
import { Button, Text, TextInput, useColorScheme, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { getTheme } from "../theme/colors";

export default function ProfileCompletion() {
  const { user } = useAuth();
  const scheme = useColorScheme();
  const theme = getTheme(scheme);
  const [displayName, setDisplayName] = useState("");
  if (!user) return <Redirect href="/login" />;

  const save = async () => {
    // TODO: appeler supabase.from('profiles').upsert
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
        title="Enregistrer"
        onPress={save}
        disabled={!displayName.trim()}
      />
    </View>
  );
}
