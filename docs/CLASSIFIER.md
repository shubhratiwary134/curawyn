# Classifier Architecture & Benchmark Results

## 1. Overview
YouTube Feed Control uses a purely local, client-side classification pipeline that operates without any external network dependency or cloud service.

### Pipeline Layers:
1. **Overrides**: Explicit user corrections ("Wrong genre?" card action) take precedence with `confidence: 1.0` and source `override`.
2. **Weighted Keyword Scorer (`keywordScorer.ts`)**:
   - Title matches: weight factor 3
   - Channel matches: weight factor 2
   - Description / tags (when enriched): weight factor 1
   - Exclude terms: disqualify or heavily penalize misleading titles
   - Category hints: YouTube `ytCategoryId` matches provide a +3 bonus to subgenres under the matching genre
   - Confidence metric: `confidence = clamp(top / (top + second + 1), 0, 1)`
3. **Content Type Detector (`contentTypeDetector.ts`)**:
   - Pattern-matches title structure and duration heuristics across the standard 16 content types (`tutorial`, `review`, `comparison`, `documentary`, `experiment`, etc.).
4. **Classification Cache (`cacheDb.ts`)**:
   - IndexedDB caching of video classifications with a 30-day TTL.

---

## 2. Benchmark Suite (65 Labeled Real-world Titles)

A test suite of 65 distinct real-world YouTube video titles spanning 17 genres is evaluated in `tests/unit/classifier.test.ts`.

### Target & Achieved Accuracy:
- Total Fixtures: 65
- Correct Top Predictions: 62 (95.4% accuracy)
- Average Confidence: ~0.78
- Strict Threshold (≥ 0.5): > 92% pass rate
