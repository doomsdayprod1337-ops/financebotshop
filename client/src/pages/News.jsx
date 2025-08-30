import React, { useState, useEffect } from 'react';
import api from '../config/axios';
import { useAuth } from '../contexts/AuthContext';

const News = () => {
  const { user } = useAuth();
  const [selectedNews, setSelectedNews] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newsItems, setNewsItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newsCount, setNewsCount] = useState(0);
  
  // Rating and commenting state
  const [newsRatings, setNewsRatings] = useState({});
  const [newsComments, setNewsComments] = useState({});
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Load news from database
  useEffect(() => {
    loadNews();
  }, []);

  // Load news count
  useEffect(() => {
    loadNewsCount();
  }, []);

  // Load ratings and comments for all news items
  useEffect(() => {
    if (newsItems.length > 0) {
      newsItems.forEach(item => {
        loadNewsRatings(item.id);
        loadNewsComments(item.id);
      });
    }
  }, [newsItems]);

  const loadNews = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/news-management');
      if (response.data.success) {
        // Transform database data to match expected format
        const transformedNews = response.data.news.map(item => ({
          id: item.id,
          title: item.title,
          date: new Date(item.created_at).toISOString().split('T')[0],
          category: item.category,
          content: item.content,
          fullContent: item.full_content || item.content
        }));
        setNewsItems(transformedNews);
      }
    } catch (error) {
      console.error('Error loading news:', error);
      // Fallback to empty array if API fails
      setNewsItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNewsCount = async () => {
    try {
      const response = await api.get('/api/content-stats?timePeriod=7d');
      if (response.data.success) {
        setNewsCount(response.data.stats.news.recent);
      }
    } catch (error) {
      console.error('Error loading news count:', error);
    }
  };

  // Load ratings for a specific news article
  const loadNewsRatings = async (newsId) => {
    try {
      const response = await api.get(`/api/news-ratings?newsId=${newsId}`);
      if (response.data.success) {
        setNewsRatings(prev => ({
          ...prev,
          [newsId]: response.data
        }));
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  };

  // Load comments for a specific news article
  const loadNewsComments = async (newsId) => {
    try {
      const response = await api.get(`/api/news-comments?newsId=${newsId}`);
      if (response.data.success) {
        setNewsComments(prev => ({
          ...prev,
          [newsId]: response.data
        }));
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  // Submit a rating
  const submitRating = async (newsId, rating) => {
    if (!user) return;
    
    try {
      setIsSubmittingRating(true);
      const response = await api.post('/api/news-ratings', {
        newsId,
        rating
      });
      
      if (response.data.success) {
        // Reload ratings to get updated data
        await loadNewsRatings(newsId);
        // Show success message
        alert('Rating submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Failed to submit rating. Please try again.');
      }
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Submit a comment
  const submitComment = async (newsId) => {
    if (!user || !commentText.trim()) return;
    
    try {
      setIsSubmittingComment(true);
      const response = await api.post('/api/news-comments', {
        newsId,
        comment: commentText.trim()
      });
      
      if (response.data.success) {
        // Clear comment text
        setCommentText('');
        // Reload comments to get updated data
        await loadNewsComments(newsId);
        // Show success message
        alert('Comment submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Failed to submit comment. Please try again.');
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Delete a comment (own comment only)
  const deleteComment = async (commentId, newsId) => {
    if (!user) return;
    
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    try {
      const response = await api.delete('/api/news-comments', {
        data: { commentId }
      });
      
      if (response.data.success) {
        // Reload comments to get updated data
        await loadNewsComments(newsId);
        alert('Comment deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Failed to delete comment. Please try again.');
      }
    }
  };

  const openNewsModal = (newsItem) => {
    setSelectedNews(newsItem);
    setIsModalOpen(true);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Load ratings and comments for this news item
    loadNewsRatings(newsItem.id);
    loadNewsComments(newsItem.id);
  };

  const closeNewsModal = () => {
    setIsModalOpen(false);
    setSelectedNews(null);
    // Restore body scroll
    document.body.style.overflow = 'unset';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">News & Updates</h1>
        {newsCount > 0 && (
          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">{newsCount}</span>
        )}
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-300 mt-2">Loading news...</p>
        </div>
      ) : newsItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-300 text-lg">No news available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsItems.map((item) => (
          <div key={item.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500 transition-colors">
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{item.date}</span>
                <span className="px-2 py-1 text-xs bg-blue-600 text-white rounded-full">{item.category}</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-gray-300 text-sm">{item.content}</p>
            </div>
            <div className="px-4 py-3 bg-gray-700">
              <div className="flex items-center justify-between mb-2">
                {/* Rating Display */}
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="text-yellow-400 text-sm">
                      {star <= (newsRatings[item.id]?.averageRating || 0) ? '★' : '☆'}
                    </span>
                  ))}
                  <span className="text-gray-300 text-xs ml-1">
                    ({newsRatings[item.id]?.totalRatings || 0})
                  </span>
                </div>
                
                {/* Comments Count */}
                <span className="text-gray-400 text-xs">
                  💬 {newsComments[item.id]?.totalComments || 0}
                </span>
              </div>
              
              <button 
                onClick={() => openNewsModal(item)}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                Read More →
              </button>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Newsletter Section */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Stay Updated</h2>
        <p className="text-gray-300 mb-4">
          Subscribe to our newsletter to receive the latest updates about new bots, software releases, and security improvements.
        </p>
        <div className="flex space-x-4">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded transition-colors">
            Subscribe
          </button>
        </div>
      </div>

      {/* News Detail Modal */}
      {isModalOpen && selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-75 transition-opacity duration-300"
            onClick={closeNewsModal}
          />
          
          {/* Modal Content */}
          <div className="relative bg-gray-800 rounded-lg border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 opacity-100">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-800 px-6 py-4 border-b border-gray-700 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded-full">
                    {selectedNews.category}
                  </span>
                  <span className="text-sm text-gray-400">{selectedNews.date}</span>
                </div>
                <button
                  onClick={closeNewsModal}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <h2 className="text-2xl font-bold text-white mt-3">{selectedNews.title}</h2>
            </div>
            
            {/* Modal Body */}
            <div className="px-6 py-6">
              <div className="prose prose-invert max-w-none">
                <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                  {selectedNews.fullContent}
                </div>
              </div>
            </div>
            
            {/* Rating Section */}
            <div className="px-6 py-4 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Rate this Article</h3>
              
              {/* Rating Display */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-white text-sm">Average Rating:</span>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="text-yellow-400">
                        {star <= (newsRatings[selectedNews.id]?.averageRating || 0) ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                  <span className="text-gray-300 text-sm">
                    ({newsRatings[selectedNews.id]?.averageRating || 0}/5)
                  </span>
                </div>
                <span className="text-gray-400 text-sm">
                  ({newsRatings[selectedNews.id]?.totalRatings || 0} ratings)
                </span>
              </div>

              {/* Rating Input */}
              {user && !newsRatings[selectedNews.id]?.userHasRated && (
                <div className="mb-4">
                  <label className="block text-white text-sm font-medium mb-2">
                    Your Rating:
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => submitRating(selectedNews.id, rating)}
                        disabled={isSubmittingRating}
                        className="text-2xl text-gray-400 hover:text-yellow-400 transition-colors disabled:opacity-50"
                      >
                        ☆
                      </button>
                    ))}
                  </div>
                  {isSubmittingRating && (
                    <span className="text-blue-400 text-sm">Submitting rating...</span>
                  )}
                </div>
              )}

              {/* User's Rating Display */}
              {user && newsRatings[selectedNews.id]?.userHasRated && (
                <div className="mb-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                  <span className="text-green-400 text-sm">
                    ✓ You rated this article {newsRatings[selectedNews.id]?.userRating}/5 stars
                  </span>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="px-6 py-4 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Comments ({newsComments[selectedNews.id]?.totalComments || 0})
              </h3>

              {/* Comment Input */}
              {user && (
                <div className="mb-4">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts on this article..."
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none resize-none"
                    rows="3"
                    maxLength="1000"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-400 text-xs">
                      {commentText.length}/1000 characters
                    </span>
                    <button
                      onClick={() => submitComment(selectedNews.id)}
                      disabled={!commentText.trim() || isSubmittingComment}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded transition-colors"
                    >
                      {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {newsComments[selectedNews.id]?.comments?.length > 0 ? (
                  newsComments[selectedNews.id].comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-400 font-medium text-sm">
                            {comment.users.username || comment.users.email}
                          </span>
                          <span className="text-gray-400 text-xs">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {user && comment.user_id === user.id && (
                          <button
                            onClick={() => deleteComment(comment.id, selectedNews.id)}
                            className="text-red-400 hover:text-red-300 text-xs transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm">{comment.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-400 text-sm">No comments yet. Be the first to share your thoughts!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-800 px-6 py-4 border-t border-gray-700 rounded-b-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  Published on {selectedNews.date}
                </span>
                <button
                  onClick={closeNewsModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default News;
