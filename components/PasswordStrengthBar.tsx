import React from "react";
import { View } from "react-native";
import { passwordScore } from "../lib/password";

export const PasswordStrengthBar = ({ password }: { password: string }) => {
  const score = passwordScore(password); // 0-4
  const total = 4;
  const segments = Array.from({ length: total });
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {segments.map((_, i) => {
        const active = i < score;
        const color = active
          ? score <= 1
            ? "#d9534f"
            : score === 2
            ? "#f0ad4e"
            : score === 3
            ? "#5bc0de"
            : "#5cb85c"
          : "#ccc";
        return (
          <View
            key={i}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              backgroundColor: color,
            }}
          />
        );
      })}
    </View>
  );
};
