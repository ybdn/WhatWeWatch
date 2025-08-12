import { Redirect } from "expo-router";

// Page racine: redirige vers les tabs authentifiées
export default function RootIndex() {
  return <Redirect href="/(tabs)" />;
}
