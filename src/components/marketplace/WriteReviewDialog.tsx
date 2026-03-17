// ============================================================
// Húsfélagið.is — WriteReviewDialog
// Dialog to submit or update a review for a provider
// ============================================================

import { useState } from 'react';
import { Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitReview } from '@/hooks/useProviderReviews';

interface WriteReviewDialogProps {
  open: boolean;
  onClose: () => void;
  providerId: string;
  providerName: string;
  associationId: string;
  bidRequestId: string;
}

export function WriteReviewDialog({
  open,
  onClose,
  providerId,
  providerName,
  associationId,
  bidRequestId,
}: WriteReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const submitReview = useSubmitReview();

  const handleSubmit = async () => {
    if (rating === 0) return;

    await submitReview.mutateAsync({
      provider_id: providerId,
      association_id: associationId,
      bid_request_id: bidRequestId,
      rating,
      comment,
    });

    onClose();
    setRating(0);
    setComment('');
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Skrifa umsögn</DialogTitle>
          <DialogDescription>
            Umsögn um {providerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Star rating */}
          <div>
            <p className="text-sm font-medium mb-2">Einkunn</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      star <= displayRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {rating === 1 && 'Léleg'}
                {rating === 2 && 'Sæmileg'}
                {rating === 3 && 'Ágæt'}
                {rating === 4 && 'Góð'}
                {rating === 5 && 'Framúrskarandi'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <p className="text-sm font-medium mb-2">Athugasemd</p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Lýstu upplifun þinni af þjónustunni..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Hætta við
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || submitReview.isPending}
            >
              {submitReview.isPending ? 'Vista...' : 'Senda umsögn'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
