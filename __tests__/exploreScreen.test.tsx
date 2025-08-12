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

jest.mock("../lib/searchService", () => ({
  searchMedia: jest.fn(async (q: string) =>
    q.length < 2
      ? []
      : [
          {
            id: "1",
            title: "Mock Film",
            overview: "A mocked film entry.",
          },
        ]
  ),
}));

jest.mock("../lib/curatedCollections", () => ({
  curatedCollections: [
    {
      id: "mock_coll",
      title: "Section Test",
      items: [
        { id: "c1", title: "Card 1", color: "#123456" },
        { id: "c2", title: "Card 2", color: "#654321" },
      ],
    },
  ],
}));

// Mock useAsync pour avoir un cycle stable sans setState async hors act
jest.mock("../hooks/useAsync", () => ({
  useAsync: (fn: any) => ({
    data: [],
    loading: false,
    error: null,
    refetch: fn,
    cancel: () => {},
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
  it("renders", () => {
    act(() => {
      renderer.create(<ExploreScreen />);
    });
  });
});
