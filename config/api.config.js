export const API_CONFIG = {
  newsApi: {
    url: 'https://newsapi.org/v2',
    key: '6d829ff9b0754135a8fe60c5fd90dc14',
    endpoint: '/everything',
    params: {
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: 10
    }
  },
  gNews: {
    url: 'https://gnews.io/api/v4',
    key: 'd2782346d8ade8f0ece96ee287d679e1',
    endpoint: '/search',
    params: {
      lang: 'en',
      country: 'us',
      max: 10
    }
  }
  
};
