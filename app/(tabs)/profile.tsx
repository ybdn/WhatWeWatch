import * as ImagePicker from "expo-image-picker";
import { Link } from "expo-router";
import {
  Alert,
  Button,
  Image,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { upsertProfile } from "../../lib/profileService";
import { supabase } from "../../lib/supabase";
import { getTheme } from "../../theme/colors";

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const theme = getTheme(scheme);
  const { signOut, user, profile, refreshProfile } = useAuth();
  const displayName = profile?.display_name || user?.email || "";

  const pickAvatar = async () => {
    if (!user || !supabase) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (res.canceled) return;
    const asset = res.assets[0];
    // Chemin deterministe dans le bucket: <userId>/avatar.jpg
    const filePath = `${user.id}/avatar.jpg`;
    const file = await fetch(asset.uri).then((r) => r.blob());
    const { error: uploadError } = await supabase.storage
      .from("public")
      .upload(filePath, file, { upsert: true, contentType: "image/jpeg" });
    if (uploadError) {
      Alert.alert("Upload", uploadError.message);
      return;
    }
    const { data: publicUrlData } = supabase.storage
      .from("public")
      .getPublicUrl(filePath);
    try {
      // Ajouter cache-busting query param pour contourner le cache CDN
      const bustUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
      await upsertProfile({ id: user.id, avatar_url: bustUrl });
      await refreshProfile();
    } catch (e: any) {
      Alert.alert("Profil", e.message);
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
          href="/profile-completion"
          style={{ color: theme.colors.tabBarActive, fontWeight: "600" }}
        >
          Compléter mon profil
        </Link>
      )}
      <Button title="Se déconnecter" onPress={signOut} />
    </View>
  );
}
