const mongoose = require('mongoose');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

/**
 * Enforce Free plan limits for a user.
 * Options:
 *  - destructive: when true, removes extra shops, products and ALL images; sets storageUsed=0
 *  - keepProducts: when true with destructive=false, does not delete any data, only deactivates extra shops
 */
async function enforceFreePlanForUser(userId, options = {}) {
  const { destructive = false } = options;

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const shops = await Shop.find({ owner: userId }).sort({ createdAt: 1 });
  const stats = {
    primaryShopId: null,
    deactivatedShops: 0,
    deletedShops: 0,
    deletedProducts: 0,
    clearedImages: 0
  };

  if (shops.length === 0) {
    return stats;
  }

  const [primaryShop, ...otherShops] = shops;
  stats.primaryShopId = primaryShop._id;

  if (destructive) {
    // Delete all other shops completely (products + images)
    for (const shop of otherShops) {
      // Delete product images and products
      const products = await Product.find({ shop: shop._id });
      for (const product of products) {
        if (product.images && product.images.length) {
          for (const img of product.images) {
            try { await cloudinary.uploader.destroy(img.publicId); } catch (e) { /* ignore */ }
            stats.clearedImages += 1;
          }
        }
        await product.deleteOne();
        stats.deletedProducts += 1;
      }

      // Delete shop media
      for (const key of ['logo', 'banner', 'profileImage']) {
        const media = shop[key];
        if (media?.publicId) {
          try { await cloudinary.uploader.destroy(media.publicId); } catch (e) { /* ignore */ }
          shop[key] = { url: null, publicId: null };
          stats.clearedImages += 1;
        }
      }

      await shop.deleteOne();
      stats.deletedShops += 1;
    }

    // For the primary shop: keep up to 10 most recent products; delete the rest
    const primaryProducts = await Product.find({ shop: primaryShop._id }).sort({ createdAt: -1 });
    const productsToKeep = primaryProducts.slice(0, 10).map((p) => p._id.toString());
    for (const product of primaryProducts) {
      if (!productsToKeep.includes(product._id.toString())) {
        if (product.images && product.images.length) {
          for (const img of product.images) {
            try { await cloudinary.uploader.destroy(img.publicId); } catch (e) { /* ignore */ }
            stats.clearedImages += 1;
          }
        }
        await product.deleteOne();
        stats.deletedProducts += 1;
      } else if (product.images && product.images.length) {
        // Free plan has no storage: clear ALL images on kept products
        for (const img of product.images) {
          try { await cloudinary.uploader.destroy(img.publicId); } catch (e) { /* ignore */ }
          stats.clearedImages += 1;
        }
        product.images = [];
        await product.save();
      }
    }

    // Clear shop media on primary shop too (free plan has no storage)
    for (const key of ['logo', 'banner', 'profileImage']) {
      const media = primaryShop[key];
      if (media?.publicId) {
        try { await cloudinary.uploader.destroy(media.publicId); } catch (e) { /* ignore */ }
        primaryShop[key] = { url: null, publicId: null };
        stats.clearedImages += 1;
      }
    }

    primaryShop.isActive = true;
    primaryShop.showBranding = true;
    primaryShop.showWatermark = true;
    await primaryShop.save();

    // Reset storage usage counter to 0 since all images are cleared
    user.storageUsed = 0;
    await user.save();
  } else {
    // Restrictive mode: keep data but enforce limits by deactivating extras
    // ALWAYS keep the primary (first) shop active, even on free plan
    if (!primaryShop.isActive) {
      primaryShop.isActive = true;
      primaryShop.showBranding = true;
      primaryShop.showWatermark = true;
      await primaryShop.save();
    }
    
    // Deactivate all other shops (only if user has multiple shops)
    if (otherShops.length) {
      await Shop.updateMany(
        { _id: { $in: otherShops.map((s) => s._id) } },
        { $set: { isActive: false, showBranding: true, showWatermark: true } }
      );
      stats.deactivatedShops = otherShops.length;
    }

    // Ensure branding on primary shop for free plan
    await Shop.updateOne(
      { _id: primaryShop._id },
      { $set: { showBranding: true, showWatermark: true } }
    );
  }

  return stats;
}

module.exports = { enforceFreePlanForUser };
