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
  FiTrendingUp,
} from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa';
import DashboardLayout from '../../components/DashboardLayout';
import { TouchButton } from '../../components/mobile';
import { useNavigate } from 'react-router-dom';
import ProductPreviewModal from '../../components/ProductPreviewModal';
import { CATEGORY_SUGGESTIONS, toLabel, getSubcategories, getCategoryLabel } from '../../utils/categories';
import FlutterwavePayment from '../../components/FlutterwavePayment';

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
  const [previewProduct, setPreviewProduct] = useState(null);
  const [boostModal, setBoostModal] = useState({ open: false, product: null });
  const [boostForm, setBoostForm] = useState({ hours: 5, state: 'Lagos', area: '' });
  const [boostConfirmModal, setBoostConfirmModal] = useState({ open: false, product: null });
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [bulkUploadMode, setBulkUploadMode] = useState(false);
  const [bulkProducts, setBulkProducts] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    comparePrice: '',
    category: 'other',
    subcategory: '',
    tags: '',
    inStock: true,
    sku: '',
    locationState: 'Lagos',
    locationArea: '',
    condition: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // Track existing images with IDs
  const [uploading, setUploading] = useState(false);
  const [variants, setVariants] = useState([]);
  const [showVariants, setShowVariants] = useState(false);
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantOption, setNewVariantOption] = useState({ value: '', price: '', stock: '' });

  // Categories are free-form; suggestions come from CATEGORY_SUGGESTIONS

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
      const response = await productAPI.getMyProducts();
      console.log('📦 FETCH: Full products response:', response);
      // Handle response format: response.data or response.data.data
      const products = response?.data?.data || response?.data || [];
      console.log('✅ FETCH: Extracted products:', products.length);
      console.log('🔍 FETCH: Product conditions:', products.map(p => ({ 
        id: p._id, 
        name: p.name, 
        condition: p.condition,
        conditionType: typeof p.condition
      })));
      setProducts(products);
      setFilteredProducts(products);
    } catch (error) {
      console.error('Error loading products:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Don't show error toast if shop doesn't exist (buyer account)
      if (error.response?.status !== 404) {
        toast.error(error.response?.data?.message || 'Failed to load products');
      }
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

  // Compress image before upload
  const compressImage = async (file, maxSizeMB = 1) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions (max 1920px width, maintain aspect ratio)
          const maxWidth = 1920;
          const maxHeight = 1920;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Try different quality levels to hit target size
          let quality = 0.9;
          const tryCompress = () => {
            canvas.toBlob(
              (blob) => {
                const sizeMB = blob.size / 1024 / 1024;
                if (sizeMB > maxSizeMB && quality > 0.5) {
                  quality -= 0.1;
                  tryCompress();
                } else {
                  // Convert blob to file
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                  });
                  resolve(compressedFile);
                }
              },
              'image/jpeg',
              quality
            );
          };
          tryCompress();
        };
      };
    });
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    // Check total images (existing + new)
    const totalImages = imagePreviews.length + files.length;
    if (totalImages > 5) {
      toast.error(`Maximum 5 images allowed. You have ${imagePreviews.length} image(s) already.`);
      return;
    }

    // Only allow up to 5 in total
    const remaining = 5 - imagePreviews.length;
    const filesToAdd = files.slice(0, Math.max(0, remaining));
    
    // Compress images before adding
    toast.loading('Compressing images...', { id: 'compress' });
    try {
      const compressedFiles = await Promise.all(
        filesToAdd.map(file => compressImage(file, 1)) // Max 1MB per image
      );
      
      setImages([...images, ...compressedFiles]);

      // Create previews
      compressedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);
      });
      
      toast.success(`${compressedFiles.length} image(s) compressed and ready`, { id: 'compress' });
    } catch (error) {
      toast.error('Failed to compress images', { id: 'compress' });
      console.error('Compression error:', error);
    }
  };

  const removeImage = async (index) => {
    // Check if it's an existing image (from database) or a new one (just added)
    if (editingProduct && index < existingImages.length) {
      // It's an existing image - delete from backend immediately
      const imageToDelete = existingImages[index];
      try {
        await productAPI.deleteImage(editingProduct._id, imageToDelete._id);
        toast.success('Image deleted');
        
        // Update local state
        setExistingImages(existingImages.filter((_, i) => i !== index));
        setImagePreviews(imagePreviews.filter((_, i) => i !== index));
        
        // Refresh products list
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete image');
      }
    } else {
      // It's a new image - just remove from preview
      const newImageIndex = index - existingImages.length;
      setImages(images.filter((_, i) => i !== newImageIndex));
      setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    }
  };

  const openPreview = (product) => {
    setPreviewProduct(product);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      if (!formData.condition) {
        toast.error('Please select a product condition');
        setUploading(false);
        return;
      }

      // Handle Quick Add mode - minimal required fields
      if (quickAddMode) {
        if (!formData.name || !formData.price || !formData.category || images.length === 0) {
          toast.error('Quick Add requires: Name, Price, Category, and 1 Image');
          setUploading(false);
          return;
        }
        
        const quickProduct = {
          name: formData.name,
          description: formData.description || formData.name, // Default description to name
          price: parseFloat(formData.price),
          category: formData.category,
          subcategory: formData.subcategory || null,
          tags: [],
          inStock: true,
          locationState: user?.shopDetails?.locationState || 'Lagos',
          locationArea: user?.shopDetails?.locationArea || '',
          condition: formData.condition.toLowerCase().trim()
        };
        
        await productAPI.createProduct(quickProduct, images);
        toast.success('Product added quickly!');
        resetForm();
        setShowModal(false);
        fetchProducts();
        setUploading(false);
        return;
      }

      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : undefined,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : [],
        variants: variants.length > 0 ? variants : undefined,
      };

      // Normalize category: lowercase slug and fallback to 'other'
      productData.category = (productData.category || 'other')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-') || 'other';

      // Include condition as-is from form (no default override)
      productData.condition = formData.condition.toLowerCase().trim();
      
      console.log('💾 SAVE: Preparing to save product:', {
        editingProductId: editingProduct?._id,
        formDataCondition: formData.condition,
        finalCondition: productData.condition,
        isUpdate: !!editingProduct,
        allData: productData
      });

      if (editingProduct) {
        // Update existing product
        const updatePromises = [
          productAPI.updateProduct(editingProduct._id, productData)
        ];
        
        // Upload new images if any (in parallel)
        if (images.length > 0) {
          updatePromises.push(productAPI.uploadImages(editingProduct._id, images));
        }
        
        const results = await Promise.all(updatePromises);
        const updatedProduct = results[0]?.data?.data || results[0]?.data;
        
        console.log('✅ RESPONSE: Product update response:', {
          rawResponse: results[0],
          extractedProduct: updatedProduct,
          condition: updatedProduct?.condition,
          allFields: Object.keys(updatedProduct || {})
        });
        
        toast.success('Product updated successfully!');
      } else {
        // Require at least 1 image for new products
        if (images.length === 0) {
          toast.error('Please add at least 1 product image');
          return;
        }
        // Create new product
        await productAPI.createProduct(productData, images);
        toast.success('Product created successfully!');
      }

      resetForm();
      setShowModal(false);
      // Optimistically update UI before refetching
      fetchProducts();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save product';
      toast.error(message);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleBulkImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Compress images before creating product entries
    toast.loading('Compressing images...', { id: 'bulk-compress' });
    try {
      const compressedFiles = await Promise.all(
        files.map(file => compressImage(file, 1))
      );

      // Create a product entry for each image
      const newBulkProducts = compressedFiles.map((file, index) => ({
        id: `bulk-${Date.now()}-${index}`,
        name: '',
        price: '',
        category: '',
        subcategory: '',
        condition: '',
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));

      setBulkProducts([...bulkProducts, ...newBulkProducts]);
      toast.success(`${compressedFiles.length} image(s) compressed and ready`, { id: 'bulk-compress' });
    } catch (error) {
      toast.error('Failed to compress images', { id: 'bulk-compress' });
      console.error('Bulk compression error:', error);
    }
  };

  const updateBulkProduct = (id, field, value) => {
    setBulkProducts(prevProducts => prevProducts.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removeBulkProduct = (id) => {
    setBulkProducts(prevProducts => prevProducts.filter(p => p.id !== id));
  };

  const handleBulkSubmit = async () => {
    setUploading(true);
    
    try {
      const validProducts = bulkProducts.filter(p => p.name && p.price && p.category && p.image && p.condition);
      
      if (validProducts.length === 0) {
        toast.error('Please fill Name, Price, Category, Condition, and add an image for at least one product');
        setUploading(false);
        return;
      }

      if (validProducts.length !== bulkProducts.length) {
        toast.error('Some bulk products are missing condition. Please update all rows.');
        setUploading(false);
        return;
      }

      const promises = validProducts.map(async (bulkProduct) => {
        try {
          const productData = {
            name: bulkProduct.name,
            description: bulkProduct.description || bulkProduct.name,
            price: parseFloat(bulkProduct.price),
            category: bulkProduct.category,
            subcategory: bulkProduct.subcategory || null,
            tags: [],
            inStock: true,
            locationState: user?.shopDetails?.locationState || 'Lagos',
            locationArea: user?.shopDetails?.locationArea || '',
            condition: bulkProduct.condition.toLowerCase().trim()
          };
          
          return await productAPI.createProduct(productData, [bulkProduct.image]);
        } catch (err) {
          console.error(`Failed to create product "${bulkProduct.name}":`, err);
          return { error: true, message: err.response?.data?.message || err.message, name: bulkProduct.name };
        }
      });

      const results = await Promise.all(promises);
      const failures = results.filter(r => r?.error);
      const successes = results.filter(r => !r?.error);
      
      if (failures.length > 0) {
        const failedNames = failures.map(f => f.name).join(', ');
        toast.error(`${failures.length} product(s) failed: ${failedNames}. ${failures[0]?.message || ''}`);
      }
      
      if (successes.length > 0) {
        toast.success(`${successes.length} product(s) created successfully!`);
        setBulkProducts([]);
        setBulkUploadMode(false);
        setShowModal(false);
        fetchProducts();
      }
    } catch (error) {
      toast.error('Bulk upload failed. Please try again.');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setQuickAddMode(false);
    setBulkUploadMode(false);
    const normalizedCondition = (product.condition || '').toLowerCase();
    
    console.log('🔄 EDIT: Loading product for edit:', {
      productId: product._id,
      rawCondition: product.condition,
      normalizedCondition,
      productData: product
    });

    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      comparePrice: product.comparePrice?.toString() || '',
      category: product.category,
      subcategory: product.subcategory || '',
      tags: product.tags?.join(', ') || '',
      inStock: product.inStock,
      sku: product.sku || '',
      locationState: product.locationState || 'Lagos',
      locationArea: product.locationArea || '',
      condition: normalizedCondition
    });
    
    // Load existing images with IDs
    if (product.images && product.images.length > 0) {
      setExistingImages(product.images); // Store full image objects with IDs
      const existingImageUrls = product.images.map(img => img.url);
      setImagePreviews(existingImageUrls);
    } else {
      setExistingImages([]);
      setImagePreviews([]);
    }
    setImages([]); // Clear new images (only show existing)
    
    // Load variants if they exist
    if (product.variants && product.variants.length > 0) {
      setVariants(product.variants);
      setShowVariants(true);
    } else {
      setVariants([]);
      setShowVariants(false);
    }
    
    setShowModal(true);
  };

  const handleDuplicate = (product) => {
    setEditingProduct(null); // Not editing, creating new
    setQuickAddMode(false);
    setBulkUploadMode(false);
    const normalizedCondition = (product.condition || '').toLowerCase();

    setFormData({
      name: `${product.name} (Copy)`,
      description: product.description,
      price: product.price.toString(),
      comparePrice: product.comparePrice?.toString() || '',
      category: product.category,
      subcategory: product.subcategory || '',
      tags: product.tags?.join(', ') || '',
      inStock: product.inStock,
      sku: product.sku ? `${product.sku}-copy` : '',
      locationState: product.locationState || 'Lagos',
      locationArea: product.locationArea || '',
      condition: normalizedCondition
    });
    
    // Don't copy images - seller needs to add new ones
    setExistingImages([]);
    setImagePreviews([]);
    setImages([]);
    
    toast.success('Product duplicated! Add images and save.');
    setShowModal(true);
  };

  // Nigeria states list for targeting
  const NG_STATES = [
    'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'
  ];

  const openBoost = async (product) => {
    // Show custom confirmation modal
    setBoostConfirmModal({ open: true, product });
  };

  const confirmBoost = async () => {
    const product = boostConfirmModal.product;
    setBoostConfirmModal({ open: false, product: null });
    
    setBoostModal({ open: true, product });
    setBoostForm((prev) => ({ ...prev, area: '', state: 'Lagos', hours: 5 }));
    try {
      const status = await productAPI.getBoostStatus(product._id);
      if (status?.active) {
        toast(`Active boost ends ${new Date(status.endAt).toLocaleString()}`);
      }
    } catch (err) {
      // ignore
    }
  };

  const submitBoost = async (paymentData) => {
    const { product } = boostModal;
    if (!product) return;
    try {
      const payload = { 
        hours: Number(boostForm.hours), 
        state: boostForm.state, 
        area: boostForm.area,
        transactionId: paymentData.transactionId,
        amount: paymentData.amount
      };
      const updated = await productAPI.boostProduct(product._id, payload);
      toast.success('Boost activated successfully!');
      setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      setFilteredProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
      setBoostModal({ open: false, product: null });
    } catch (e) {
      toast.error(e.userMessage || 'Failed to start boost');
    }
  };

  const handleBoostPaymentCancel = (data) => {
    if (data.cancelled || data.failed) {
      setBoostModal({ open: false, product: null });
      // Use setTimeout to ensure modal closes before navigation
      setTimeout(() => {
        toast.error('Payment was cancelled or failed');
        navigate('/dashboard/subscription');
      }, 100);
    }
  };

  const getBoostBadge = (product) => {
    const end = product?.boost?.endAt ? new Date(product.boost.endAt) : null;
    if (end && end > new Date()) {
      const ms = end - new Date();
      const hoursLeft = Math.max(1, Math.floor(ms / 3600000));
      return `Boosting • ${hoursLeft}h left`;
    }
    return null;
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

  const toggleInStock = async (productId, currentInStock) => {
    try {
      await productAPI.updateProduct(productId, { inStock: !currentInStock });
      toast.success('Stock status updated');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update stock');
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
      subcategory: '',
      tags: '',
      inStock: true,
      sku: '',
      locationState: 'Lagos',
      locationArea: '',
      condition: ''
    });
    setImages([]);
    setImagePreviews([]);
    setExistingImages([]);
    setEditingProduct(null);
    setQuickAddMode(false);
    setBulkUploadMode(false);
    setBulkProducts([]);
    setVariants([]);
    setShowVariants(false);
    setNewVariantName('');
    setNewVariantOption({ value: '', price: '', stock: '' });
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
          <div className="flex gap-2 w-full sm:w-auto flex-wrap">
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
                setQuickAddMode(true);
                setShowModal(true);
              }}
              disabled={products.length >= getPlanLimits()}
              variant="secondary"
              size="md"
              className="flex-1 sm:flex-none"
            >
              <FiPlus className="mr-2" /> Quick Add
            </TouchButton>
            <TouchButton
              onClick={() => {
                setBulkUploadMode(true);
                setBulkProducts([]);
                setShowModal(true);
              }}
              disabled={products.length >= getPlanLimits()}
              variant="secondary"
              size="md"
              className="flex-1 sm:flex-none"
            >
              <FiUpload className="mr-2" /> Bulk Upload
            </TouchButton>
            <TouchButton
              onClick={() => {
                resetForm();
                setQuickAddMode(false);
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
                  <div className="flex items-start gap-3 mb-3" onClick={() => openPreview(product)}>
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product._id)}
                      onChange={() => toggleSelectProduct(product._id)}
                      onClick={(e) => e.stopPropagation()}
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
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {toLabel(product.category || 'other')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {getBoostBadge(product) && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                            {getBoostBadge(product)}
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleInStock(product._id, product.inStock); }}
                          className={`text-xs px-2 py-1 rounded-full ${
                            product.inStock
                              ? 'bg-primary-100 text-primary-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleProductStatus(product._id, product.isActive); }}
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
                  <div className="flex items-center justify-end gap-2 ml-20 flex-wrap">
                    <TouchButton
                      onClick={() => openBoost(product)}
                      variant="purple"
                      size="sm"
                      title="Boost"
                    >
                      Boost
                    </TouchButton>
                    <TouchButton
                      onClick={() => handleDuplicate(product)}
                      variant="secondary"
                      size="sm"
                      title="Duplicate"
                    >
                      <FiPlus size={16} />
                    </TouchButton>
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
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => openPreview(product)}>
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
                          {getBoostBadge(product) && (
                            <p className="text-xs text-yellow-700 bg-yellow-50 inline-block mt-1 px-2 py-0.5 rounded-full">
                              {getBoostBadge(product)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">
                          {toLabel(product.category || 'other')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleInStock(product._id, product.inStock)}
                          className={`text-sm px-3 py-1 rounded-full ${
                            product.inStock
                              ? 'bg-primary-100 text-primary-700'
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
                            onClick={() => openBoost(product)}
                            variant="purple"
                            size="sm"
                            title="Boost"
                          >
                            Boost
                          </TouchButton>
                          <TouchButton
                            onClick={() => handleEdit(product)}
                            variant="outline"
                            size="sm"
                            title="Edit"
                          >
                            <FiEdit2 size={18} />
                          </TouchButton>
                          <TouchButton
                            onClick={() => handleDuplicate(product)}
                            variant="secondary"
                            size="sm"
                            title="Duplicate"
                          >
                            <FiPlus size={18} />
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
                  {bulkUploadMode
                    ? 'Bulk Upload Products'
                    : quickAddMode
                    ? 'Quick Add Product'
                    : editingProduct
                    ? 'Edit Product'
                    : 'Add New Product'}
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

              {bulkUploadMode ? (
                // Bulk Upload Mode
                <div className="p-4 sm:p-6 space-y-4">
                  {bulkProducts.length === 0 ? (
                    <div>
                      <label className="label text-sm sm:text-base">Upload Multiple Product Images</label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          id="bulk-images"
                          multiple
                          accept="image/*"
                          onChange={handleBulkImageUpload}
                          className="hidden"
                        />
                        <label htmlFor="bulk-images" className="cursor-pointer">
                          <FiUpload className="mx-auto text-gray-400 mb-2" size={32} />
                          <p className="text-sm text-gray-600 mb-1">Click to upload multiple images</p>
                          <p className="text-xs text-gray-500">Each image will create a product. Add names and prices after upload.</p>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600">
                        Review and fill in product details for each image. Products with name and price will be created.
                      </p>
                      <div className="max-h-96 overflow-y-auto border rounded-lg">
                        <table className="w-full">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium">Image</th>
                              <th className="px-3 py-2 text-left text-xs font-medium">Name *</th>
                              <th className="px-3 py-2 text-left text-xs font-medium">Price (₦) *</th>
                              <th className="px-3 py-2 text-left text-xs font-medium">Category *</th>
                              <th className="px-3 py-2 text-left text-xs font-medium">Subcategory</th>
                              <th className="px-3 py-2 text-left text-xs font-medium">Condition *</th>
                              <th className="px-3 py-2 text-center text-xs font-medium">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bulkProducts.map((product) => (
                              <tr key={product.id} className="border-t">
                                <td className="px-3 py-2">
                                  <img
                                    src={product.imagePreview}
                                    alt="Preview"
                                    className="w-12 h-12 object-cover rounded"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="text"
                                    value={product.name}
                                    onChange={(e) => updateBulkProduct(product.id, 'name', e.target.value)}
                                    className="input text-sm w-full"
                                    placeholder="Product name"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={product.price}
                                    onChange={(e) => updateBulkProduct(product.id, 'price', e.target.value)}
                                    className="input text-sm w-full"
                                    placeholder="0"
                                    min="0"
                                    step="0.01"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <select
                                    value={product.category}
                                    onChange={(e) => {
                                      updateBulkProduct(product.id, 'category', e.target.value);
                                      updateBulkProduct(product.id, 'subcategory', '');
                                    }}
                                    className="input text-sm w-full"
                                  >
                                    <option value="">Select</option>
                                    {CATEGORY_SUGGESTIONS.map((c) => (
                                      <option key={c} value={c}>{getCategoryLabel(c)}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-3 py-2">
                                  {product.category && getSubcategories(product.category).length > 0 ? (
                                    <select
                                      value={product.subcategory}
                                      onChange={(e) => updateBulkProduct(product.id, 'subcategory', e.target.value)}
                                      className="input text-sm w-full"
                                    >
                                      <option value="">Select</option>
                                      {getSubcategories(product.category).map((sub) => (
                                        <option key={sub} value={sub}>{toLabel(sub)}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      disabled
                                      className="input text-sm w-full bg-gray-100"
                                      placeholder="-"
                                    />
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  <select
                                    value={product.condition}
                                    onChange={(e) => updateBulkProduct(product.id, 'condition', e.target.value)}
                                    className="input text-sm w-full"
                                  >
                                    <option value="">Select condition</option>
                                    <option value="brand new">Brand New</option>
                                    <option value="used">Used</option>
                                  </select>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <TouchButton
                                    type="button"
                                    onClick={() => removeBulkProduct(product.id)}
                                    variant="danger"
                                    size="sm"
                                  >
                                    <FiX size={16} />
                                  </TouchButton>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex gap-3 pt-4">
                        <TouchButton
                          type="button"
                          onClick={() => {
                            setShowModal(false);
                            resetForm();
                          }}
                          variant="secondary"
                          size="md"
                          className="flex-1"
                        >
                          Cancel
                        </TouchButton>
                        <TouchButton
                          type="button"
                          onClick={handleBulkSubmit}
                          disabled={uploading || bulkProducts.every(p => !p.name || !p.price || !p.category)}
                          loading={uploading}
                          variant="primary"
                          size="md"
                          className="flex-1"
                        >
                          Create All Products
                        </TouchButton>
                      </div>
                    </>
                  )}
                </div>
              ) : quickAddMode ? (
                // Quick Add Mode - Minimal form
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Quickly add a product with just the essentials. Other details can be edited later.
                  </p>

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

                  {/* Price */}
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

                  {/* Category and Subcategory */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label text-sm sm:text-base">Category *</label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
                        className="input text-sm sm:text-base"
                      >
                        <option value="">Select category</option>
                        {CATEGORY_SUGGESTIONS.map((c) => (
                          <option key={c} value={c}>{getCategoryLabel(c)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label text-sm sm:text-base">Subcategory</label>
                      {formData.category && getSubcategories(formData.category).length > 0 ? (
                        <select
                          value={formData.subcategory}
                          onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                          className="input text-sm sm:text-base"
                        >
                          <option value="">Select subcategory</option>
                          {getSubcategories(formData.category).map((sub) => (
                            <option key={sub} value={sub}>{toLabel(sub)}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          disabled
                          className="input text-sm sm:text-base bg-gray-100 dark:bg-gray-700"
                          placeholder="Select category first"
                        />
                      )}
                    </div>
                  </div>

                  {/* Product Condition */}
                  <div>
                    <label className="label text-sm sm:text-base">Condition *</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="condition-quick"
                          value="brand new"
                          checked={formData.condition === 'brand new'}
                          onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm sm:text-base">Brand New</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="condition-quick"
                          value="used"
                          checked={formData.condition === 'used'}
                          onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm sm:text-base">Used</span>
                      </label>
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="label text-sm sm:text-base">Product Image *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        id="quick-image"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        disabled={imagePreviews.length >= 1}
                      />
                      <label htmlFor="quick-image" className="cursor-pointer">
                        <FiUpload className="mx-auto text-gray-400 mb-2" size={28} />
                        <p className="text-xs sm:text-sm text-gray-600">Click to upload image</p>
                      </label>
                    </div>

                    {imagePreviews.length > 0 && (
                      <div className="mt-3 relative inline-block">
                        <img
                          src={imagePreviews[0]}
                          alt="Preview"
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <TouchButton
                          type="button"
                          onClick={() => removeImage(0)}
                          variant="danger"
                          size="sm"
                          className="absolute -top-2 -right-2"
                        >
                          <FiX size={14} />
                        </TouchButton>
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
                      Quick Add
                    </TouchButton>
                  </div>
                </form>
              ) : (
                // Full form for regular add/edit
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
                    <p className="text-xs text-gray-500 mt-1">Boosting starts at ₦400/hour. Use Boost to reach nearby customers.</p>
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

                {/* Category and Subcategory */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-sm sm:text-base">Category *</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
                      className="input text-sm sm:text-base"
                    >
                      <option value="">Select a category</option>
                      {CATEGORY_SUGGESTIONS.map((c) => (
                        <option key={c} value={c}>{getCategoryLabel(c)}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Select the main category for your product</p>
                  </div>
                  <div>
                    <label className="label text-sm sm:text-base">
                      Subcategory {formData.category && getSubcategories(formData.category).length > 0 && '*'}
                    </label>
                    {formData.category && getSubcategories(formData.category).length > 0 ? (
                      <>
                        <select
                          required={formData.category && getSubcategories(formData.category).length > 0}
                          value={formData.subcategory}
                          onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                          className="input text-sm sm:text-base"
                        >
                          <option value="">Select a subcategory</option>
                          {getSubcategories(formData.category).map((sub) => (
                            <option key={sub} value={sub}>{toLabel(sub)}</option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Select a specific subcategory</p>
                      </>
                    ) : (
                      <>
                        <input
                          type="text"
                          disabled
                          className="input text-sm sm:text-base bg-gray-100 dark:bg-gray-700"
                          placeholder="Select a category first"
                        />
                        <p className="text-xs text-gray-500 mt-1">Subcategory will appear after selecting category</p>
                      </>
                    )}
                  </div>
                </div>

                {/* SKU and Tags */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>

                {/* Product Condition */}
                <div>
                  <label className="label text-sm sm:text-base">Product Condition *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="condition"
                        value="brand new"
                        checked={formData.condition === 'brand new'}
                        onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm sm:text-base">Brand New</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="condition"
                        value="used"
                        checked={formData.condition === 'used'}
                        onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm sm:text-base">Used</span>
                    </label>
                  </div>
                </div>

                {/* Product Variants (Size, Color, etc.) */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <label className="label text-sm sm:text-base mb-0">Product Variants (Optional)</label>
                      <p className="text-xs text-gray-500 mt-1">Add sizes, colors, or other variants</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowVariants(!showVariants)}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {showVariants ? 'Hide' : 'Add Variants'}
                    </button>
                  </div>

                  {showVariants && (
                    <div className="space-y-4">
                      {/* Add New Variant Type */}
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                            Variant Type (e.g., Size, Color)
                          </label>
                          <input
                            type="text"
                            value={newVariantName}
                            onChange={(e) => setNewVariantName(e.target.value)}
                            className="input text-sm w-full"
                            placeholder="Size"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                              Option *
                            </label>
                            <input
                              type="text"
                              value={newVariantOption.value}
                              onChange={(e) => setNewVariantOption({ ...newVariantOption, value: e.target.value })}
                              className="input text-sm"
                              placeholder="Small"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                              Extra Price (₦)
                            </label>
                            <input
                              type="number"
                              value={newVariantOption.price}
                              onChange={(e) => setNewVariantOption({ ...newVariantOption, price: e.target.value })}
                              className="input text-sm"
                              placeholder="0"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                              Stock
                            </label>
                            <input
                              type="number"
                              value={newVariantOption.stock}
                              onChange={(e) => setNewVariantOption({ ...newVariantOption, stock: e.target.value })}
                              className="input text-sm"
                              placeholder="10"
                              min="0"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (newVariantName && newVariantOption.value) {
                              const existingVariant = variants.find(v => v.name === newVariantName);
                              if (existingVariant) {
                                setVariants(variants.map(v => 
                                  v.name === newVariantName
                                    ? { ...v, options: [...v.options, { 
                                        value: newVariantOption.value,
                                        price: parseFloat(newVariantOption.price) || 0,
                                        stock: parseInt(newVariantOption.stock) || null
                                      }]}
                                    : v
                                ));
                              } else {
                                setVariants([...variants, {
                                  name: newVariantName,
                                  options: [{ 
                                    value: newVariantOption.value,
                                    price: parseFloat(newVariantOption.price) || 0,
                                    stock: parseInt(newVariantOption.stock) || null
                                  }]
                                }]);
                              }
                              setNewVariantOption({ value: '', price: '', stock: '' });
                              toast.success('Variant option added');
                            }
                          }}
                          className="btn btn-sm btn-outline w-full"
                        >
                          <FiPlus className="mr-1" size={14} /> Add Option
                        </button>
                      </div>

                      {/* Display Existing Variants */}
                      {variants.length > 0 && (
                        <div className="space-y-3">
                          {variants.map((variant, vIndex) => (
                            <div key={vIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                  {variant.name}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => setVariants(variants.filter((_, i) => i !== vIndex))}
                                  className="text-xs text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="space-y-1">
                                {variant.options.map((option, oIndex) => (
                                  <div key={oIndex} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">
                                    <span className="text-gray-700 dark:text-gray-300">{option.value}</span>
                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                      {option.price > 0 && <span>+₦{option.price}</span>}
                                      {option.stock && <span>Stock: {option.stock}</span>}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = [...variants];
                                          updated[vIndex].options = updated[vIndex].options.filter((_, i) => i !== oIndex);
                                          if (updated[vIndex].options.length === 0) {
                                            updated.splice(vIndex, 1);
                                          }
                                          setVariants(updated);
                                        }}
                                        className="text-red-600 hover:text-red-700 ml-2"
                                      >
                                        <FiX size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Location Targeting */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-sm sm:text-base">State (Nigeria) *</label>
                    <select
                      required
                      className="input text-sm sm:text-base"
                      value={formData.locationState}
                      onChange={(e) => setFormData({ ...formData, locationState: e.target.value })}
                    >
                      {NG_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Select the state buyers should see this product in search.</p>
                  </div>
                  <div>
                    <label className="label text-sm sm:text-base">Area (Optional)</label>
                    <input
                      type="text"
                      value={formData.locationArea}
                      onChange={(e) => setFormData({ ...formData, locationArea: e.target.value })}
                      className="input text-sm sm:text-base"
                      placeholder="e.g., Victoria Island"
                    />
                    <p className="text-xs text-gray-500 mt-1">More specific area or neighborhood.</p>
                  </div>
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
                      disabled={imagePreviews.length >= 5}
                    />
                    <label
                      htmlFor="images"
                      className={`cursor-pointer ${imagePreviews.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <FiUpload className="mx-auto text-gray-400 mb-2" size={28} />
                      <p className="text-xs sm:text-sm text-gray-600">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB • Up to 5 images</p>
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
              )}
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
      {/* Preview Modal */}
      {previewProduct && (
        <ProductPreviewModal
          product={previewProduct}
          onClose={() => setPreviewProduct(null)}
        />
      )}

      {/* Boost Confirmation Modal */}
      {boostConfirmModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <FiTrendingUp className="text-primary-600 dark:text-primary-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Boost This Product?</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reach more nearby customers</p>
              </div>
            </div>
            {boostConfirmModal.product && (
              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  You&apos;re about to boost <strong className="text-gray-900 dark:text-white">{boostConfirmModal.product.name}</strong>
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400">
                  <p className="mb-1">• Pricing: <span className="font-semibold">₦400/hour</span></p>
                  <p>• Your product will appear in targeted search results</p>
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <TouchButton
                onClick={() => setBoostConfirmModal({ open: false, product: null })}
                variant="secondary"
                size="md"
                className="flex-1"
              >
                Cancel
              </TouchButton>
              <TouchButton
                onClick={confirmBoost}
                variant="primary"
                size="md"
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white"
              >
                Continue
              </TouchButton>
            </div>
          </div>
        </div>
      )}

      {/* Boost Modal */}
      {boostModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Boost Product</h3>
              <TouchButton onClick={() => setBoostModal({ open: false, product: null })} variant="outline" size="sm">
                <FiX />
              </TouchButton>
            </div>
            <p className="text-sm text-gray-600 mb-4">Reach more nearby customers. Pricing: ₦400/hour.</p>
            <div className="space-y-3">
              <div>
                <label className="label">Hours</label>
                <select
                  className="input"
                  value={boostForm.hours}
                  onChange={(e) => setBoostForm({ ...boostForm, hours: Number(e.target.value) })}
                >
                  {[5, 10, 15, 20, 24, 48, 72, 96, 120, 168].map((h) => (
                    <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''} - ₦{(h * 400).toLocaleString()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">State (Nigeria)</label>
                <select
                  className="input"
                  value={boostForm.state}
                  onChange={(e) => setBoostForm({ ...boostForm, state: e.target.value })}
                >
                  {NG_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Area (optional)</label>
                <input
                  type="text"
                  value={boostForm.area}
                  onChange={(e) => setBoostForm({ ...boostForm, area: e.target.value })}
                  className="input"
                  placeholder="e.g., Victoria Island"
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-700">Total</span>
                <span className="text-lg font-semibold">₦{(Number(boostForm.hours || 0) * 400).toLocaleString()}</span>
              </div>
              <FlutterwavePayment
                amount={Number(boostForm.hours || 0) * 400}
                email={user?.email || 'user@example.com'}
                name={user?.name || 'User'}
                phone={user?.phone || ''}
                planName="Product Boost"
                billingPeriod={`${boostForm.hours} hour${boostForm.hours > 1 ? 's' : ''}`}
                onSuccess={submitBoost}
                onClose={handleBoostPaymentCancel}
              >
                <TouchButton variant="purple" size="md" className="w-full">Pay ₦{(Number(boostForm.hours || 0) * 400).toLocaleString()}</TouchButton>
              </FlutterwavePayment>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Products;
