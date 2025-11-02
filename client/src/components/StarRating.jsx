import { FiStar } from 'react-icons/fi';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';

const StarRating = ({ rating = 0, count = 0, size = 16, showCount = true, interactive = false, onChange = null }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  const handleStarClick = (starIndex) => {
    if (interactive && onChange) {
      onChange(starIndex + 1);
    }
  };

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <FaStar
          key={i}
          size={size}
          className={`${interactive ? 'cursor-pointer hover:scale-110 transition' : ''} text-yellow-400`}
          onClick={() => handleStarClick(i)}
        />
      );
    } else if (i === fullStars && hasHalfStar) {
      stars.push(
        <FaStarHalfAlt
          key={i}
          size={size}
          className={`${interactive ? 'cursor-pointer hover:scale-110 transition' : ''} text-yellow-400`}
          onClick={() => handleStarClick(i)}
        />
      );
    } else {
      stars.push(
        <FiStar
          key={i}
          size={size}
          className={`${interactive ? 'cursor-pointer hover:scale-110 transition' : ''} text-gray-300`}
          onClick={() => handleStarClick(i)}
        />
      );
    }
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">{stars}</div>
      {showCount && count > 0 && (
        <span className="text-sm text-gray-500 ml-1">
          ({count})
        </span>
      )}
      {!showCount && rating > 0 && (
        <span className="text-sm text-gray-600 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
