import { View, Text } from "react-native";

export default function Explore() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          textAlign: "center",
          margin: 16,
        }}
      >
        Check out your watchlist on WhatWeWatch! 📺
      </Text>
    </View>
  );
}
