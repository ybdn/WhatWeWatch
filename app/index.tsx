import { Link, Redirect } from "expo-router";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { getTheme } from "../theme/colors";

// Page d'accueil publique (landing) si non connecté, sinon redirection vers les tabs
export default function RootIndex() {
  const { user, loading } = useAuth();
  const scheme = useColorScheme();
  const theme = getTheme(scheme);

  if (!loading && user) return <Redirect href="/(tabs)" />;

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        paddingVertical: 64,
        paddingHorizontal: 24,
        backgroundColor: theme.colors.background,
      }}
    >
      <View style={{ flex: 1, alignItems: "center" }}>
        <Text
          style={{
            fontSize: 42,
            fontWeight: "800",
            textAlign: "center",
            letterSpacing: -0.5,
            color: theme.colors.text,
            marginBottom: 16,
          }}
        >
          WhatWeWatch
        </Text>
        <Text
          style={{
            fontSize: 18,
            lineHeight: 26,
            textAlign: "center",
            color: theme.colors.textSecondary,
            marginBottom: 32,
            maxWidth: 480,
          }}
        >
          Découvre, organise et partage ton univers culturel : films, séries,
          musique, livres… et bientôt lieux & événements IRL.
        </Text>
        <View style={{ gap: 16, width: "100%", maxWidth: 400 }}>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity
              accessibilityRole="button"
              style={{
                backgroundColor: theme.colors.tint,
                paddingVertical: 16,
                borderRadius: 14,
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                Créer un compte
              </Text>
            </TouchableOpacity>
          </Link>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity
              accessibilityRole="button"
              style={{
                backgroundColor: theme.colors.card,
                paddingVertical: 16,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: theme.colors.cardBorder,
              }}
            >
              <Text
                style={{
                  textAlign: "center",
                  color: theme.colors.text,
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                Se connecter
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
        <View style={{ marginTop: 56, width: "100%", maxWidth: 560, gap: 20 }}>
          <Feature
            title="Multi‑médias unifiés"
            desc="Commence avec les films (TMDB), les séries et la musique arrivent ensuite."
          />
          <Feature
            title="Listes & suivi intelligents"
            desc="Watchlist, progression, notes, historique — tout centralisé."
          />
          <Feature
            title="Recommandations évolutives"
            desc="D'abord popularité + co‑occurrence simple, puis profil affinable gamifié."
          />
          <Feature
            title="Vers l'IRL"
            desc="Prochaine étape: lieux & événements pour connecter culture et sorties."
          />
        </View>
      </View>
    </ScrollView>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  const scheme = useColorScheme();
  const theme = getTheme(scheme);
  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
      }}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "700",
          color: theme.colors.text,
          marginBottom: 4,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          lineHeight: 20,
          color: theme.colors.textSecondary,
        }}
      >
        {desc}
      </Text>
    </View>
  );
}
