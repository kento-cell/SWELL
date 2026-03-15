# Swell - Data Sources & Attribution

Swell aggregates news, social trends, and market data from multiple free sources. This document outlines our data sources, usage policies, and compliance measures.

---

## Data Sources

### 1. NEWS Category
**Source:** [HackerNews API](https://news.ycombinator.com/api)

**Data:** Top technology, startup, and business news stories

**Attribution:** "Powered by HackerNews"

**Usage Policy:**
- ✅ Commercial use allowed
- ✅ No API key required
- ✅ Unlimited requests
- ⚠️ Attribution recommended
- ⚠️ Respect 1 request per second (rate limiting applied)

**Link Format:** https://news.ycombinator.com/item?id={id}

---

### 2. SOCIAL Category
**Sources:** 
- [Medium](https://medium.com) (RSS Feed)
- [Product Hunt](https://www.producthunt.com) (RSS Feed)

**Data:** Technology articles, product launches, and trending discussions

**Attribution:** "Data from Medium" / "Data from Product Hunt"

**Usage Policy:**
- ✅ RSS feeds are publicly available
- ✅ Commercial aggregation allowed
- ✅ No authentication required
- ⚠️ Attribution required
- ⚠️ Link back to original content

**Link Format:**
- Medium: Direct article URL from RSS feed
- Product Hunt: Direct product URL from RSS feed

---

### 3. MARKET Category
**Source:** [Alpha Vantage API](https://www.alphavantage.co/)

**Data:** Real-time and historical stock prices, forex, and cryptocurrency data

**Attribution:** "Data from Alpha Vantage"

**Usage Policy:**
- ✅ Commercial use allowed
- ✅ Free tier: 500 requests/day, 5 requests/minute
- ✅ API key required (free registration)
- ⚠️ Attribution required
- ⚠️ No redistribution of raw data

**Link Format:** https://www.alphavantage.co/

---

## Compliance Measures

### Rate Limiting
```
HackerNews: 1 request/second (API unlimited, but respectful)
Medium/Product Hunt: 2 requests/minute (RSS feeds)
Alpha Vantage: 5 requests/minute (API limit)
```

### Caching Strategy
```
NEWS: 10 minutes
SOCIAL: 15 minutes
MARKET: 30 minutes
```

This ensures:
- ✅ Minimal API load
- ✅ Zero cost operation (free tier only)
- ✅ User experience optimization

### Data Retention
- **In-Memory Cache:** 10-30 minutes (TTL-based)
- **User Data:** Not stored (read-only aggregation)
- **No Persistent Storage:** All data is ephemeral

---

## In-App Attribution

### Footer
```
Powered by:
- HackerNews (https://news.ycombinator.com/)
- Medium (https://medium.com/)
- Product Hunt (https://www.producthunt.com/)
- Alpha Vantage (https://www.alphavantage.co/)
```

### Topic Details Screen
Each topic displays:
- Source badge (e.g., "HackerNews", "Medium", "Alpha Vantage")
- "Read Original" button → Direct link to source

### Settings Screen
- "About Data Sources" section
- Links to each API's terms of service
- Explanation of data freshness

---

## Terms of Service Links

- **HackerNews:** https://news.ycombinator.com/
- **Medium:** https://medium.com/policy/medium-terms-of-service-9db0094a1e0f
- **Product Hunt:** https://www.producthunt.com/terms
- **Alpha Vantage:** https://www.alphavantage.co/

---

## Legal Disclaimer

Swell is a **read-only aggregator**. We do not:
- ❌ Store user data
- ❌ Modify or republish content
- ❌ Claim ownership of aggregated data
- ❌ Violate any API terms of service

All content is displayed with proper attribution and links to original sources.

---

## Contact & Support

For questions about data sources or compliance:
- Email: support@swell.app (placeholder)
- GitHub Issues: (placeholder)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-15 | Initial release with HackerNews, RSS, Alpha Vantage |

---

**Last Updated:** 2026-03-15
