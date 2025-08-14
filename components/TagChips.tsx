import React from "react";
import {
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { useTheme } from "../hooks/useTheme";

export interface TagChipItem {
  id: string;
  label: string;
  onPress?: () => void;
}

interface TagChipsProps {
  items: TagChipItem[];
  containerStyle?: any;
  chipStyle?: any;
  textStyle?: any;
}

function TagChip({ 
  item, 
  chipStyle, 
  textStyle 
}: { 
  item: TagChipItem; 
  chipStyle?: any;
  textStyle?: any;
}) {
  const theme = useTheme();
  
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Tag ${item.label}`}
      onPress={item.onPress}
      style={[
        {
          paddingHorizontal: 14,
          paddingVertical: 8,
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.cardBorder,
          borderWidth: 1,
          borderRadius: 999,
          marginRight: 8,
        },
        chipStyle,
      ]}
    >
      <Text
        style={[
          {
            color: theme.colors.text,
            fontSize: 13,
            fontWeight: "500",
          },
          textStyle,
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

export default function TagChips({
  items,
  containerStyle,
  chipStyle,
  textStyle,
}: TagChipsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
        }}
        renderItem={({ item }) => (
          <TagChip
            item={item}
            chipStyle={chipStyle}
            textStyle={textStyle}
          />
        )}
        ListFooterComponent={<View style={{ width: 8 }} />}
      />
    </View>
  );
}

