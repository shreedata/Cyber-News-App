import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext'; // Updated import path

const BookmarksScreen = ({ navigation }) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    console.log('BookmarksScreen mounted');
    fetchBookmarks();
    return () => {
      console.log('BookmarksScreen unmounted');
    };
  }, []);

  const fetchBookmarks = async () => {
    console.log('fetchBookmarks called, user:', user);
    try {
      setLoading(true);
      
      // Add a safety timeout
      const safetyTimeout = setTimeout(() => {
        if (loading) {
          console.log('Safety timeout triggered');
          setLoading(false);
        }
      }, 5000); // 5 seconds timeout
      
      if (!user) {
        console.log('No user found');
        clearTimeout(safetyTimeout);
        setLoading(false);
        return;
      }
      
      // This is a placeholder for your actual Supabase query
      // You'll need to properly set up the Supabase client in your project
      
      // For now, we'll set some mock data
      setTimeout(() => {
        setBookmarks([
          {
            id: '1',
            title: 'Understanding Ransomware Attacks',
            content: 'Ransomware attacks continue to pose significant threats to organizations worldwide. This article explores prevention strategies and recovery options.',
            published_at: new Date().toISOString(),
          },
          {
            id: '2',
            title: 'The Rise of Zero Trust Security Models',
            content: 'Zero Trust architectures are becoming increasingly popular as organizations move away from traditional perimeter-based security approaches.',
            published_at: new Date(Date.now() - 86400000).toISOString(),
          }
        ]);
        clearTimeout(safetyTimeout);
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error in fetchBookmarks:', error);
      setLoading(false);
    }
  };

  const removeBookmark = async (articleId) => {
    try {
      if (!user) return;
      
      // This is a placeholder for your actual Supabase deletion
      // In a real implementation, you would call your Supabase client here
      
      // Update the UI by removing the article from the current bookmarks list
      setBookmarks(prevBookmarks => prevBookmarks.filter(bookmark => bookmark.id !== articleId));
    } catch (error) {
      console.error('Error in removeBookmark:', error);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.articleContainer}
      onPress={() => navigation.navigate('ArticleDetail', { article: item })}
    >
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body} numberOfLines={3}>{item.content}</Text>
        <View style={styles.metaContainer}>
          <Text style={styles.date}>
            {new Date(item.published_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.bookmarkButton}
        onPress={() => removeBookmark(item.id)}
      >
        <Ionicons name="bookmark" size={24} color="#007AFF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bookmark-outline" size={60} color="#999" />
        <Text style={styles.emptyText}>No bookmarked articles yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookmarks}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        onRefresh={fetchBookmarks}
        refreshing={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
  listContainer: {
    padding: 10,
  },
  articleContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 12,
    padding: 15,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#222',
  },
  body: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  bookmarkButton: {
    padding: 5,
  },
});

export default BookmarksScreen;