import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, Text } from "react-native";

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitleAlign: "center",
        headerTitle: () => (
          <Text style={{
            color: "#fff",
            fontSize: 18,
            fontWeight: "700",
            letterSpacing: 0.5,
          }}>
            WhatWeWatch
          </Text>
        ),
        headerStyle: {
          backgroundColor: "#0e1015",
        },
        headerShadowVisible: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: {
          backgroundColor: "#12141b",
          borderTopColor: "#1f2330",
          paddingTop: 4,
          height: Platform.select({ ios: 88, android: 70, default: 60 }),
          paddingBottom: Platform.select({ ios: 24, android: 16, default: 8 }),
        },
        tabBarIcon: ({ color, size }) => {
          let name: keyof typeof Ionicons.glyphMap = "home";
          switch (route.name) {
            case "index":
              name = "home";
              break;
            case "explore":
              name = "search";
              break;
            case "lists":
              name = "list";
              break;
            case "profile":
              name = "person";
              break;
          }
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Accueil" }} />
      <Tabs.Screen name="explore" options={{ title: "Explorer" }} />
      <Tabs.Screen name="lists" options={{ title: "Listes" }} />
      <Tabs.Screen name="profile" options={{ title: "Profil" }} />
    </Tabs>
  );
}
