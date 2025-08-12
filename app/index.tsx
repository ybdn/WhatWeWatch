import {View, Text } from "react-native";

export default function Index() {
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
        WhatWeWatch arrive bientôt ! 🔥
      </Text>
    </View>
  );
}
