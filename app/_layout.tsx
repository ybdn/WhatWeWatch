import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, Text, useColorScheme } from "react-native";
import { getTheme } from "../theme/colors";

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = getTheme(scheme);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitleAlign: "center",
        headerTitle: () => (
          <Text
            style={{
              color: theme.colors.text,
              fontSize: 18,
              fontWeight: "700",
              letterSpacing: 0.5,
            }}
          >
            WhatWeWatch
          </Text>
        ),
        headerStyle: {
          backgroundColor: theme.colors.card,
        },
        headerTintColor: theme.colors.text,
        headerShadowVisible: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBarBg,
          borderTopColor: theme.colors.cardBorder,
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
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
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
