import { useEffect, useState } from 'react';
import { productAPI, userAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiUpload,
  FiImage,
  FiAlertCircle,
} from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa';
import DashboardLayout from '../../components/DashboardLayout';
import { TouchButton } from '../../components/mobile';
import { useNavigate } from 'react-router-dom';

const Products = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    category: 'other',
    tags: '',
    inStock: true,
    sku: '',
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  const categories = [
    { value: 'fashion', label: 'Fashion' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'food', label: 'Food & Beverages' },
    { value: 'beauty', label: 'Beauty & Health' },
    { value: 'home', label: 'Home & Living' },
    { value: 'services', label: 'Services' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    fetchProducts();
    fetchSubscription();
  }, []);

  useEffect(() => {
    filterProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, searchTerm, filterStatus]);

  const fetchSubscription = async () => {
    try {
      await userAPI.getSubscription();
      // Subscription data loaded but not used in this component
    } catch (error) {
      console.error('Failed to load subscription info:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const productsData = await productAPI.getMyProducts();
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (error) {
      toast.error('Failed to load products');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter((p) => p.isActive);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter((p) => !p.isActive);
    }

    setFilteredProducts(filtered);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed per product');
      return;
    }

    setImages([...images, ...files]);

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : undefined,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : [],
      };

      if (editingProduct) {
        // Update existing product
        await productAPI.updateProduct(editingProduct._id, productData);
        
        // Upload new images if any
        if (images.length > 0) {
          await productAPI.uploadImages(editingProduct._id, images);
        }
        
        toast.success('Product updated successfully!');
      } else {
        // Create new product
        await productAPI.createProduct(productData, images);
        toast.success('Product created successfully!');
      }

      resetForm();
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save product';
      toast.error(message);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      comparePrice: product.comparePrice?.toString() || '',
      category: product.category,
      tags: product.tags?.join(', ') || '',
      inStock: product.inStock,
      sku: product.sku || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (productId) => {
    try {
      await productAPI.deleteProduct(productId);
      toast.success('Product deleted successfully!');
      setDeleteConfirm(null);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
      console.error(error);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedProducts.length} selected products?`)) {
      return;
    }

    try {
      await Promise.all(selectedProducts.map((id) => productAPI.deleteProduct(id)));
      toast.success(`${selectedProducts.length} products deleted`);
      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete some products');
      console.error(error);
    }
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      await productAPI.updateProduct(productId, { isActive: !currentStatus });
      toast.success('Product status updated');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  const toggleSelectProduct = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p._id));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      comparePrice: '',
      category: 'other',
      tags: '',
      inStock: true,
      sku: '',
    });
    setImages([]);
    setImagePreviews([]);
    setEditingProduct(null);
  };

  const getPlanLimits = () => {
    const limits = {
      free: 10,
      pro: 100,
      premium: Infinity,
    };
    return limits[user?.plan || 'free'];
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-sm sm:text-base text-gray-600">
                {products.length} / {getPlanLimits() === Infinity ? '∞' : getPlanLimits()} products
              </p>
              {user?.plan === 'free' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Free Plan
                </span>
              )}
              {user?.plan === 'pro' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <FaCrown className="mr-1" /> Pro Plan
                </span>
              )}
              {user?.plan === 'premium' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <FaCrown className="mr-1" /> Premium Plan
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {products.length >= getPlanLimits() && user?.plan !== 'premium' && (
              <TouchButton
                onClick={() => navigate('/dashboard/subscription')}
                variant="accent"
                size="md"
                className="flex-1 sm:flex-none"
              >
                <FaCrown className="mr-2" /> Upgrade Plan
              </TouchButton>
            )}
            <TouchButton
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              disabled={products.length >= getPlanLimits()}
              variant="primary"
              size="md"
              className="flex-1 sm:flex-none"
            >
              <FiPlus className="mr-2" /> Add Product
            </TouchButton>
          </div>
        </div>

        {/* Plan Limit Warning */}
        {products.length >= getPlanLimits() * 0.8 && user?.plan !== 'premium' && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {products.length >= getPlanLimits() ? (
                    <>
                      <strong>Product limit reached!</strong> You&apos;ve reached your {user.plan} plan limit of {getPlanLimits()} products.
                      <button
                        onClick={() => navigate('/dashboard/subscription')}
                        className="ml-2 font-medium underline hover:text-yellow-900"
                      >
                        Upgrade to add more products →
                      </button>
                    </>
                  ) : (
                    <>
                      You&apos;re using {products.length} of {getPlanLimits()} products ({Math.round((products.length / getPlanLimits()) * 100)}% of your {user.plan} plan limit).
                      <button
                        onClick={() => navigate('/dashboard/subscription')}
                        className="ml-2 font-medium underline hover:text-yellow-900"
                      >
                        Upgrade for more →
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="card">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input md:w-48"
            >
              <option value="all">All Products</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <div className="mt-4 flex items-center justify-between bg-blue-50 p-3 rounded-lg">
              <span className="text-sm text-blue-900">
                {selectedProducts.length} product(s) selected
              </span>
              <TouchButton onClick={handleBulkDelete} variant="danger" size="sm">
                <FiTrash2 className="inline mr-1" /> Delete Selected
              </TouchButton>
            </div>
          )}
        </div>

        {/* Products List */}
        {filteredProducts.length === 0 ? (
          <div className="card text-center py-12 px-4">
            <FiImage size={48} className="mx-auto text-gray-300 mb-4 sm:w-16 sm:h-16" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first product'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <TouchButton
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                variant="primary"
                size="md"
              >
                <FiPlus className="inline mr-2" /> Add Your First Product
              </TouchButton>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden">
            {/* Mobile Card View */}
            <div className="block lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProducts.map((product) => (
                <div key={product._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex items-start gap-3 mb-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product._id)}
                      onChange={() => toggleSelectProduct(product._id)}
                      className="rounded mt-1"
                    />
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={
                          product.images.find((img) => img.isPrimary)?.url ||
                          product.images[0].url
                        }
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FiImage className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {product.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">
                          ₦{product.price.toLocaleString()}
                        </span>
                        {product.comparePrice && product.comparePrice > product.price && (
                          <span className="text-xs text-gray-500 line-through">
                            ₦{product.comparePrice.toLocaleString()}
                          </span>
                        )}
                        <span className="text-xs text-gray-600 capitalize bg-gray-100 px-2 py-0.5 rounded">
                          {product.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => toggleProductStatus(product._id, product.isActive)}
                          className={`text-xs px-2 py-1 rounded-full ${
                            product.inStock
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </button>
                        <button
                          onClick={() => toggleProductStatus(product._id, product.isActive)}
                          className={`text-xs px-2 py-1 rounded-full ${
                            product.isActive
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 ml-20">
                    <TouchButton
                      onClick={() => handleEdit(product)}
                      variant="outline"
                      size="sm"
                      title="Edit"
                    >
                      <FiEdit2 size={16} />
                    </TouchButton>
                    <TouchButton
                      onClick={() => setDeleteConfirm(product)}
                      variant="danger"
                      size="sm"
                      title="Delete"
                    >
                      <FiTrash2 size={16} />
                    </TouchButton>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedProducts.length === filteredProducts.length &&
                          filteredProducts.length > 0
                        }
                        onChange={selectAllProducts}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredProducts.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product._id)}
                          onChange={() => toggleSelectProduct(product._id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={
                                product.images.find((img) => img.isPrimary)?.url ||
                                product.images[0].url
                              }
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <FiImage className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold">₦{product.price.toLocaleString()}</p>
                          {product.comparePrice && product.comparePrice > product.price && (
                            <p className="text-xs text-gray-500 line-through">
                              ₦{product.comparePrice.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700 capitalize">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleProductStatus(product._id, product.isActive)}
                          className={`text-sm px-3 py-1 rounded-full ${
                            product.inStock
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleProductStatus(product._id, product.isActive)}
                          className={`text-sm px-3 py-1 rounded-full ${
                            product.isActive
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <TouchButton
                            onClick={() => handleEdit(product)}
                            variant="outline"
                            size="sm"
                            title="Edit"
                          >
                            <FiEdit2 size={18} />
                          </TouchButton>
                          <TouchButton
                            onClick={() => setDeleteConfirm(product)}
                            variant="danger"
                            size="sm"
                            title="Delete"
                          >
                            <FiTrash2 size={18} />
                          </TouchButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <TouchButton
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  variant="outline"
                  size="sm"
                >
                  <FiX size={20} />
                </TouchButton>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                {/* Product Name */}
                <div>
                  <label className="label text-sm sm:text-base">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input text-sm sm:text-base"
                    placeholder="e.g., Ladies Handbag"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="label text-sm sm:text-base">Description *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input text-sm sm:text-base"
                    rows="3"
                    placeholder="Describe your product..."
                  />
                </div>

                {/* Price and Compare Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-sm sm:text-base">Price (₦) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="input text-sm sm:text-base"
                      placeholder="10000"
                    />
                  </div>
                  <div>
                    <label className="label text-sm sm:text-base">Compare at Price (₦)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.comparePrice}
                      onChange={(e) =>
                        setFormData({ ...formData, comparePrice: e.target.value })
                      }
                      className="input text-sm sm:text-base"
                      placeholder="15000"
                    />
                    <p className="text-xs text-gray-500 mt-1">Original price (for discounts)</p>
                  </div>
                </div>

                {/* Category and SKU */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-sm sm:text-base">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input text-sm sm:text-base"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label text-sm sm:text-base">SKU (Optional)</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="input text-sm sm:text-base"
                      placeholder="PROD-001"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="label text-sm sm:text-base">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="input text-sm sm:text-base"
                    placeholder="leather, women, handbag"
                  />
                </div>

                {/* Stock Status */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="inStock"
                    checked={formData.inStock}
                    onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="inStock" className="text-xs sm:text-sm font-medium text-gray-700">
                    Product is in stock
                  </label>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="label text-sm sm:text-base">Product Images (Max 5)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
                    <input
                      type="file"
                      id="images"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={images.length >= 5}
                    />
                    <label
                      htmlFor="images"
                      className={`cursor-pointer ${images.length >= 5 ? 'opacity-50' : ''}`}
                    >
                      <FiUpload className="mx-auto text-gray-400 mb-2" size={28} />
                      <p className="text-xs sm:text-sm text-gray-600">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                    </label>
                  </div>

                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-16 sm:h-20 object-cover rounded-lg"
                          />
                          <TouchButton
                            type="button"
                            onClick={() => removeImage(index)}
                            variant="danger"
                            size="sm"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition p-1"
                          >
                            <FiX size={14} />
                          </TouchButton>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <TouchButton
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    variant="secondary"
                    size="md"
                    className="flex-1 text-sm sm:text-base"
                  >
                    Cancel
                  </TouchButton>
                  <TouchButton
                    type="submit"
                    disabled={uploading}
                    loading={uploading}
                    variant="primary"
                    size="md"
                    className="flex-1 text-sm sm:text-base"
                  >
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </TouchButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <FiAlertCircle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Delete Product?</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
              </p>
              <div className="flex gap-3">
                <TouchButton
                  onClick={() => setDeleteConfirm(null)}
                  variant="secondary"
                  size="md"
                  className="flex-1"
                >
                  Cancel
                </TouchButton>
                <TouchButton
                  onClick={() => handleDelete(deleteConfirm._id)}
                  variant="danger"
                  size="md"
                  className="flex-1"
                >
                  Delete
                </TouchButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Products;
