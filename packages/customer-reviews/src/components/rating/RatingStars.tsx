import { useState } from 'react';
import { RatingStarsProps } from '../../types';

interface RatingStarsComponent {
  (props: RatingStarsProps): JSX.Element;
}

export const RatingStars: RatingStarsComponent = ({
  rating,
  size = 'md',
  interactive = false,
  onRatingChange,
  className = '',
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = (newRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(newRating);
    }
  };

  const handleMouseEnter = (newRating: number) => {
    if (interactive) {
      setHoverRating(newRating);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= displayRating;
        const isPartial = star - 0.5 <= displayRating && star > displayRating;

        return (
          <button
            key={star}
            type="button"
            className={`
              ${sizeClasses[size]}
              ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded
            `}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={!interactive}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            <svg
              className={`
                ${sizeClasses[size]}
                ${isFilled 
                  ? 'text-yellow-400 fill-current' 
                  : isPartial
                  ? 'text-yellow-400 fill-current opacity-50'
                  : 'text-gray-300 fill-current'
                }
                transition-colors duration-150
              `}
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        );
      })}
      
      {!interactive && (
        <span className="ml-2 text-sm text-gray-600">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};