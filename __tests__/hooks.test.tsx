import React from "react";
import renderer, { act } from "react-test-renderer";
import { useAsync } from "../hooks/useAsync";
import { useDebounce } from "../hooks/useDebounce";
// Mock ciblé de react-native avant import useTheme si nécessaire
import * as RN from "react-native";
import { useTheme } from "../hooks/useTheme";
jest.spyOn(RN, "useColorScheme").mockReturnValue("light");

// Helper pour tester un hook en encapsulant sa valeur rendue
function HookTester({
  hook,
  onValue,
}: {
  hook: () => any;
  onValue: (v: any) => void;
}) {
  const value = hook();
  onValue(value);
  return null;
}

describe("hooks", () => {
  jest.useFakeTimers();

  it("useDebounce retarde la mise à jour", () => {
    let last: any;
    function Wrapper({ value }: { value: string }) {
      const debounced = useDebounce(value, 500);
      last = debounced;
      return null;
    }
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<Wrapper value="a" />);
    });
    expect(last).toBe("a");
    act(() => {
      tree.update(<Wrapper value="ab" />);
    });
    expect(last).toBe("a");
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(last).toBe("ab");
  });

  it("useAsync charge et renvoie data", async () => {
    const values: any[] = [];
    const fn = jest.fn().mockResolvedValue("RESULT");
    await act(async () => {
      renderer.create(
        <HookTester
          hook={() => useAsync(fn, [])}
          onValue={(v) => values.push({ loading: v.loading, data: v.data })}
        />
      );
    });
    // Première capture: loading true puis false avec data
    expect(values.some((v) => v.loading)).toBe(true);
    expect(values.some((v) => v.data === "RESULT")).toBe(true);
  });

  it("useTheme retourne structure theme", () => {
    let theme: any;
    act(() => {
      renderer.create(
        <HookTester hook={useTheme} onValue={(v) => (theme = v)} />
      );
    });
    expect(theme).toBeTruthy();
    expect(theme.colors).toBeTruthy();
  });
});
