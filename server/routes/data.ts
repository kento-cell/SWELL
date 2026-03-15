import { Router } from 'express';
import { fetchNewsData, fetchSocialData, fetchMarketData, fetchAllCategoryData } from '../api/data-router';

const router = Router();

/**
 * GET /api/data/news
 * Fetch NEWS category data
 */
router.get('/news', async (req, res) => {
  try {
    const data = await fetchNewsData();
    res.json(data);
  } catch (error) {
    console.error('Error in GET /api/data/news:', error);
    res.status(500).json({ error: 'Failed to fetch news data' });
  }
});

/**
 * GET /api/data/social
 * Fetch SOCIAL category data
 */
router.get('/social', async (req, res) => {
  try {
    const data = await fetchSocialData();
    res.json(data);
  } catch (error) {
    console.error('Error in GET /api/data/social:', error);
    res.status(500).json({ error: 'Failed to fetch social data' });
  }
});

/**
 * GET /api/data/market
 * Fetch MARKET category data
 */
router.get('/market', async (req, res) => {
  try {
    const data = await fetchMarketData();
    res.json(data);
  } catch (error) {
    console.error('Error in GET /api/data/market:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

/**
 * GET /api/data/all
 * Fetch all category data
 */
router.get('/all', async (req, res) => {
  try {
    const data = await fetchAllCategoryData();
    res.json(data);
  } catch (error) {
    console.error('Error in GET /api/data/all:', error);
    res.status(500).json({ error: 'Failed to fetch all data' });
  }
});

export default router;
