import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

interface ToastState {
  id: number;
  message: string;
  type?: "info" | "success" | "error";
}
interface ToastContextValue {
  show: (
    message: string,
    type?: ToastState["type"],
    durationMs?: number
  ) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const show = useCallback(
    (message: string, type: ToastState["type"] = "info", durationMs = 3000) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, durationMs);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <View pointerEvents="none" style={styles.container}>
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} />
        ))}
      </View>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ message, type }: ToastState) => {
  const opacity = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
  }, [opacity]);
  const bg =
    type === "error" ? "#B00020" : type === "success" ? "#0B8457" : "#333";
  return (
    <Animated.View style={[styles.toast, { backgroundColor: bg, opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 8,
  },
  toast: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginVertical: 4,
    maxWidth: "90%",
  },
  text: { color: "white", fontWeight: "600" },
});
