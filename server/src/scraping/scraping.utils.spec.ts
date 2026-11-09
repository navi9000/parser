import {
  REFRESH_INTERVAL_MS,
  aggregateOfficeStats,
  getLatestSavedTimestamp,
  getRefreshDelay,
  selectNewReviews,
  updateReviewStats,
} from './scraping.utils.js';
import type { ScrapedReview } from '../yandex/yandex.service.js';

const review = (timestamp: string, rating = 5): ScrapedReview => ({
  author: 'Reviewer',
  rating,
  text: 'Review text',
  timestamp,
});

describe('scraping utilities', () => {
  it('schedules a refresh 24 hours after the successful update', () => {
    const updatedAt = '2026-01-01T10:00:00.000Z';
    const now = Date.parse(updatedAt) + 60_000;

    expect(getRefreshDelay(updatedAt, now)).toBe(REFRESH_INTERVAL_MS - 60_000);
    expect(getRefreshDelay(null, now)).toBe(0);
  });

  it('rejects invalid update timestamps', () => {
    expect(() => getRefreshDelay('not-a-date')).toThrow(
      'Invalid last_updated_at value',
    );
  });

  it('selects only strictly newer reviews in chronological order', () => {
    const savedTimestamp = '2026-01-02T00:00:00.000Z';
    const reviews = [
      review('2026-01-04T00:00:00.000Z'),
      review(savedTimestamp),
      review('2026-01-03T00:00:00.000Z'),
      review('2026-01-01T00:00:00.000Z'),
    ];

    expect(
      selectNewReviews(reviews, savedTimestamp).map(
        ({ timestamp }) => timestamp,
      ),
    ).toEqual(['2026-01-03T00:00:00.000Z', '2026-01-04T00:00:00.000Z']);
  });

  it('removes exact duplicates within a single scraped page', () => {
    const duplicatedReview = review('2026-01-03T00:00:00.000Z');

    expect(
      selectNewReviews(
        [duplicatedReview, duplicatedReview],
        '2026-01-02T00:00:00.000Z',
      ),
    ).toEqual([duplicatedReview]);
  });

  it('finds the latest timestamp by time rather than lexical order', () => {
    expect(
      getLatestSavedTimestamp([
        '2026-01-02T00:00:00.000Z',
        '2026-01-02T03:00:00+04:00',
        '2026-01-01T23:30:00Z',
      ]),
    ).toBe('2026-01-02T00:00:00.000Z');
  });

  it('rejects invalid saved review timestamps rather than risking duplicates', () => {
    expect(() => getLatestSavedTimestamp(['not-a-date'])).toThrow(
      'Invalid saved review timestamp',
    );
    expect(() => selectNewReviews([review('not-a-date')], null)).toThrow(
      'Invalid scraped review timestamp',
    );
  });

  it('updates counts and averages only for newly inserted reviews', () => {
    expect(updateReviewStats(2, '4.00', [5, 3])).toEqual({
      review_count: 4,
      avg_rating: '4.00',
    });
  });

  it('aggregates company ratings weighted by each office review count', () => {
    expect(
      aggregateOfficeStats([
        { review_count: 2, avg_rating: '5.00' },
        { review_count: 6, avg_rating: '3.00' },
      ]),
    ).toEqual({ review_count: 8, avg_rating: '3.50' });
  });
});
