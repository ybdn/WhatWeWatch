import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert 
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';
import { useList } from '../context/ListContext';
import { ListServiceSupabase } from '../lib/listServiceSupabase';

interface DebugPanelProps {
  visible: boolean;
  onClose: () => void;
}

export default function DebugPanel({ visible, onClose }: DebugPanelProps) {
  const theme = useTheme();
  const listManager = useList();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      gatherDebugInfo();
    }
  }, [visible]);

  const gatherDebugInfo = async () => {
    setLoading(true);
    try {
      const info: any = {
        timestamp: new Date().toISOString(),
        supabaseAvailable: !!supabase,
        envVars: {
          supabaseUrl: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
          supabaseKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
        }
      };

      // Vérifier l'utilisateur connecté
      if (supabase) {
        try {
          const { data: { user }, error } = await supabase.auth.getUser();
          info.user = {
            authenticated: !!user,
            id: user?.id || null,
            email: user?.email || null,
            error: error?.message || null
          };

          // Si utilisateur connecté, vérifier les données Supabase avec détails
          if (user) {
            try {
              // Récupérer toutes les données pour diagnostic complet
              const { data, error } = await supabase
                .from('user_content_status')
                .select('*')
                .eq('user_id', user.id);

              if (error) {
                info.supabaseData = {
                  error: error.message
                };
              } else {
                const watchlistItems = data?.filter(item => item.in_watchlist) || [];
                const finishedItems = data?.filter(item => item.is_finished) || [];
                const favoriteItems = data?.filter(item => item.is_favorite) || [];

                info.supabaseData = {
                  totalItems: data?.length || 0,
                  breakdown: {
                    watchlist: watchlistItems.length,
                    finished: finishedItems.length,
                    favorites: favoriteItems.length
                  },
                  sample: data?.slice(0, 3).map(item => ({
                    id: item.content_id,
                    title: item.content_data?.title || 'Unknown',
                    watchlist: item.in_watchlist,
                    finished: item.is_finished,
                    favorite: item.is_favorite
                  })) || [],
                  error: null
                };
              }
            } catch (err) {
              info.supabaseData = {
                error: (err as Error).message
              };
            }
          }
        } catch (authError) {
          info.user = {
            error: (authError as Error).message
          };
        }
      }

      // Statistiques des listes locales
      info.localStats = listManager.getStats();

      setDebugInfo(info);
    } catch (error) {
      console.error('Error gathering debug info:', error);
      setDebugInfo({
        error: (error as Error).message
      });
    } finally {
      setLoading(false);
    }
  };

  const forceMigration = async () => {
    try {
      setLoading(true);
      await ListServiceSupabase.migrateLocalDataToSupabase();
      await listManager.refreshAllLists();
      Alert.alert('Migration', 'Migration des données terminée');
      gatherDebugInfo();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors de la migration: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const refreshLists = async () => {
    try {
      setLoading(true);
      await listManager.refreshAllLists();
      Alert.alert('Refresh', 'Listes rechargées');
      gatherDebugInfo();
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors du rechargement: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <View style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
      zIndex: 1000,
    }}>
      <View style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        marginTop: 50,
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 20,
      }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.cardBorder,
          paddingBottom: 15,
        }}>
          <Text style={{
            color: theme.colors.text,
            fontSize: 18,
            fontWeight: 'bold',
          }}>
            🔍 Debug Panel
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: theme.colors.card,
              paddingHorizontal: 15,
              paddingVertical: 8,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: theme.colors.text }}>Fermer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }}>
          {loading ? (
            <Text style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>
              Chargement des informations de debug...
            </Text>
          ) : (
            <View>
              <Text style={{
                color: theme.colors.text,
                fontSize: 16,
                fontWeight: 'bold',
                marginBottom: 10,
              }}>
                📊 État du système
              </Text>

              <View style={{ marginBottom: 20 }}>
                <Text style={{ color: theme.colors.textSecondary }}>
                  Supabase disponible: {debugInfo.supabaseAvailable ? '✅' : '❌'}
                </Text>
                <Text style={{ color: theme.colors.textSecondary }}>
                  Variables d&apos;environnement: URL {debugInfo.envVars?.supabaseUrl ? '✅' : '❌'} | Key {debugInfo.envVars?.supabaseKey ? '✅' : '❌'}
                </Text>
              </View>

              {debugInfo.user && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{
                    color: theme.colors.text,
                    fontSize: 16,
                    fontWeight: 'bold',
                    marginBottom: 5,
                  }}>
                    👤 Utilisateur
                  </Text>
                  <Text style={{ color: theme.colors.textSecondary }}>
                    Authentifié: {debugInfo.user.authenticated ? '✅' : '❌'}
                  </Text>
                  {debugInfo.user.authenticated && (
                    <>
                      <Text style={{ color: theme.colors.textSecondary }}>
                        ID: {debugInfo.user.id}
                      </Text>
                      <Text style={{ color: theme.colors.textSecondary }}>
                        Email: {debugInfo.user.email}
                      </Text>
                    </>
                  )}
                  {debugInfo.user.error && (
                    <Text style={{ color: '#ef4444' }}>
                      Erreur: {debugInfo.user.error}
                    </Text>
                  )}
                </View>
              )}

              {debugInfo.supabaseData && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{
                    color: theme.colors.text,
                    fontSize: 16,
                    fontWeight: 'bold',
                    marginBottom: 5,
                  }}>
                    ☁️ Données Supabase
                  </Text>
                  <Text style={{ color: theme.colors.textSecondary }}>
                    Items trouvés: {debugInfo.supabaseData.totalItems}
                  </Text>
                  {debugInfo.supabaseData.breakdown && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={{ color: theme.colors.textSecondary }}>
                        📋 Watchlist: {debugInfo.supabaseData.breakdown.watchlist}
                      </Text>
                      <Text style={{ color: theme.colors.textSecondary }}>
                        ✅ Terminés: {debugInfo.supabaseData.breakdown.finished}
                      </Text>
                      <Text style={{ color: theme.colors.textSecondary }}>
                        ❤️ Favoris: {debugInfo.supabaseData.breakdown.favorites}
                      </Text>
                    </View>
                  )}
                  {debugInfo.supabaseData.error && (
                    <Text style={{ color: '#ef4444' }}>
                      Erreur: {debugInfo.supabaseData.error}
                    </Text>
                  )}
                  {debugInfo.supabaseData.sample?.length > 0 && (
                    <View style={{ marginTop: 8, backgroundColor: theme.colors.card, padding: 8, borderRadius: 6 }}>
                      <Text style={{ color: theme.colors.textSecondary, fontSize: 12, fontWeight: 'bold' }}>
                        Échantillon:
                      </Text>
                      {debugInfo.supabaseData.sample.map(
                        (item: { id: string; title: string; watchlist: boolean; finished: boolean; favorite: boolean }, index: number) => (
                          <Text key={index} style={{ color: theme.colors.textSecondary, fontSize: 11, marginTop: 2 }}>
                            {item.title} - W:{item.watchlist ? '✅' : '❌'} F:{item.finished ? '✅' : '❌'} ❤:{item.favorite ? '✅' : '❌'}
                          </Text>
                        )
                      )}
                    </View>
                  )}
                </View>
              )}

              <View style={{ marginBottom: 20 }}>
                <Text style={{
                  color: theme.colors.text,
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginBottom: 5,
                }}>
                  📱 Données locales
                </Text>
                <Text style={{ color: theme.colors.textSecondary }}>
                  Watchlist: {debugInfo.localStats?.watchlistCount || 0} items
                </Text>
                <Text style={{ color: theme.colors.textSecondary }}>
                  Terminés: {debugInfo.localStats?.finishedCount || 0} items
                </Text>
                <Text style={{ color: theme.colors.textSecondary }}>
                  Favoris: {debugInfo.localStats?.favoritesCount || 0} items
                </Text>
              </View>

              {debugInfo.error && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>
                    ❌ Erreur générale: {debugInfo.error}
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View style={{
          flexDirection: 'row',
          gap: 10,
          marginTop: 20,
        }}>
          <TouchableOpacity
            onPress={gatherDebugInfo}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: theme.colors.tint,
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              🔄 Actualiser
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={refreshLists}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: '#22c55e',
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              📋 Recharger listes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={forceMigration}
            disabled={loading}
            style={{
              flex: 1,
              backgroundColor: '#f59e0b',
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              🔄 Migrer
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}