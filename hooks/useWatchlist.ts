import { useMovieData } from "./useMovieData";

export function useWatchlist() {
  const { 
    watchlist, 
    watchlistLoading,
    recentlyFinished, 
    recentlyFinishedLoading 
  } = useMovieData();
  
  const hasWatchlistItems = watchlist.length > 0;
  const hasFinishedItems = recentlyFinished.length > 0;

  return {
    watchlist,
    watchlistLoading,
    finished: recentlyFinished,
    finishedLoading: recentlyFinishedLoading,
    hasWatchlistItems,
    hasFinishedItems,
  };
}