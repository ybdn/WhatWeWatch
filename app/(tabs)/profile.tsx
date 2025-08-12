import * as ImagePicker from "expo-image-picker";

import * as ImageManipulator from "expo-image-manipulator";
import { Link } from "expo-router";
import {
  Alert,
  Button,
  Image,
  Platform,
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
    }
  };
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
        backgroundColor: theme.colors.background,
        padding: 24,
      }}
    >
      {profile?.avatar_url && (
        <Image
          source={{ uri: profile.avatar_url }}
          style={{ width: 96, height: 96, borderRadius: 48 }}
        />
      )}
      <TouchableOpacity onPress={pickAvatar} style={{ padding: 8 }}>
        <Text style={{ color: theme.colors.tabBarActive, fontWeight: "600" }}>
          Modifier l&apos;avatar
        </Text>
      </TouchableOpacity>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          textAlign: "center",
          margin: 8,
          color: theme.colors.text,
        }}
      >
        {displayName} 👋
      </Text>
      {!profile?.display_name && (
        <Link
          href="/(onboarding)/profile-completion"
          style={{ color: theme.colors.tabBarActive, fontWeight: "600" }}
        >
          Compléter mon profil
        </Link>
      )}
      <Link href="/mfa" style={{ color: theme.colors.tabBarActive }}>
        Sécurité MFA
      </Link>
      <Button title="Se déconnecter" onPress={signOut} />
      <View style={{ height: 12 }} />
      <Button
        color="#b00020"
        title="Supprimer mon compte"
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
    </View>
  );
}
