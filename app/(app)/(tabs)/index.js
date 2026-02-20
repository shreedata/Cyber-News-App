import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { fetchNews, checkSupabaseConnection, addBookmark, removeBookmark } from '../../../lib/api';

export default function FeedScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [news, setNews] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [session, setSession] = useState(null);

  const loadNews = async (pageNum, refresh = false) => {
    try {
      setError(null);
      console.log('Loading news page:', pageNum);
      
      const normalizedNews = await fetchNews(pageNum);
      console.log('Received news items:', normalizedNews.length);
      
      if (normalizedNews.length === 0) {
        if (pageNum === 1) {
          setError('No news available at the moment. Please try again later.');
        }
        setHasMore(false);
        return;
      }
  
      setNews(prev => refresh ? normalizedNews : [...prev, ...normalizedNews]);
      setPage(pageNum);
    } catch (err) {
      console.error('Error loading news:', err);
      setError(err.message || 'Failed to load news. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Check Supabase connection when component mounts
    checkSupabaseConnection().then(isConnected => {
      if (!isConnected) {
        console.error('Failed to connect to Supabase');
      }
    });

    const handleUnauthorized = (error) => {
      if (error?.message?.includes('unauthorized')) {
        router.replace('/(auth)/login');
      }
    };

    loadNews(1).catch(handleUnauthorized);
  }, [router]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNews(1, true);
  }, []);

  const toggleLike = (id) => {
    setNews(prev =>
      prev.map(item =>
        item.id === id ? { ...item, liked: !item.liked } : item
      )
    );
  };

  const toggleBookmark = async (id) => {
    if (!session?.user?.id) {
      Alert.alert('Error', 'Please log in to bookmark articles');
      return;
    }

    try {
      const article = news.find(item => item.id === id);
      if (!article) return;

      if (!article.bookmarked) {
        await addBookmark(article, session.user.id);
        Alert.alert('Success', 'Article bookmarked successfully');
      } else {
        await removeBookmark(id, session.user.id);
        Alert.alert('Success', 'Bookmark removed successfully');
      }

      setNews(prev =>
        prev.map(item =>
          item.id === id ? { ...item, bookmarked: !item.bookmarked } : item
        )
      );
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      Alert.alert('Error', 'Failed to update bookmark');
    }
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.secondary },
      ]}>
      <Text style={[styles.title, { color: theme.text }]}>
        {item.title}
      </Text>
      <Text
        style={[styles.summary, { color: theme.text }]}
        numberOfLines={3}>
        {item.summary}
      </Text>
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => Linking.openURL(item.url)}
          style={styles.sourceContainer}>
          <Text style={[styles.source, { color: theme.accent }]}>
            {item.source}
          </Text>
          <Text style={[styles.timestamp, { color: theme.text }]}>
            • {item.timestamp}
          </Text>
        </TouchableOpacity>
        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => toggleLike(item.id)}
            style={styles.actionButton}>
            <Ionicons
              name={item.liked ? 'heart' : 'heart-outline'}
              size={24}
              color={item.liked ? theme.accent : theme.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => toggleBookmark(item.id)}
            style={styles.actionButton}>
            <Ionicons
              name={item.bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={item.bookmarked ? theme.accent : theme.text}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.accent} />
      </View>
    );
  };

  if (loading && news.length === 0) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.primary }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (error && news.length === 0) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.primary }]}>
        <Text style={[styles.error, { color: theme.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.accent }]}
          onPress={() => loadNews(1, true)}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.primary }]}>
      <FlatList
        data={news}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.text}
          />
        }
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (!loading && hasMore) {
            loadNews(page + 1);
          }
        }}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summary: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  source: {
    fontSize: 14,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 14,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 16,
  },
  error: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    padding: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});
