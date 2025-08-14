import React, { useEffect, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastProps {
  message: ToastMessage | null;
  onHide: () => void;
}

export function Toast({ message, onHide }: ToastProps) {
  const theme = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (message) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, message.duration || 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!message) return null;

  const getBackgroundColor = () => {
    switch (message.type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'info':
      default:
        return theme.colors.tint;
    }
  };

  const getIcon = () => {
    switch (message.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        zIndex: 1000,
        opacity: fadeAnim,
        transform: [{ translateY }],
      }}
    >
      <View
        style={{
          backgroundColor: getBackgroundColor(),
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: 'bold',
            marginRight: 8,
          }}
        >
          {getIcon()}
        </Text>
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '500',
            flex: 1,
          }}
          numberOfLines={2}
        >
          {message.message}
        </Text>
      </View>
    </Animated.View>
  );
}

// Hook pour gérer les toasts
export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration?: number) => {
    const id = Date.now().toString();
    setToast({ id, message, type, duration });
  };

  const hideToast = () => {
    setToast(null);
  };

  return {
    toast,
    showToast,
    hideToast,
  };
}