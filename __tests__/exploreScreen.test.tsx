import React from "react";
import renderer, { act } from "react-test-renderer";
import ExploreScreen from "../app/(tabs)/explore";

jest.mock("../hooks/useTheme", () => ({
  useTheme: () => ({
    scheme: "light",
    colors: {
      background: "#fff",
      card: "#f0f0f0",
      cardBorder: "#e0e0e0",
      text: "#111",
      textSecondary: "#666",
      tint: "#1b63d8",
      tabBarBg: "#fff",
      tabBarActive: "#1b63d8",
      tabBarInactive: "#888",
    },
  }),
}));

// Nouveau hook unifié pour Explore
jest.mock("../hooks/useExploreData", () => ({
  useExploreData: () => ({
    query: "",
    setQuery: jest.fn(),
    debounced: "",
    loading: false,
    error: false,
    showEmpty: false,
    sections: [
      {
        id: "top",
        title: "Top recherché",
        type: "top",
        items: [{ id: "t1", title: "Top 1" }],
      },
      {
        id: "trending",
        title: "Tendances",
        type: "trending",
        items: [{ id: "tr1", title: "Trend 1" }],
      },
      {
        id: "mock_coll",
        title: "Section Test",
        type: "collection",
        items: [{ id: "c1", title: "Card 1", color: "#123456" }],
      },
    ],
  }),
}));

// Silence des console.error spécifiques act (optionnel)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    const msg = args[0];
    if (typeof msg === "string" && msg.includes("not wrapped in act")) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});

describe("ExploreScreen", () => {
  it("renders sections", () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<ExploreScreen />);
    });
    const json = tree.toJSON();
    expect(json).toBeTruthy();
  });
});
