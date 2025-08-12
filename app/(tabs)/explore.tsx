import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAsync } from "../../hooks/useAsync";
import { useDebounce } from "../../hooks/useDebounce";
import { useTheme } from "../../hooks/useTheme";
import { curatedCollections } from "../../lib/curatedCollections";
import { MediaSearchResult, searchMedia } from "../../lib/searchService";

export default function ExploreScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 400);

  const runSearch = useCallback(() => searchMedia(debounced), [debounced]);
  const { data, loading, error } = useAsync<MediaSearchResult[]>(runSearch, [
    runSearch,
  ]);

  const results = data || [];
  const showEmpty = debounced.length >= 2 && !loading && results.length === 0;

  const showCollections =
    debounced.length < 2 && results.length === 0 && !loading;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 8,
          gap: 12,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: theme.colors.text,
            letterSpacing: -0.5,
          }}
        >
          Explorer
        </Text>
        <TextInput
          placeholder="Rechercher un film (min 2 lettres)"
          placeholderTextColor={theme.colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          style={{
            backgroundColor: theme.colors.card,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            color: theme.colors.text,
            borderWidth: 1,
            borderColor: theme.colors.cardBorder,
            fontSize: 15,
          }}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>
      {error && (
        <Text style={{ color: "#d33", paddingHorizontal: 16 }}>
          Erreur de recherche. Fallback local.
        </Text>
      )}
      {loading && debounced.length >= 2 && (
        <View style={{ padding: 16 }}>
          <ActivityIndicator color={theme.colors.tint} />
        </View>
      )}
      {showEmpty && (
        <Text
          style={{
            padding: 16,
            color: theme.colors.textSecondary,
            fontStyle: "italic",
          }}
        >
          Aucun résultat.
        </Text>
      )}
      {debounced.length >= 2 ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 32,
            gap: 12,
          }}
          renderItem={({ item }) => <ResultCard item={item} />}
          ListHeaderComponent={() => <View style={{ height: 4 }} />}
          keyboardShouldPersistTaps="handled"
        />
      ) : showCollections ? (
        <CollectionsScroller />
      ) : null}
      {/* Hints initialement présents supprimés sur demande */}
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

function CollectionsScroller() {
  return (
    <FlatList
      data={curatedCollections}
      keyExtractor={(c) => c.id}
      contentContainerStyle={{ paddingBottom: 64, paddingTop: 8 }}
      renderItem={({ item }) => <CollectionSection id={item.id} />}
    />
  );
}

function CollectionSection({ id }: { id: string }) {
  const theme = useTheme();
  const collection = curatedCollections.find((c) => c.id === id);
  if (!collection) return null;
  return (
    <View style={{ marginBottom: 28 }}>
      <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: 18,
            fontWeight: "700",
            letterSpacing: -0.3,
          }}
        >
          {collection.title}
        </Text>
        {collection.subtitle && (
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: 12,
              marginTop: 2,
            }}
          >
            {collection.subtitle}
          </Text>
        )}
      </View>
      <FlatList
        data={collection.items}
        keyExtractor={(i) => i.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 0 }}
        renderItem={({ item }) => <CarouselCard item={item} />}
      />
    </View>
  );
}

function CarouselCard({ item }: { item: any }) {
  const theme = useTheme();
  return (
    <Pressable
      style={{
        width: 120,
        height: 170,
        marginHorizontal: 4,
        backgroundColor: item.color || theme.colors.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
        padding: 10,
        justifyContent: "flex-end",
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: 13,
          fontWeight: "600",
        }}
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
