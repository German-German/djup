import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const aiService = {
  analyze: async (page, context, style = 'default') => {
    try {
      const { data } = await axios.post(`${API_BASE}/ai/analyze`, { page, context, style });
      return data;
    } catch (e) {
      console.warn('ai.analyze failed', e);
      return { available: false, text: 'AI commentary is temporarily unavailable.' };
    }
  },

  summarizeNews: async (items) => {
    try {
      const { data } = await axios.post(`${API_BASE}/ai/summarize-news`, {
        items: items.map((it) => ({ title: it.title, source: it.source, publishedAt: it.publishedAt })),
      });
      return data;
    } catch (e) {
      console.warn('ai.summarizeNews failed', e);
      return { available: false, text: 'Summarisation temporarily unavailable.' };
    }
  },
};
