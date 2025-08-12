import { Link } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";

// Accueil authentifié: résumé rapide + accès aux principales sections.
export default function HomeScreen() {
  const theme = useTheme();
  const { user, profile } = useAuth();

  const displayName = useMemo(
    () => profile?.display_name || user?.email?.split("@")[0] || "",
    [profile?.display_name, user?.email]
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      overScrollMode="never"
      alwaysBounceVertical={false}
      contentContainerStyle={{
        paddingTop: 28,
        paddingBottom: 48,
        paddingHorizontal: 20,
        gap: 28,
      }}
    >
      <View style={{ gap: 4 }}>
        <Text
          accessibilityRole="header"
          style={{
            fontSize: 28,
            fontWeight: "800",
            color: theme.colors.text,
            letterSpacing: -0.5,
          }}
        >
          Salut {displayName || "!"}
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: theme.colors.textSecondary,
            lineHeight: 20,
          }}
        >
          Prêt·e à explorer et enrichir ta watchlist ?
        </Text>
      </View>

      <QuickActions />

      <Section title="Recommandations (bientôt)">
        <SkeletonRow />
        <SkeletonRow />
      </Section>

      <Section title="Ta Watchlist (bientôt)">
        <EmptyState message="Les prochains films à voir apparaîtront ici." />
      </Section>

      <Section title="Progression (bientôt)">
        <EmptyState message="Séries & films en cours de visionnage." />
      </Section>
    </ScrollView>
  );
}

function QuickActions() {
  const theme = useTheme();
  const cardStyle = {
    flex: 1,
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  } as const;
  const textStyle = {
    fontSize: 14,
    fontWeight: "600" as const,
    color: theme.colors.text,
  };
  return (
    <View style={{ flexDirection: "row", gap: 14 }}>
      <Link href="/(tabs)/explore" asChild>
        <TouchableOpacity accessibilityRole="button" style={cardStyle}>
          <Text style={textStyle}>Explorer</Text>
          <Text
            style={{
              marginTop: 4,
              fontSize: 12,
              color: theme.colors.textSecondary,
              lineHeight: 16,
            }}
          >
            Recherche de films (musique, livres arrivent ensuite)
          </Text>
        </TouchableOpacity>
      </Link>
      <Link href="/(tabs)/lists" asChild>
        <TouchableOpacity accessibilityRole="button" style={cardStyle}>
          <Text style={textStyle}>Listes</Text>
          <Text
            style={{
              marginTop: 4,
              fontSize: 12,
              color: theme.colors.textSecondary,
              lineHeight: 16,
            }}
          >
            Gère ta watchlist et crée des listes perso.
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: 12 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "700",
          color: theme.colors.text,
          letterSpacing: -0.3,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function SkeletonRow() {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          // simple placeholder card
          style={{
            flex: 1,
            height: 90,
            backgroundColor: theme.colors.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.colors.cardBorder,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
            À venir
          </Text>
        </View>
      ))}
    </View>
  );
}

function EmptyState({ message }: { message: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        padding: 20,
        borderRadius: 14,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
      }}
    >
      <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
        {message}
      </Text>
    </View>
  );
}
