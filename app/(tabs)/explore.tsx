import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
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

export default function ExploreScreen() {
  const theme = useTheme();
  const { query, setQuery, debounced, loading, error, sections, showEmpty } =
    useExploreData();

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
              if (!merged[it.id]) merged[it.id] = it;
            });
          });
        return Object.values(merged);
      })()
    : [];
  const homeSections = !isSearchMode
    ? sections.filter((s) => s.type === "collection")
    : [];

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
      {!isSearchMode && suggestions.length > 0 && (
        <SuggestionsPanel items={suggestions} />
      )}
      {showEmpty && <Text style={styles.emptyText}>Aucun résultat.</Text>}
      {isSearchMode && searchResultsSection ? (
        <View style={styles.resultsContainer}>
          <SectionTitle title={searchResultsSection.title} />
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
          renderItem={({ item }) => <HomeSection section={item} />}
        />
      )}
    </View>
  );
}

function HomeSection({ section }: { section: any }) {
  if (section.type === "top" || section.type === "trending") return null; // fusionné
  if (section.type === "collection") {
    return <CollectionSection id={section.id} />;
  }
  return null;
}

function SuggestionsPanel({ items }: { items: any[] }) {
  const theme = useTheme();
  return (
    <View
      style={{
        marginTop: 4,
        paddingHorizontal: LAYOUT.screenPadding,
        marginBottom: 16,
      }}
    >
      <View
        style={{
          backgroundColor: theme.colors.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.colors.cardBorder,
          paddingHorizontal: 12,
          paddingVertical: 12,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {items.map((it) => (
          <SuggestionChip key={it.id} item={it} />
        ))}
      </View>
    </View>
  );
}

function SuggestionChip({ item }: { item: any }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Suggestion ${item.title}`}
      onPress={() =>
        track("explore_click_item", {
          from_section: "suggestions",
          id: item.id,
        })
      }
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: theme.colors.background,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
      }}
    >
      <Text
        style={{ color: theme.colors.text, fontSize: 14, fontWeight: "500" }}
      >
        {item.title}
      </Text>
    </Pressable>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: subtitle ? 2 : 8 }}>
      <Text
        style={{
          color: theme.colors.text,
          fontSize: 18,
          fontWeight: "700",
          letterSpacing: -0.3,
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: 12,
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

function ResultCard({ item }: { item: MediaSearchResult }) {
  const theme = useTheme();
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
      <Text
        style={{
          color: theme.colors.text,
          fontSize: 16,
          fontWeight: "600",
          letterSpacing: -0.2,
        }}
      >
        {item.title} {item.year ? `(${item.year})` : ""}
      </Text>
      {item.overview && (
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: 13,
            lineHeight: 18,
          }}
          numberOfLines={3}
        >
          {item.overview}
        </Text>
      )}
    </Pressable>
  );
}

// Composant Hint retiré (plus utilisé)
// Collections maintenant gérées via sections; ceci reste pour rendu de section collection

function CollectionSection({ id }: { id: string }) {
  const collection = curatedCollections.find((c) => c.id === id);
  if (!collection) return null;
  return (
    <View style={{ marginBottom: LAYOUT.sectionGap }}>
      <View
        style={{ paddingHorizontal: LAYOUT.screenPadding, marginBottom: 10 }}
      >
        <SectionTitle title={collection.title} subtitle={collection.subtitle} />
      </View>
      <FlatList
        data={collection.items}
        keyExtractor={(i) => i.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: LAYOUT.screenPadding - 4 }}
        renderItem={({ item }) => <CarouselCard item={item} />}
        ListFooterComponent={<View style={{ width: 4 }} />}
      />
    </View>
  );
}

function CarouselCard({ item }: { item: any }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir ${item.title}`}
      onPress={() => track("explore_click_collection_item", { id: item.id })}
      style={{
        width: 120,
        height: 170,
        marginHorizontal: 4,
        backgroundColor: item.color || theme.colors.card,
        borderRadius: LAYOUT.cardRadius,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
        padding: 10,
        justifyContent: "flex-end",
      }}
    >
      <Text
        style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}
        numberOfLines={2}
      >
        {item.title}
      </Text>
      {item.year && (
        <Text style={{ color: "#fff", fontSize: 10, opacity: 0.8 }}>
          {item.year}
        </Text>
      )}
    </Pressable>
  );
}

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
  });
}
