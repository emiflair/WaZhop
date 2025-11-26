import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiCopy, FiCheck, FiExternalLink, FiPackage, FiImage } from 'react-icons/fi';
import AdminLayout from '../../components/AdminLayout';
import { adminCreateAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CATEGORY_SUGGESTIONS, getCategoryLabel } from '../../utils/categories';

export default function AdminCreateStore() {
  const [loading, setLoading] = useState(false);
  const [temporaryStores, setTemporaryStores] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(null);

  // Store creation form
  const [storeForm, setStoreForm] = useState({
    name: '',
    category: 'fashion',
    tags: '',
  });

  // Product addition form
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'fashion',
    images: [],
    imagePreviews: []
  });

  const [selectedStore, setSelectedStore] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);

  useEffect(() => {
    fetchTemporaryStores();
  }, []);

  const fetchTemporaryStores = async () => {
    try {
      const response = await adminCreateAPI.getTemporaryStores();
      setTemporaryStores(response.data || []);
    } catch (error) {
      console.error('Failed to fetch temporary stores:', error);
      toast.error(error.userMessage || 'Failed to load stores');
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: storeForm.name.trim(),
        category: storeForm.category,
        tags: storeForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      const response = await adminCreateAPI.createTemporaryStore(payload);
      
      toast.success('Store created successfully!');
      setStoreForm({ name: '', category: 'fashion', tags: '' });
      setShowCreateForm(false);
      fetchTemporaryStores();

      // Show the URLs
      if (response.data) {
        const { previewUrl, activationUrl } = response.data;
        toast.success(
          <div>
            <p className="font-bold">Store Created!</p>
            <p className="text-sm mt-1">Preview URL and Activation URL copied to clipboard</p>
          </div>,
          { duration: 4000 }
        );
      }
    } catch (error) {
      console.error('Failed to create store:', error);
      toast.error(error.userMessage || 'Failed to create store');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!selectedStore) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', productForm.name.trim());
      formData.append('description', productForm.description.trim());
      formData.append('price', productForm.price);
      formData.append('category', productForm.category);
      formData.append('inStock', true);

      // Add images
      productForm.images.forEach((image) => {
        formData.append('images', image);
      });

      await adminCreateAPI.addProductToTempStore(selectedStore._id, formData);
      
      toast.success('Product added successfully!');
      setProductForm({
        name: '',
        description: '',
        price: '',
        category: 'fashion',
        images: [],
        imagePreviews: []
      });
      setShowProductForm(false);
      fetchTemporaryStores();
    } catch (error) {
      console.error('Failed to add product:', error);
      toast.error(error.userMessage || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStore = async (storeId) => {
    if (!window.confirm('Are you sure you want to delete this temporary store?')) {
      return;
    }

    try {
      await adminCreateAPI.deleteTemporaryStore(storeId);
      toast.success('Store deleted successfully');
      fetchTemporaryStores();
    } catch (error) {
      console.error('Failed to delete store:', error);
      toast.error(error.userMessage || 'Failed to delete store');
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (productForm.images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setProductForm(prev => ({
      ...prev,
      images: [...prev.images, ...files],
      imagePreviews: [
        ...prev.imagePreviews,
        ...files.map(file => URL.createObjectURL(file))
      ]
    }));
  };

  const removeImage = (index) => {
    setProductForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index)
    }));
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(type);
    toast.success(`${type} URL copied!`);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create Store for Sellers
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Pre-create stores with products for sellers to activate
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <FiPlus />
            Create New Store
          </button>
        </div>

        {/* Create Store Form */}
        {showCreateForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create Temporary Store
            </h2>
            <form onSubmit={handleCreateStore} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Premium Fashion Store"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  required
                  value={storeForm.category}
                  onChange={(e) => setStoreForm({ ...storeForm, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  {CATEGORY_SUGGESTIONS.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {getCategoryLabel(cat.value)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={storeForm.tags}
                  onChange={(e) => setStoreForm({ ...storeForm, tags: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., premium, fashion, luxury"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Store'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Temporary Stores List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Temporary Stores ({temporaryStores.length})
            </h2>
          </div>

          {temporaryStores.length === 0 ? (
            <div className="p-12 text-center">
              <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-600 dark:text-gray-400">No temporary stores yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Create your first store to get started
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {temporaryStores.map((store) => (
                <div key={store._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {store.name}
                        </h3>
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
                          Pending Activation
                        </span>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <FiPackage className="h-4 w-4" />
                          {store.productCount} products
                        </span>
                        <span>Category: {getCategoryLabel(store.category)}</span>
                        <span>
                          Created: {new Date(store.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* URLs */}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-20">
                            Preview:
                          </span>
                          <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                            <code className="flex-1 text-xs text-gray-600 dark:text-gray-300 truncate">
                              {store.previewUrl}
                            </code>
                            <button
                              onClick={() => copyToClipboard(store.previewUrl, 'Preview')}
                              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors"
                            >
                              {copiedUrl === 'Preview' ? <FiCheck className="h-4 w-4" /> : <FiCopy className="h-4 w-4" />}
                            </button>
                            <a
                              href={store.previewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors"
                            >
                              <FiExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-20">
                            Activate:
                          </span>
                          <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                            <code className="flex-1 text-xs text-gray-600 dark:text-gray-300 truncate">
                              {store.activationUrl}
                            </code>
                            <button
                              onClick={() => copyToClipboard(store.activationUrl, 'Activation')}
                              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors"
                            >
                              {copiedUrl === 'Activation' ? <FiCheck className="h-4 w-4" /> : <FiCopy className="h-4 w-4" />}
                            </button>
                            <a
                              href={store.activationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors"
                            >
                              <FiExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => {
                            setSelectedStore(store);
                            setShowProductForm(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <FiPlus className="h-4 w-4" />
                          Add Product
                        </button>
                        <button
                          onClick={() => handleDeleteStore(store._id)}
                          className="flex items-center gap-2 px-4 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <FiTrash2 className="h-4 w-4" />
                          Delete Store
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Product Modal */}
        {showProductForm && selectedStore && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Add Product to {selectedStore.name}
                </h2>
              </div>

              <form onSubmit={handleAddProduct} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Premium T-Shirt"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Describe the product..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Price (₦) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="5000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      required
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    >
                      {CATEGORY_SUGGESTIONS.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {getCategoryLabel(cat.value)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Product Images (Max 5)
                  </label>
                  
                  <div className="grid grid-cols-5 gap-3">
                    {productForm.imagePreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <FiTrash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    {productForm.images.length < 5 && (
                      <label className="aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                        <FiImage className="h-6 w-6 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-1">Add</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Adding...' : 'Add Product'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProductForm(false);
                      setSelectedStore(null);
                      setProductForm({
                        name: '',
                        description: '',
                        price: '',
                        category: 'fashion',
                        images: [],
                        imagePreviews: []
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
