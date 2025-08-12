import { Button, Text, useColorScheme, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { getTheme } from "../../theme/colors";

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const theme = getTheme(scheme);
  const { signOut, user } = useAuth();
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
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          textAlign: "center",
          margin: 16,
          color: theme.colors.text,
        }}
      >
        Bonjour {user?.email || ""} 👋
      </Text>
      <Button title="Se déconnecter" onPress={signOut} />
    </View>
  );
}
