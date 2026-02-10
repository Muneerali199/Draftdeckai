'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export function FeedbackPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [showTrigger, setShowTrigger] = useState(false);

    // Show the trigger after a delay
    useEffect(() => {
        const timer = setTimeout(() => {
            // Check if user has already submitted feedback this session
            const submitted = sessionStorage.getItem('draftdeckai_feedback_submitted');
            if (!submitted) {
                setShowTrigger(true);
            }
        }, 30000); // Show after 30 seconds

        return () => clearTimeout(timer);
    }, []);

    const handleSubmit = async () => {
        if (!rating && !feedback.trim()) {
            toast.error('Please provide a rating or feedback');
            return;
        }

        setIsSubmitting(true);

        try {
            // Here you can send feedback to your backend
            // For now, we'll just log it and show success
            console.log('Feedback submitted:', { rating, feedback });

            // You can implement a proper API endpoint:
            // await fetch('/api/feedback', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify({ rating, feedback })
            // });

            setHasSubmitted(true);
            sessionStorage.setItem('draftdeckai_feedback_submitted', 'true');
            toast.success('Thank you for your feedback!');

            // Close after showing thank you message
            setTimeout(() => {
                setIsOpen(false);
                setShowTrigger(false);
            }, 2000);
        } catch (error) {
            console.error('Error submitting feedback:', error);
            toast.error('Failed to submit feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        // Hide trigger for current session if closed without submitting
        sessionStorage.setItem('draftdeckai_feedback_dismissed', 'true');
        setShowTrigger(false);
    };

    if (!showTrigger) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {!isOpen ? (
                // Floating trigger button
                <Button
                    onClick={() => setIsOpen(true)}
                    className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white border-0"
                >
                    <MessageCircle className="h-6 w-6" />
                </Button>
            ) : (
                // Feedback popup
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-80 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-4 py-3 flex items-center justify-between">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            Share Feedback
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/20"
                            onClick={handleClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        {hasSubmitted ? (
                            // Thank you message
                            <div className="text-center py-6">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <Star className="h-8 w-8 text-green-500" />
                                </div>
                                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Thank You!</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Your feedback helps us improve DraftDeckAI.
                                </p>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    How's your experience with DraftDeckAI?
                                </p>

                                {/* Rating buttons */}
                                <div className="flex gap-3 mb-4">
                                    <Button
                                        variant={rating === 'positive' ? 'default' : 'outline'}
                                        className={`flex-1 ${rating === 'positive' ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
                                        onClick={() => setRating('positive')}
                                    >
                                        <ThumbsUp className="h-4 w-4 mr-2" />
                                        Great
                                    </Button>
                                    <Button
                                        variant={rating === 'negative' ? 'default' : 'outline'}
                                        className={`flex-1 ${rating === 'negative' ? 'bg-red-500 hover:bg-red-600 text-white' : ''}`}
                                        onClick={() => setRating('negative')}
                                    >
                                        <ThumbsDown className="h-4 w-4 mr-2" />
                                        Needs Work
                                    </Button>
                                </div>

                                {/* Feedback textarea */}
                                <Textarea
                                    placeholder="Tell us more (optional)..."
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    className="mb-4 resize-none"
                                    rows={3}
                                />

                                {/* Submit button */}
                                <Button
                                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        'Sending...'
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Send Feedback
                                        </>
                                    )}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
