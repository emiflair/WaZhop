import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { reviewAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiFilter, FiLoader, FiMail, FiMessageSquare, FiRefreshCcw, FiSearch, FiStar, FiTrash2, FiXCircle } from 'react-icons/fi';
import { TouchButton } from '../../components/mobile';

const StarBadge = ({ rating }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">
    <FiStar className="text-yellow-600" /> {rating}
  </span>
);

const formatDate = (iso) => new Date(iso).toLocaleString();

const Reviews = () => {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [hasNext, setHasNext] = useState(false);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all'); // all|approved|pending
  const [search, setSearch] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);

  const fetchReviews = async (p = page) => {
    setLoading(true);
    try {
      // Ask for server pagination; handle array or object response shapes.
      const resp = await reviewAPI.getMyShopReviews(undefined, { page: p, limit, sort: '-createdAt' });

      let data = resp;
      let serverStats = null;
      let serverTotalPages = null;
      let serverCurrentPage = null;

      if (resp && !Array.isArray(resp) && typeof resp === 'object') {
        // Interceptor may have preserved full object in some cases
        data = resp.data ?? [];
        serverStats = resp.stats ?? null;
        serverTotalPages = resp.totalPages ?? null;
        serverCurrentPage = resp.currentPage ?? null;
      }

      setReviews(data || []);
      setStats(serverStats);

      // Determine if there is a next page
      if (serverTotalPages && serverCurrentPage) {
        setHasNext(serverCurrentPage < serverTotalPages);
      } else {
        // Fallback: if we got exactly `limit` items, assume there might be more
        setHasNext(Array.isArray(data) && data.length === limit);
      }
    } catch (err) {
      console.error(err);
      // Don't show error toast if shop doesn't exist (buyer account)
      if (err.response?.status !== 404) {
        const message = err.userMessage || err.message || 'Failed to load reviews';
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, refreshTick]);

  const filtered = useMemo(() => {
    let list = Array.isArray(reviews) ? reviews : [];
    if (filter === 'approved') list = list.filter(r => r.isApproved);
    if (filter === 'pending') list = list.filter(r => !r.isApproved);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.customerName?.toLowerCase().includes(q) ||
        r.customerEmail?.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q) ||
        r.product?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [reviews, filter, search]);

  const approve = async (id, isApproved) => {
    try {
      await reviewAPI.approveReview(id, isApproved);
      toast.success(isApproved ? 'Review approved' : 'Review rejected');
      setRefreshTick(t => t + 1);
    } catch (err) {
      toast.error(err.userMessage || 'Failed to update review');
      console.error(err);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this review? This action cannot be undone.')) return;
    try {
      await reviewAPI.deleteReview(id);
      toast.success('Review deleted');
      setRefreshTick(t => t + 1);
    } catch (err) {
      toast.error(err.userMessage || 'Failed to delete review');
      console.error(err);
    }
  };

  const loadPage = async (p) => {
    setPage(p);
    await fetchReviews(p);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Reviews</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">View and manage customer reviews for your shop.</p>
          </div>
          <div className="flex gap-2">
            <TouchButton onClick={() => setRefreshTick(t => t + 1)} variant="secondary" size="md">
              <FiRefreshCcw className="mr-2" /> Refresh
            </TouchButton>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card">
            <p className="text-sm text-gray-500">Average Rating</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats?.averageRating?.toFixed?.(1) ?? '—'}</span>
              {stats?.averageRating ? <StarBadge rating={stats.averageRating.toFixed(1)} /> : null}
            </div>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Total Reviews</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats?.totalReviews ?? filtered.length}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Pending Moderation</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">{(Array.isArray(reviews) ? reviews : []).filter(r => !r.isApproved).length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, product, or text..."
                className="input pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input md:w-56">
                <option value="all">All</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <FiLoader className="animate-spin text-gray-400" size={28} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center p-12">
              <FiMessageSquare className="mx-auto text-gray-300 mb-3" size={40} />
              <p className="text-gray-600 dark:text-gray-400">No reviews found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map((r) => (
                <div key={r._id} className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    {/* Product thumbnail */}
                    {r.product?.images?.length ? (
                      <img
                        src={r.product.images[0]?.url}
                        alt={r.product?.name}
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">No Image</div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{r.product?.name || 'Product'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <StarBadge rating={r.rating} />
                            <span className="text-xs text-gray-500">{formatDate(r.createdAt)}</span>
                            {r.isApproved ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700"><FiCheckCircle /> Approved</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700"><FiXCircle /> Pending</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {r.isApproved ? (
                            <TouchButton variant="outline" size="sm" onClick={() => approve(r._id, false)}>
                              <FiXCircle className="mr-1" /> Reject
                            </TouchButton>
                          ) : (
                            <TouchButton variant="primary" size="sm" onClick={() => approve(r._id, true)}>
                              <FiCheckCircle className="mr-1" /> Approve
                            </TouchButton>
                          )}
                          <TouchButton variant="danger" size="sm" onClick={() => remove(r._id)}>
                            <FiTrash2 className="mr-1" /> Delete
                          </TouchButton>
                        </div>
                      </div>

                      <p className="mt-2 text-gray-700 dark:text-gray-200 whitespace-pre-line">{r.comment}</p>

                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-3 flex-wrap">
                        <span>{r.customerName || 'Anonymous'}</span>
                        {r.customerEmail && (
                          <span className="inline-flex items-center gap-1"><FiMail /> {r.customerEmail}</span>
                        )}
                        {typeof r.helpful === 'number' && (
                          <span className="text-xs text-gray-500">Helpful: {r.helpful}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <TouchButton
            variant="secondary"
            size="md"
            disabled={page <= 1 || loading}
            onClick={() => loadPage(Math.max(1, page - 1))}
          >
            Previous
          </TouchButton>
          <span className="text-sm text-gray-600 dark:text-gray-400">Page {page}</span>
          <TouchButton
            variant="secondary"
            size="md"
            disabled={!hasNext || loading}
            onClick={() => loadPage(page + 1)}
          >
            Next
          </TouchButton>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reviews;
