import type { ScrapedReview } from '../yandex/yandex.service.js';

export const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function getRefreshDelay(
  lastUpdatedAt: string | null,
  now = Date.now(),
): number {
  if (!lastUpdatedAt) {
    return 0;
  }

  const updatedAt = Date.parse(lastUpdatedAt);
  if (Number.isNaN(updatedAt)) {
    throw new Error(`Invalid last_updated_at value: ${lastUpdatedAt}`);
  }

  return Math.max(0, updatedAt + REFRESH_INTERVAL_MS - now);
}

export function selectNewReviews(
  reviews: ScrapedReview[],
  latestSavedTimestamp: string | null,
): ScrapedReview[] {
  const latestSavedTime = latestSavedTimestamp
    ? Date.parse(latestSavedTimestamp)
    : Number.NEGATIVE_INFINITY;

  if (Number.isNaN(latestSavedTime)) {
    throw new Error(`Invalid saved review timestamp: ${latestSavedTimestamp}`);
  }

  const parsedReviews = reviews.map((review) => {
    const time = Date.parse(review.timestamp);
    if (Number.isNaN(time)) {
      throw new Error(`Invalid scraped review timestamp: ${review.timestamp}`);
    }
    return { review, time };
  });

  const seen = new Set<string>();
  return parsedReviews
    .filter(({ review, time }) => {
      if (time <= latestSavedTime) {
        return false;
      }

      const key = JSON.stringify([
        review.timestamp,
        review.author,
        review.rating,
        review.text,
      ]);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .sort((left, right) => left.time - right.time)
    .map(({ review }) => review);
}

export function getLatestSavedTimestamp(timestamps: string[]): string | null {
  let latestTimestamp: string | null = null;
  let latestTime = Number.NEGATIVE_INFINITY;

  for (const timestamp of timestamps) {
    const time = Date.parse(timestamp);
    if (Number.isNaN(time)) {
      throw new Error(`Invalid saved review timestamp: ${timestamp}`);
    }
    if (time > latestTime) {
      latestTimestamp = timestamp;
      latestTime = time;
    }
  }

  return latestTimestamp;
}

export function updateReviewStats(
  reviewCount: number,
  averageRating: string,
  newRatings: number[],
): { review_count: number; avg_rating: string } {
  const newReviewCount = reviewCount + newRatings.length;
  if (!newReviewCount) {
    return { review_count: 0, avg_rating: '0.00' };
  }

  const currentRatingTotal = Number(averageRating) * reviewCount;
  const newRatingTotal = newRatings.reduce((sum, rating) => sum + rating, 0);

  return {
    review_count: newReviewCount,
    avg_rating: (
      (currentRatingTotal + newRatingTotal) /
      newReviewCount
    ).toFixed(2),
  };
}

export function aggregateOfficeStats(
  offices: Array<{ review_count: number; avg_rating: string }>,
): { review_count: number; avg_rating: string } {
  const reviewCount = offices.reduce(
    (total, office) => total + office.review_count,
    0,
  );
  if (!reviewCount) {
    return { review_count: 0, avg_rating: '0.00' };
  }

  const ratingTotal = offices.reduce(
    (total, office) => total + Number(office.avg_rating) * office.review_count,
    0,
  );
  return {
    review_count: reviewCount,
    avg_rating: (ratingTotal / reviewCount).toFixed(2),
  };
}
