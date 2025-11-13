const axios = require('axios');
const crypto = require('crypto');

/**
 * WhatsApp Business API Integration
 * Supports Meta's WhatsApp Business Platform (Cloud API)
 */

class WhatsAppService {
  constructor() {
    this.apiUrl = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  }

  /**
   * Send a text message
   */
  async sendMessage(to, message) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message }
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
      console.error('WhatsApp send message error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * Send a template message (pre-approved by Meta)
   */
  async sendTemplateMessage(to, templateName, languageCode = 'en', components = []) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            components
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
      console.error('WhatsApp send template error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * Send order confirmation message
   */
  async sendOrderConfirmation(to, orderDetails) {
    const message = `🎉 *Order Confirmed!*\n\nOrder #${orderDetails.orderId}\nTotal: ₦${orderDetails.total.toLocaleString()}\nItems: ${orderDetails.itemCount}\n\nWe'll notify you when your order is ready for delivery.\n\nTrack your order: ${orderDetails.trackingUrl}`;

    return this.sendMessage(to, message);
  }

  /**
   * Send order status update
   */
  async sendOrderStatusUpdate(to, orderId, status, additionalInfo = '') {
    const statusMessages = {
      processing: '⏳ Your order is being processed',
      shipped: '🚚 Your order has been shipped',
      delivered: '✅ Your order has been delivered',
      cancelled: '❌ Your order has been cancelled'
    };

    const statusLine = statusMessages[status] || `Status: ${status}`;
    const addl = additionalInfo ? `${additionalInfo}\n\n` : '';
    const message = `*Order #${orderId}*\n\n${statusLine}\n\n${addl}Thank you for shopping with us!`;

    return this.sendMessage(to, message);
  }

  /**
   * Send promotional message (requires template approval)
   */
  async sendPromotion(to, promoDetails) {
    const discount = promoDetails.discount ? `Discount: ${promoDetails.discount}\n` : '';
    const code = promoDetails.code ? `Use code: *${promoDetails.code}*\n` : '';
    const valid = promoDetails.validUntil ? `Valid until: ${promoDetails.validUntil}\n` : '';
    const message = `🎁 *Special Offer!*\n\n${promoDetails.title}\n\n${promoDetails.description}\n\n${discount}${code}${valid}\nShop now: ${promoDetails.shopUrl}`;

    return this.sendMessage(to, message);
  }

  /**
   * Send product catalog message
   */
  async sendCatalogMessage(to, catalogId, productIds = []) {
    try {
      const body = {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'product_list',
          header: {
            type: 'text',
            text: 'Our Products'
          },
          body: {
            text: 'Browse our amazing collection! Tap to view details.'
          },
          action: {
            catalog_id: catalogId,
            sections: [
              {
                title: 'Featured Products',
                product_items: productIds.map((id) => ({ product_retailer_id: id }))
              }
            ]
          }
        }
      };

      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        body,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
      console.error('WhatsApp send catalog error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * Create/Update WhatsApp Business Catalog
   */
  async createCatalog(catalogName, products) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.businessAccountId}/product_catalogs`,
        {
          name: catalogName,
          availability: 'in_stock'
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const catalogId = response.data.id;

      // Add products to catalog
      for (const product of products) {
        await this.addProductToCatalog(catalogId, product);
      }

      return { success: true, catalogId };
    } catch (error) {
      console.error('WhatsApp create catalog error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * Add product to catalog
   */
  async addProductToCatalog(catalogId, product) {
    try {
      await axios.post(
        `${this.apiUrl}/${catalogId}/products`,
        {
          retailer_id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          currency: product.currency || 'NGN',
          availability: product.inStock ? 'in stock' : 'out of stock',
          image_url: product.image,
          url: product.url
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return { success: true };
    } catch (error) {
      console.error('WhatsApp add product error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data || error.message };
    }
  }

  /**
   * Generate WhatsApp Status share link
   */
  generateStatusShareLink(productUrl, productName, productImage) {
    // WhatsApp Status sharing via deep link
    const text = encodeURIComponent(`Check out ${productName}! 🛍️\n${productUrl}`);
    return `whatsapp://status?text=${text}`;
  }

  /**
   * Generate WhatsApp chat link for product inquiry
   */
  generateProductInquiryLink(phoneNumber, productName, productUrl) {
    const message = encodeURIComponent(
      `Hi! I'm interested in *${productName}*\n\n${productUrl}\n\nCan you provide more details?`
    );
    return `https://wa.me/${phoneNumber}?text=${message}`;
  }

  /**
   * Send abandoned cart reminder
   */
  async sendAbandonedCartReminder(to, cartDetails) {
    const itemsList = cartDetails.items
      .map((item) => `• ${item.name} (₦${item.price.toLocaleString()})`)
      .join('\n');
    const message = `🛒 *You left items in your cart!*\n\nDon't miss out on:\n${itemsList}\n\nTotal: ₦${cartDetails.total.toLocaleString()}\n\nComplete your purchase now: ${cartDetails.checkoutUrl}`;

    return this.sendMessage(to, message);
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(signature, body) {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.WHATSAPP_WEBHOOK_SECRET || '')
      .update(body)
      .digest('hex');
    return signature === `sha256=${expectedSignature}`;
  }
}

module.exports = new WhatsAppService();
