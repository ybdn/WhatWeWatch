import React, { useMemo } from "react";
import {
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { getTheme } from "../../theme/colors";
import SectionWithCarousel from "../../components/SectionWithCarousel";
import {} from "../../hooks/useWatchlist";
import TagChips, { TagChipItem } from "../../components/TagChips";
import { useList } from "../../context/ListContext";
import { ContentItem } from "../../lib/tmdbService";
import { Toast, useToast } from "../../components/Toast";
import RefreshableScrollView from "../../components/RefreshableScrollView";

const SectionHeader = ({
  title,
  action,
}: {
  title: string;
  action?: string;
}) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        marginTop: 28,
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: "600",
          color: theme.colors.text,
        }}
      >
        {title}
      </Text>
      {action && (
        <TouchableOpacity accessibilityRole="button">
          <Text
            style={{
              fontSize: 13,
              fontWeight: "500",
              color: theme.colors.tint,
            }}
          >
            {action}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};




export default function Lists() {
  const scheme = useColorScheme();
  const theme = getTheme(scheme);
  // const { watchlist, finished } = useWatchlist();
  const listManager = useList();
  const { toast, showToast, hideToast } = useToast();

  // Gestionnaires pour les actions de listes
  const handleMarkAsFinished = async (item: any) => {
    try {
      const contentItem: ContentItem = item;
      await listManager.markAsFinished(contentItem);
      showToast(`"${contentItem.title}" marqué comme terminé`, 'success');
    } catch (error) {
      console.error('Error marking as finished:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  // Convertir les données de listes pour l'affichage - mémorisé pour éviter re-renders
  const watchlistData = useMemo(() => 
    listManager.watchlist.map(listItem => listItem.contentData), 
    [listManager.watchlist]
  );
  const finishedData = useMemo(() => 
    listManager.finished.map(listItem => listItem.contentData), 
    [listManager.finished]
  );

  // Create tag chips for quick filters
  const filterChips: TagChipItem[] = [
    {
      id: "watchlist",
      label: "Watchlist",
      onPress: () => console.log("Watchlist pressed"),
    },
    {
      id: "finished",
      label: "Terminé",
      onPress: () => console.log("Finished pressed"),
    },
    {
      id: "rewatch",
      label: "À revoir",
      onPress: () => console.log("Rewatch pressed"),
    },
    {
      id: "favorites",
      label: "Favoris",
      onPress: () => console.log("Favorites pressed"),
    },
  ];
  return (
    <RefreshableScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      onRefresh={listManager.refreshAllLists}
    >
      {/* Header */}
      <View style={{ paddingTop: 8, paddingHorizontal: 20 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: theme.colors.text,
            marginTop: 8,
          }}
        >
          Mes listes
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: theme.colors.textSecondary,
            marginTop: 6,
            marginBottom: 14,
          }}
        >
          Gère ce que tu veux voir, ce que tu as vu et tes sélections.
        </Text>
      </View>

      {/* Quick filters / actions */}
      <TagChips 
        items={filterChips}
        containerStyle={{ marginBottom: 14 }}
      />

      {/* Watchlist section */}
      <SectionWithCarousel 
        title="Watchlist" 
        subtitle="Films et séries que tu veux voir"
        action={watchlistData.length > 0 ? "Tout voir" : undefined}
        data={watchlistData}
        showAsEmpty={watchlistData.length === 0}
        emptyMessage="Ajoute des films et séries à ta watchlist pour les voir ici."
        showFinishedButton={true}
        onMarkAsFinished={handleMarkAsFinished}
        isInWatchlist={listManager.isInWatchlist}
        isFinished={listManager.isFinished}
      />

      {/* Finished section */}
      <SectionWithCarousel 
        title="Terminé récemment" 
        subtitle="Tes derniers visionnages"
        action={finishedData.length > 0 ? "Historique" : undefined}
        data={finishedData}
        showAsEmpty={finishedData.length === 0}
        emptyMessage="Les contenus que tu auras terminés apparaîtront ici."
      />

      {/* To Rewatch (placeholder) */}
      <SectionHeader title="À revoir" />
      <View style={{ paddingHorizontal: 20 }}>
        <View
          style={{
            height: 110,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: theme.colors.cardBorder,
            backgroundColor: theme.colors.card,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: 13,
              textAlign: "center",
              paddingHorizontal: 20,
            }}
          >
            Ajoute des titres que tu veux revisiter plus tard.
          </Text>
        </View>
      </View>


      <Toast message={toast} onHide={hideToast} />
      <View style={{ height: 40 }} />
    </RefreshableScrollView>
  );
}
