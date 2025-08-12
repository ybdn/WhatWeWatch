import React from "react";
import {
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { getTheme } from "../../theme/colors";

interface MockItem {
  id: string;
  title: string;
  meta?: string;
  color: string;
}

const mockWatchlist: MockItem[] = [
  { id: "w1", title: "Dune: Part II", meta: "Film", color: "#264653" },
  { id: "w2", title: "The Acolyte", meta: "Série", color: "#2a9d8f" },
  { id: "w3", title: "Furiosa", meta: "Film", color: "#e9c46a" },
  { id: "w4", title: "3 Body Problem", meta: "Série", color: "#f4a261" },
];

const mockFinished: MockItem[] = [
  { id: "f1", title: "Oppenheimer", meta: "Film", color: "#8ecae6" },
  { id: "f2", title: "Severance", meta: "Série", color: "#ffb703" },
  { id: "f3", title: "Poor Things", meta: "Film", color: "#fb8500" },
];

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

const PillButton = ({ label }: { label: string }) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme);
  return (
    <TouchableOpacity
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.cardBorder,
        borderWidth: 1,
        borderRadius: 999,
        marginRight: 10,
        marginBottom: 10,
      }}
    >
      <Text
        style={{ color: theme.colors.text, fontSize: 13, fontWeight: "500" }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const ItemCard = ({ item }: { item: MockItem }) => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme);
  return (
    <View
      style={{
        width: 140,
        height: 190,
        borderRadius: 12,
        backgroundColor: item.color,
        marginRight: 12,
        padding: 10,
        justifyContent: "flex-end",
      }}
    >
      <Text
        numberOfLines={2}
        style={{
          color: "#fff",
          fontWeight: "600",
          fontSize: 14,
          marginBottom: 2,
        }}
      >
        {item.title}
      </Text>
      {item.meta && (
        <Text style={{ color: "#ffffffcc", fontSize: 11 }}>{item.meta}</Text>
      )}
    </View>
  );
};

const HorizontalList = ({ data }: { data: MockItem[] }) => (
  <FlatList
    horizontal
    data={data}
    keyExtractor={(it) => it.id}
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ paddingHorizontal: 20 }}
    renderItem={({ item }) => <ItemCard item={item} />}
  />
);

const EmptyCustomLists = () => {
  const scheme = useColorScheme();
  const theme = getTheme(scheme);
  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingVertical: 28,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        marginHorizontal: 20,
        marginTop: 4,
      }}
    >
      <Text
        style={{
          fontSize: 15,
          fontWeight: "600",
          color: theme.colors.text,
          marginBottom: 6,
        }}
      >
        Aucune liste personnalisée
      </Text>
      <Text
        style={{
          fontSize: 13,
          lineHeight: 18,
          color: theme.colors.textSecondary,
          marginBottom: 14,
        }}
      >
        Crée des listes pour organiser tes watch parties, thèmes ou découvertes.
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.tint,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 10,
          alignSelf: "flex-start",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
          + Nouvelle liste
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function Lists() {
  const scheme = useColorScheme();
  const theme = getTheme(scheme);
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentInsetAdjustmentBehavior="automatic"
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
      <View style={{ flexDirection: "row", flexWrap: "wrap", paddingLeft: 20 }}>
        <PillButton label="Watchlist" />
        <PillButton label="Terminé" />
        <PillButton label="À revoir" />
        <PillButton label="Favoris" />
        <PillButton label="Listes perso" />
      </View>

      {/* Watchlist section */}
      <SectionHeader title="Watchlist" action="Tout voir" />
      <HorizontalList data={mockWatchlist} />

      {/* Finished section */}
      <SectionHeader title="Terminé récemment" action="Historique" />
      <HorizontalList data={mockFinished} />

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

      {/* Custom lists empty state */}
      <SectionHeader title="Listes personnalisées" action="Créer" />
      <EmptyCustomLists />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}
