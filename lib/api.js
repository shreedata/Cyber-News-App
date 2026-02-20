import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { API_CONFIG } from '../config/api.config';
import { supabase } from './supabase';

const CONFIG = API_CONFIG;

function normalizeNewsData(articles, source) {
  if (!articles || !Array.isArray(articles)) return [];
  
  return articles.map((article, index) => ({
    id: `${source}-${index}-${Date.now()}`,
    title: article.title || 'No title available',
    summary: article.description || article.content || article.snippet || 'No description available',
    url: article.url || article.link || '#',
    source: article.source?.name || article.source || source,
    timestamp: formatDistanceToNow(
      new Date(article.publishedAt || article.pubDate || article.datePublished || Date.now()),
      { addSuffix: true }
    ),
    liked: false,
    bookmarked: false,
    imageUrl: article.urlToImage || article.image || null,
  }));
}

async function fetchNewsApi(page = 1) {
  try {
    console.log('Fetching from NewsAPI with config:', CONFIG.newsApi);
    const response = await axios.get(`${CONFIG.newsApi.url}${CONFIG.newsApi.endpoint}`, {
      params: {
        q: 'cybercrime',
        page,
        apiKey: CONFIG.newsApi.key,
        pageSize: 10,
        language: 'en',
        sortBy: 'publishedAt',
      },
    });
    console.log('NewsAPI response:', response.data);
    return normalizeNewsData(response.data.articles, 'NewsAPI');
  } catch (error) {
    console.error('NewsAPI Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    return [];
  }
}

async function fetchGNews(page = 1) {
  try {
    console.log('Fetching from GNews with config:', CONFIG.gNews);
    const response = await axios.get(`${CONFIG.gNews.url}${CONFIG.gNews.endpoint}`, {
      params: {
        q: 'cybercrime',
        apikey: CONFIG.gNews.key, // Changed back to apikey
        lang: 'en',
        country: 'us',
        max: 10,
        page
      },
    });
    console.log('GNews response:', response.data);
    return normalizeNewsData(response.data.articles, 'GNews');
  } catch (error) {
    console.error('GNews Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    return [];
  }
}

async function fetchContextualWeb(page = 1) {
  try {
    const response = await axios.get(`${CONFIG.contextualWeb.url}${CONFIG.contextualWeb.endpoint}`, {
      params: {
        q: 'cybercrime',
        pageNumber: page,
        pageSize: 10,
        withThumbnails: true,
        location: 'us',
      },
      headers: {
        'x-rapidapi-host': 'contextualwebsearch-websearch-v1.p.rapidapi.com',
        'x-rapidapi-key': CONFIG.contextualWeb.key,
      },
    });
    return normalizeNewsData(response.data.value, 'ContextualWeb');
  } catch (error) {
    console.error('ContextualWeb Error:', error.message);
    return [];
  }
}

export async function checkSupabaseConnection() {
  try {
    // First check auth connection
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.error('Supabase auth connection error:', authError);
      return false;
    }

    // Then check database connection
    const { error: dbError } = await supabase
      .from('bookmarks')
      .select('id')
      .limit(1);

    if (dbError) {
      // Check if error is about missing table
      if (dbError.code === '42P01') {
        console.error('Bookmarks table does not exist. Please run the setup SQL.');
        throw new Error('Database setup required. Contact administrator.');
      }
      console.error('Supabase database error:', dbError);
      return false;
    }

    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    throw error;
  }
}

export async function addBookmark(article, userId) {
  try {
    console.log('Adding bookmark for user:', userId);
    const { data, error } = await supabase
      .from('bookmarks')
      .insert([
        {
          user_id: userId,
          article_data: article,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    console.log('Bookmark added successfully:', data);
    return data;
  } catch (error) {
    console.error('Error adding bookmark:', error);
    throw error;
  }
}

export async function removeBookmark(articleId, userId) {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .delete()
      .match({ user_id: userId, 'article_data->id': articleId });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error removing bookmark:', error);
    throw error;
  }
}

export async function getBookmarks(userId) {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(bookmark => bookmark.article_data);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    throw error;
  }
}

export async function fetchNews(page = 1) {
  try {
    const requests = [
      fetchNewsApi(page),
      fetchGNews(page),
      fetchContextualWeb(page)
    ];

    const results = await Promise.all(
      requests.map(promise => 
        promise.catch(error => {
          console.error('API request failed:', error);
          return [];
        })
      )
    );

    const allNews = results.flat();

    if (allNews.length === 0) {
      throw new Error('Unable to fetch news from any source');
    }

    return allNews;
  } catch (error) {
    console.error('News fetching failed:', error);
    throw error;
  }
}
