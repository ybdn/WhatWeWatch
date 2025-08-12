import { Text, useColorScheme, View } from "react-native";
import { getTheme } from "../theme/colors";

export default function Lists() {
  const scheme = useColorScheme();
  const theme = getTheme(scheme);
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.colors.background,
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
        Gèrez vos listes de films et séries sur WhatWeWatch ! 📚
      </Text>
    </View>
  );
}
