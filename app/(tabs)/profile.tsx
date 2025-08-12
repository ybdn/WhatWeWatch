import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Link } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { deleteCurrentAccount } from "../../lib/accountService";
import { upsertProfile } from "../../lib/profileService";
import { supabase } from "../../lib/supabase";
import { getTheme } from "../../theme/colors";

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const theme = getTheme(scheme);
  const { signOut, user, profile, refreshProfile } = useAuth();
  const { show } = useToast();
  const displayName = profile?.display_name || user?.email || "";
  const [uploading, setUploading] = React.useState(false);

  const pickAvatar = async () => {
    if (!user || !supabase) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return show("Permission refusée", "error");
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (res.canceled) return;
    const asset = res.assets[0];
    if (!asset.fileSize) {
      // certains environnements ne fournissent pas fileSize; on continue
    } else if (asset.fileSize > 2 * 1024 * 1024) {
      show("Image trop lourde (max 2MB)", "error");
      return;
    }
    // Compression
    let manipulated;
    let formatExt = "jpg";
    let contentType = "image/jpeg";
    setUploading(true);
    try {
      if (Platform.OS === "android" || Platform.OS === "web") {
        manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 512, height: 512 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.WEBP }
        );
        formatExt = "webp";
        contentType = "image/webp";
      } else {
        throw new Error("Force JPEG");
      }
    } catch {
      manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      formatExt = "jpg";
      contentType = "image/jpeg";
    }
    const filePath = `${user.id}/avatar.${formatExt}`;
    const file = await fetch(manipulated.uri).then((r) => r.blob());
    const { error: uploadError } = await supabase.storage
      .from("public")
      .upload(filePath, file, { upsert: true, contentType });
    if (uploadError) return show(uploadError.message, "error");
    const { data: publicUrlData } = supabase.storage
      .from("public")
      .getPublicUrl(filePath);
    try {
      // Ajouter cache-busting query param pour contourner le cache CDN
      const bustUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
      await upsertProfile({ id: user.id, avatar_url: bustUrl });
      await refreshProfile();
      show("Avatar mis à jour", "success");
    } catch (e: any) {
      show(e.message || "Erreur profil", "error");
    } finally {
      setUploading(false);
    }
  };
  const Card: React.FC<React.PropsWithChildren<{ variant?: "danger" }>> = ({
    children,
    variant,
  }) => (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: 18,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor:
          variant === "danger" ? "#b0002040" : theme.colors.cardBorder,
      }}
    >
      {children}
    </View>
  );

  const ActionButton = ({
    label,
    onPress,
    tone = "default",
  }: {
    label: string;
    onPress: () => void;
    tone?: "default" | "primary" | "danger";
  }) => {
    const colors: Record<
      string,
      { bg: string; text: string; border?: string }
    > = {
      default: {
        bg: theme.colors.card,
        text: theme.colors.text,
        border: theme.colors.cardBorder,
      },
      primary: { bg: theme.colors.tint, text: "#fff" },
      danger: { bg: "#b00020", text: "#fff" },
    };
    const palette = colors[tone];
    return (
      <TouchableOpacity
        accessibilityRole="button"
        onPress={onPress}
        style={{
          backgroundColor: palette.bg,
          paddingHorizontal: 18,
          paddingVertical: 12,
          borderRadius: 12,
          marginRight: 12,
          marginTop: 12,
          borderWidth: palette.border ? 1 : 0,
          borderColor: palette.border,
        }}
      >
        <Text style={{ color: palette.text, fontWeight: "600", fontSize: 14 }}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
    >
      {/* Hero */}
      <View style={{ alignItems: "center", marginBottom: 24 }}>
        <View style={{ position: "relative", marginBottom: 12 }}>
          <View
            style={{
              width: 110,
              height: 110,
              borderRadius: 55,
              backgroundColor: theme.colors.card,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: theme.colors.cardBorder,
              overflow: "hidden",
            }}
          >
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <Text style={{ color: theme.colors.textSecondary }}>Avatar</Text>
            )}
            {uploading && (
              <View
                style={{
                  ...StyleSheet.absoluteFillObject,
                  backgroundColor: "#00000055",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </View>
          <TouchableOpacity
            onPress={pickAvatar}
            style={{
              position: "absolute",
              bottom: 0,
              right: -4,
              backgroundColor: theme.colors.tint,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
              Modifier
            </Text>
          </TouchableOpacity>
        </View>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: theme.colors.text,
            textAlign: "center",
          }}
        >
          {displayName} 👋
        </Text>
        {!profile?.display_name && (
          <Link
            href="/(onboarding)/profile-completion"
            style={{
              color: theme.colors.tint,
              fontWeight: "600",
              marginTop: 6,
            }}
          >
            Compléter mon profil
          </Link>
        )}
      </View>

      {/* Informations compte */}
      <Card>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: theme.colors.text,
            marginBottom: 12,
          }}
        >
          Mes informations
        </Text>
        <View style={{ gap: 8 }}>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
            Email
          </Text>
          <Text style={{ color: theme.colors.text, fontSize: 15 }}>
            {user?.email}
          </Text>
          {user?.email && (
            <Text
              style={{
                marginTop: 4,
                fontSize: 12,
                color: user?.emailConfirmed
                  ? "#2e7d32"
                  : theme.colors.textSecondary,
              }}
            >
              {user?.emailConfirmed ? "Email confirmé" : "Email non confirmé"}
            </Text>
          )}
        </View>
      </Card>

      {/* Sécurité */}
      <Card>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: theme.colors.text,
            marginBottom: 12,
          }}
        >
          Sécurité
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <ActionButton
            label="Gérer MFA"
            tone="primary"
            onPress={() => {
              // utilisation de Link programmatique
              // (expo-router Link direct dans le flux d'UI suffirait aussi)
              // mais on garde simple ici:
              // @ts-ignore
              global?.expoRouter?.push?.("/mfa");
            }}
          />
          <ActionButton label="Se déconnecter" onPress={signOut} />
        </View>
      </Card>

      {/* Danger zone */}
      <Card variant="danger">
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: "#b00020",
            marginBottom: 12,
          }}
        >
          Zone dangereuse
        </Text>
        <Text
          style={{
            fontSize: 13,
            lineHeight: 18,
            color: theme.colors.textSecondary,
          }}
        >
          La suppression de ton compte est définitive et effacera ton profil.
        </Text>
        <ActionButton
          label="Supprimer mon compte"
          tone="danger"
          onPress={() => {
            Alert.alert(
              "Supprimer le compte",
              "Cette action est définitive. Confirmer la suppression ?",
              [
                { text: "Annuler", style: "cancel" },
                {
                  text: "Supprimer",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await deleteCurrentAccount();
                      show("Compte supprimé", "success");
                    } catch (e: any) {
                      show(e.message || "Erreur suppression", "error");
                    }
                  },
                },
              ]
            );
          }}
        />
      </Card>
    </ScrollView>
  );
}
