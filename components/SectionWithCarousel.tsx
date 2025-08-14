import React, { useState, useEffect } from "react";
import {
  FlatList,
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../hooks/useTheme";
import ContentModal from "./ContentModal";

interface CarouselItem {
  id: string;
  title: string;
  type: string; // Type de contenu (Film, S\u00e9rie, etc.)
  color: string;
  year: number;
  rating: number;
  synopsis: string;
  director?: string;
  duration: string;
  genres: string[];
  posterUrl?: string;
  backdropUrl?: string;
  originalLanguage?: string;
  popularity?: number;
}

interface SectionWithCarouselProps {
  title: string;
  subtitle?: string;
  action?: string;
  data?: CarouselItem[];
  showAsEmpty?: boolean;
  emptyMessage?: string;
  onActionPress?: () => void;
  onItemPress?: (item: CarouselItem) => void;
  noPadding?: boolean; // Pour s'adapter au padding du parent
  // Nouvelles props pour le système de listes
  showAddButton?: boolean; // Afficher le bouton + pour ajouter à la watchlist
  showFinishedButton?: boolean; // Afficher le bouton ✓ pour marquer comme terminé
  onAddToWatchlist?: (item: CarouselItem) => void;
  onMarkAsFinished?: (item: CarouselItem) => void;
  isInWatchlist?: (contentId: string) => boolean;
  isFinished?: (contentId: string) => boolean;
}

const LAYOUT = {
  screenPadding: 16,
  sectionGap: 28,
  cardRadius: 14,
};

function SectionTitle({
  title,
  subtitle,
  action,
  onActionPress,
}: {
  title: string;
  subtitle?: string;
  action?: string;
  onActionPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: subtitle ? 2 : 8,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: 18,
            fontWeight: "700",
            letterSpacing: -0.3,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: 12,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {action && (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onActionPress}
          style={{ marginTop: 2 }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "500",
              color: theme.colors.tint,
            }}
          >
            {action}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function CarouselCard({
  item,
  onPress,
  showAddButton = false,
  showFinishedButton = false,
  onAddToWatchlist,
  onMarkAsFinished,
  isInWatchlist,
  isFinished,
}: {
  item: CarouselItem;
  onPress?: (item: CarouselItem) => void;
  showAddButton?: boolean;
  showFinishedButton?: boolean;
  onAddToWatchlist?: (item: CarouselItem) => void;
  onMarkAsFinished?: (item: CarouselItem) => void;
  isInWatchlist?: (contentId: string) => boolean;
  isFinished?: (contentId: string) => boolean;
}) {
  const theme = useTheme();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(item.posterUrl);
  
  // Reset states when item changes
  useEffect(() => {
    setImageLoading(true);
    setImageError(false);
    setCurrentImageUrl(item.posterUrl);
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      setLoadingTimeout(null);
    }
  }, [item.id, item.posterUrl]);

  // Timeout pour éviter les images qui ne se chargent jamais
  useEffect(() => {
    if (item.posterUrl && !imageError && imageLoading) {
      const timeout = setTimeout(() => {
        console.warn(`Image timeout for: ${item.title} - ${item.posterUrl}`);
        setImageError(true);
        setImageLoading(false);
      }, 5000); // Réduit à 5 secondes pour une meilleure UX
      
      setLoadingTimeout(timeout as any);
      
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [item.posterUrl, imageError, imageLoading, item.title]);
  
  // Cleanup timeout when component unmounts
  useEffect(() => {
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [loadingTimeout]);

  // Helper function to validate URL
  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return url.includes('image.tmdb.org') || url.startsWith('http');
    } catch {
      return false;
    }
  };

  const handleImageLoadStart = () => {
    setImageLoading(true);
  };

  const handleImageLoadEnd = () => {
    setImageLoading(false);
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      setLoadingTimeout(null);
    }
  };

  const handleImageError = (error: any) => {
    console.warn(`Image failed to load for: ${item.title}`);
    console.warn(`Failed URL: ${currentImageUrl}`);
    console.warn('Error details:', error);
    
    // Essayer avec une taille différente d'image si disponible
    if (currentImageUrl?.includes('/w500/') && item.posterUrl) {
      const fallbackUrl = item.posterUrl.replace('/w500/', '/w300/');
      console.log(`Trying fallback URL: ${fallbackUrl}`);
      setCurrentImageUrl(fallbackUrl);
      setImageLoading(true);
      return;
    }
    
    // Si tous les fallbacks ont échoué, afficher l'erreur
    setImageError(true);
    setImageLoading(false);
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      setLoadingTimeout(null);
    }
  };
  
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir ${item.title}`}
      onPress={() => onPress?.(item)}
      style={{
        width: 120,
        height: 170,
        marginHorizontal: 4,
        borderRadius: LAYOUT.cardRadius,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
        overflow: "hidden",
        backgroundColor: item.color || theme.colors.card,
      }}
    >
      {/* Image de fond ou couleur de fallback */}
      {isValidImageUrl(currentImageUrl) && !imageError ? (
        <>
          <Image
            key={`${item.id}-${currentImageUrl}`}
            source={{ 
              uri: currentImageUrl,
              cache: 'reload'
            }}
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
            }}
            onLoadStart={handleImageLoadStart}
            onLoadEnd={handleImageLoadEnd}
            onError={handleImageError}
            resizeMode="cover"
          />
          {imageLoading && (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: item.color || theme.colors.card,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator color="#fff" size="small" />
            </View>
          )}
        </>
      ) : (
        // Fallback avec couleur de fond si pas d'image ou erreur de chargement
        <View
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: item.color || theme.colors.card,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Icône de fallback pour indiquer l'absence d'image */}
          <Text style={{
            color: "rgba(255, 255, 255, 0.4)",
            fontSize: 12,
            textAlign: "center",
            paddingHorizontal: 8,
          }}>
            📷
          </Text>
        </View>
      )}
      
      {/* Boutons d'action */}
      {(showAddButton || showFinishedButton) && (
        <View style={{
          position: 'absolute',
          top: 8,
          right: 8,
          gap: 6,
        }}>
          {/* Bouton marquer comme terminé (pour watchlist) */}
          {showFinishedButton && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onMarkAsFinished?.(item);
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
              }}
              accessibilityLabel="Marquer comme terminé"
              accessibilityRole="button"
            >
              <Text style={{ color: '#4CAF50', fontSize: 16, fontWeight: 'bold' }}>✓</Text>
            </Pressable>
          )}
          
          {/* Bouton ajouter à la watchlist */}
          {showAddButton && !isInWatchlist?.(item.id) && !isFinished?.(item.id) && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onAddToWatchlist?.(item);
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.3)',
              }}
              accessibilityLabel="Ajouter à la watchlist"
              accessibilityRole="button"
            >
              <Text style={{ color: '#2196F3', fontSize: 18, fontWeight: 'bold' }}>+</Text>
            </Pressable>
          )}
        </View>
      )}
      
      {/* Overlay gradient et texte */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          // background: "linear-gradient(transparent, rgba(0,0,0,0.8))", // Not supported in RN
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          padding: 10,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 10, opacity: 0.9, marginBottom: 4 }}>
          {item.type}
        </Text>
        <Text
          style={{ 
            color: "#fff", 
            fontSize: 13, 
            fontWeight: "600",
            textShadowColor: "rgba(0, 0, 0, 0.8)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.title}
        </Text>
      </View>
    </Pressable>
  );
}

function EmptyState({ message, horizontalPadding }: { message: string; horizontalPadding: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        padding: 20,
        marginHorizontal: horizontalPadding,
        borderRadius: 14,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
      }}
    >
      <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
        {message}
      </Text>
    </View>
  );
}

export default function SectionWithCarousel({
  title,
  subtitle,
  action,
  data = [],
  showAsEmpty = false,
  emptyMessage = "Aucun contenu disponible.",
  onActionPress,
  onItemPress,
  noPadding = false,
  showAddButton = false,
  showFinishedButton = false,
  onAddToWatchlist,
  onMarkAsFinished,
  isInWatchlist,
  isFinished,
}: SectionWithCarouselProps) {
  const [selectedItem, setSelectedItem] = useState<CarouselItem | null>(null);
  const hasData = data.length > 0 && !showAsEmpty;

  const horizontalPadding = noPadding ? 0 : LAYOUT.screenPadding;

  const handleItemPress = (item: CarouselItem) => {
    if (onItemPress) {
      onItemPress(item);
    } else {
      setSelectedItem(item);
    }
  };
  
  return (
    <View style={{ marginBottom: noPadding ? 0 : LAYOUT.sectionGap }}>
      <View
        style={{
          paddingHorizontal: horizontalPadding,
          marginBottom: 10,
        }}
      >
        <SectionTitle
          title={title}
          subtitle={subtitle}
          action={hasData ? action : undefined}
          onActionPress={onActionPress}
        />
      </View>
      {hasData ? (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: noPadding ? 0 : horizontalPadding - 4,
          }}
          renderItem={({ item }) => (
            <CarouselCard 
              item={item} 
              onPress={handleItemPress}
              showAddButton={showAddButton}
              showFinishedButton={showFinishedButton}
              onAddToWatchlist={onAddToWatchlist}
              onMarkAsFinished={onMarkAsFinished}
              isInWatchlist={isInWatchlist}
              isFinished={isFinished}
            />
          )}
          ListFooterComponent={<View style={{ width: 4 }} />}
        />
      ) : (
        <EmptyState message={emptyMessage} horizontalPadding={horizontalPadding} />
      )}
      
      <ContentModal
        visible={selectedItem !== null}
        item={selectedItem as any} // CarouselItem is compatible with ContentItem for display
        onClose={() => setSelectedItem(null)}
      />
    </View>
  );
}

export type { CarouselItem };