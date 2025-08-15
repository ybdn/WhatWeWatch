import { Link } from "expo-router";
import React, { useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import SectionWithCarousel from "../../components/SectionWithCarousel";
import { useWatchlist } from "../../hooks/useWatchlist";
import { useList } from "../../context/ListContext";
import { ContentItem } from "../../lib/tmdbService";
import { Toast, useToast } from "../../components/Toast";
import DebugPanel from "../../components/DebugPanel";
import RefreshableScrollView from "../../components/RefreshableScrollView";

// Accueil authentifié: résumé rapide + accès aux principales sections.
export default function HomeScreen() {
  const theme = useTheme();
  const { user, profile } = useAuth();
  // const { watchlist } = useWatchlist(); // Unused, using listManager.watchlist instead
  const listManager = useList();
  const { toast, showToast, hideToast } = useToast();
  const [debugVisible, setDebugVisible] = useState(false);

  const displayName = useMemo(
    () => profile?.display_name || user?.email?.split("@")[0] || "",
    [profile?.display_name, user?.email]
  );

  // Gestionnaires pour les actions de listes
  const handleMarkAsFinished = async (item: any) => {
    try {
      const contentItem: ContentItem = item; // Conversion du type CarouselItem vers ContentItem
      await listManager.markAsFinished(contentItem);
      showToast(`"${contentItem.title}" marqué comme terminé`, 'success');
    } catch (error) {
      console.error('Error marking as finished:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };


  // Convertir les items de watchlist pour l'affichage
  const watchlistData = listManager.watchlist.map(listItem => listItem.contentData);

  return (
    <RefreshableScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      overScrollMode="never"
      alwaysBounceVertical={false}
      contentContainerStyle={{
        paddingTop: 28,
        paddingBottom: 48,
        paddingHorizontal: 20,
        gap: 28,
      }}
      onRefresh={listManager.refreshAllLists}
    >
      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text
            accessibilityRole="header"
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: theme.colors.text,
              letterSpacing: -0.5,
            }}
          >
            Salut {displayName} !
          </Text>
          <TouchableOpacity
            onPress={() => setDebugVisible(true)}
            style={{
              backgroundColor: theme.colors.card,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: theme.colors.cardBorder,
            }}
          >
            <Text style={{ color: theme.colors.text, fontSize: 12 }}>🔍 Debug</Text>
          </TouchableOpacity>
        </View>
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

      <SectionWithCarousel 
        title="Ta Watchlist"
        subtitle="Films et séries que tu veux voir"
        action={watchlistData.length > 0 ? "Tout voir" : undefined}
        data={watchlistData}
        showAsEmpty={watchlistData.length === 0}
        emptyMessage="Les prochains films à voir apparaîtront ici."
        noPadding={true}
        showFinishedButton={true}
        onMarkAsFinished={handleMarkAsFinished}
        isInWatchlist={listManager.isInWatchlist}
        isFinished={listManager.isFinished}
      />

      <Section title="Progression (bientôt)">
        <EmptyState message="Séries & films en cours de visionnage." />
      </Section>
      
      <Toast message={toast} onHide={hideToast} />
      
      <DebugPanel 
        visible={debugVisible} 
        onClose={() => setDebugVisible(false)} 
      />
    </RefreshableScrollView>
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
