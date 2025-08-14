import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useExploreData } from "../../hooks/useExploreData";
import { useTheme } from "../../hooks/useTheme";
import { track } from "../../lib/analytics";
import { curatedCollections } from "../../lib/curatedCollections";
import { MediaSearchResult } from "../../lib/searchService";
import { ContentItem } from "../../lib/tmdbService";
import SectionWithCarousel from "../../components/SectionWithCarousel";
import TagChips, { TagChipItem } from "../../components/TagChips";
import { useList } from "../../context/ListContext";
import { Toast, useToast } from "../../components/Toast";

export default function ExploreScreen() {
  const theme = useTheme();
  const { 
    query, 
    setQuery, 
    debounced, 
    loading, 
    error, 
    sections, 
    showEmpty,
    sectionsLoading,
    sectionsError,
  } = useExploreData();
  const listManager = useList();
  const { toast, showToast, hideToast } = useToast();

  const styles = useMemo(() => makeStyles(theme), [theme]);

  const isSearchMode = debounced.length >= 2;
  const searchResultsSection = isSearchMode
    ? sections.find((s) => s.type === "results")
    : null;
  const suggestions = !isSearchMode
    ? (() => {
        const merged: Record<string, any> = {};
        sections
          .filter((s) => s.type === "top" || s.type === "trending")
          .forEach((s) => {
            s.items.forEach((it: any) => {
              // Convert ContentItem to suggestion format if needed
              if (!merged[it.id]) {
                merged[it.id] = it;
              }
            });
          });
        return Object.values(merged).slice(0, 8); // Increase for better scroll experience
      })()
    : [];

  // Convert suggestions to TagChipItem format
  const suggestionChips: TagChipItem[] = suggestions.map((item: any) => ({
    id: item.id,
    label: item.title,
    onPress: () => track("explore_click_item", {
      from_section: "suggestions",
      id: item.id,
    }),
  }));
  const homeSections = !isSearchMode
    ? sections.filter((s) => s.type === "collection")
    : [];

  // Gestionnaire pour ajouter à la watchlist
  const handleAddToWatchlist = async (item: any) => {
    try {
      const contentItem: ContentItem = item;
      await listManager.addToWatchlist(contentItem);
      showToast(`"${contentItem.title}" ajouté à la watchlist`, 'success');
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      showToast('Erreur lors de l\'ajout', 'error');
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Explorer</Text>
        <TextInput
          placeholder="Rechercher un film (min 2 lettres)"
          placeholderTextColor={theme.colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Champ de recherche"
        />
      </View>
      {error && (
        <Text style={styles.errorText}>
          Erreur de recherche. Fallback local.
        </Text>
      )}
      {loading && isSearchMode && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.colors.tint} />
        </View>
      )}
      {sectionsLoading && !isSearchMode && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.colors.tint} />
          <Text style={[styles.emptyText, { marginTop: 8 }]}>
            Chargement des sections...
          </Text>
        </View>
      )}
      {sectionsError && !isSearchMode && (
        <Text style={styles.errorText}>
          Erreur de chargement des sections. Veuillez réessayer.
        </Text>
      )}
      {!isSearchMode && suggestionChips.length > 0 && (
        <TagChips items={suggestionChips} />
      )}
      {showEmpty && <Text style={styles.emptyText}>Aucun résultat.</Text>}
      {isSearchMode && searchResultsSection ? (
        <View style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>{searchResultsSection.title}</Text>
          <View style={styles.resultsListGap}>
            {searchResultsSection.items.map((item: MediaSearchResult) => (
              <ResultCard key={item.id} item={item} />
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={homeSections}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.homeListContent}
          renderItem={({ item }) => (
            <HomeSection 
              section={item} 
              onAddToWatchlist={handleAddToWatchlist}
              isInWatchlist={listManager.isInWatchlist}
              isFinished={listManager.isFinished}
            />
          )}
        />
      )}
      
      <Toast message={toast} onHide={hideToast} />
    </View>
  );
}

function HomeSection({ section, onAddToWatchlist, isInWatchlist, isFinished }: { 
  section: any; 
  onAddToWatchlist: (item: any) => void;
  isInWatchlist: (contentId: string) => boolean;
  isFinished: (contentId: string) => boolean;
}) {
  if (section.type === "top" || section.type === "trending") return null; // fusionné
  if (section.type === "collection") {
    return (
      <SectionWithCarousel
        title={section.title}
        subtitle={section.subtitle}
        data={section.items}
        noPadding={false}
        showAddButton={true}
        onAddToWatchlist={onAddToWatchlist}
        isInWatchlist={isInWatchlist}
        isFinished={isFinished}
      />
    );
  }
  return null;
}



function ResultCard({ item }: { item: MediaSearchResult | ContentItem }) {
  const theme = useTheme();
  
  // Handle both MediaSearchResult and ContentItem
  const title = item.title;
  const year = 'year' in item ? item.year : undefined;
  const overview = 'overview' in item ? item.overview : 'synopsis' in item ? item.synopsis : undefined;
  const type = 'type' in item ? item.type : undefined;
  
  return (
    <Pressable
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
        gap: 4,
      }}
      accessibilityRole="button"
      onPress={() => track("explore_click_result", { id: item.id })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {type && (
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: 11,
              fontWeight: "500",
              backgroundColor: theme.colors.cardBorder,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
            }}
          >
            {type}
          </Text>
        )}
        <Text
          style={{
            color: theme.colors.text,
            fontSize: 16,
            fontWeight: "600",
            letterSpacing: -0.2,
            flex: 1,
          }}
        >
          {title} {year ? `(${year})` : ""}
        </Text>
      </View>
      {overview && (
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: 13,
            lineHeight: 18,
          }}
          numberOfLines={3}
        >
          {overview}
        </Text>
      )}
    </Pressable>
  );
}

// Collections maintenant gérées via le composant SectionWithCarousel unifié

// Layout constants & styles factory
const LAYOUT = {
  screenPadding: 16,
  sectionGap: 28,
  cardRadius: 14,
};

function makeStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      paddingHorizontal: LAYOUT.screenPadding,
      paddingTop: 12,
      paddingBottom: 8,
      gap: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.colors.text,
      letterSpacing: -0.5,
    },
    searchInput: {
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.cardBorder,
      fontSize: 15,
    },
    errorText: {
      color: "#d33",
      paddingHorizontal: LAYOUT.screenPadding,
      fontSize: 13,
    },
    loadingContainer: { padding: 16 },
    emptyText: {
      padding: 16,
      color: theme.colors.textSecondary,
      fontStyle: "italic",
    },
    resultsContainer: {
      paddingHorizontal: LAYOUT.screenPadding,
      paddingBottom: 40,
    },
    resultsListGap: { gap: 12 },
    homeListContent: { paddingBottom: 80 },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: -0.3,
      marginBottom: 8,
    },
  });
}
