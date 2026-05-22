import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  interactive?: boolean;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  onRatingChange,
  size = 16,
  interactive = false,
}) => {
  return (
    <div className="flex space-x-1">
      {[...Array(maxRating)].map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= rating;

        return (
          <Star
            key={i}
            size={size}
            className={`${
              isFilled ? 'text-amber-500 fill-current' : 'text-zinc-300'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => interactive && onRatingChange?.(starValue)}
          />
        );
      })}
    </div>
  );
};

export default RatingStars;
