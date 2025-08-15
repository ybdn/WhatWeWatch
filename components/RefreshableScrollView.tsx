import React, { useState, ReactNode } from 'react';
import { ScrollView, RefreshControl, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface RefreshableScrollViewProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  overScrollMode?: 'auto' | 'always' | 'never';
  alwaysBounceVertical?: boolean;
}

export default function RefreshableScrollView({
  children,
  onRefresh,
  style,
  contentContainerStyle,
  overScrollMode = "never",
  alwaysBounceVertical = false,
}: RefreshableScrollViewProps) {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={style}
      contentContainerStyle={contentContainerStyle}
      overScrollMode={overScrollMode}
      alwaysBounceVertical={alwaysBounceVertical}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.tint}
          colors={[theme.colors.tint]}
        />
      }
    >
      {children}
    </ScrollView>
  );
}