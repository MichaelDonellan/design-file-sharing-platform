import { format } from 'date-fns';
import { Star } from 'lucide-react';
import type { Review } from '../types';

interface ReviewsListProps {
  reviews: Review[];
}

export default function ReviewsList({ reviews }: ReviewsListProps) {
  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-gray-200 pb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                {review.user?.email.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium">{review.user?.email}</span>
            </div>
            <span className="text-sm text-gray-500">
              {format(new Date(review.created_at), 'MMM d, yyyy')}
            </span>
          </div>
          
          <div className="flex items-center mb-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <Star
                key={value}
                size={16}
                className={value <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
              />
            ))}
          </div>

          {review.comment && (
            <p className="text-gray-700">{review.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
}