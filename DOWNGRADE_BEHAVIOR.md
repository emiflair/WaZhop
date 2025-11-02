# Plan Downgrade Behavior

## Overview
When a user downgrades their subscription plan (Premium → Pro → Free), the system enforces plan restrictions by deactivating features and limiting access based on the new plan tier.

## Downgrade Rules

### Free Plan (After Downgrade)
When a user downgrades to the **Free Plan**, the following restrictions apply:

#### Shop Limits
- **Allowed:** 1 active shop only
- **Behavior:** The system keeps the **oldest shop** (first created) active
- **Deactivated Shops:** All additional shops are automatically set to `isActive: false`
- **Prevention:** User **cannot** downgrade if they have more than 1 shop. They must delete extra shops manually first.

#### Product Limits
- **Allowed:** 10 products total (across all shops)
- **Prevention:** User **cannot** downgrade if they have more than 10 products total. They must delete excess products first.

#### Storage Limits
- **Allowed:** 0 bytes (no image uploads)
- **Prevention:** User **cannot** downgrade to Free if they have any storage usage. They must delete all images first.
- **Affected Images:** Logos, banners, product images

#### Branding
- **Mandatory:** WaShop watermark/branding appears on all shops
- **Automatic:** All shops set to `showBranding: true` on downgrade

#### Theme Customization
- **Allowed:** Default free theme only (no customization)
- **Behavior:** Users cannot change themes, colors, or layouts
- **Error Message:** "Theme customization is not available on the Free plan. Upgrade to Pro or Premium."

### Pro Plan (After Downgrade from Premium)
When a user downgrades to the **Pro Plan**, the following restrictions apply:

#### Shop Limits
- **Allowed:** 2 active shops
- **Behavior:** If user has 3 shops from Premium, they must delete 1 shop before downgrading
- **Deactivated Shops:** Extra shops beyond 2 are set to `isActive: false`

#### Product Limits
- **Allowed:** 100 products total
- **Prevention:** User cannot downgrade if they have more than 100 products

#### Storage Limits
- **Allowed:** 65GB (69,793,218,560 bytes)
- **Behavior:** Existing storage usage is checked; downgrade blocked if exceeds Pro limit

#### Theme Customization
- **Allowed:** Preset themes only (no custom CSS)
- **Behavior:** Custom themes from Premium are reset to default Pro preset themes
- **Available Themes:** Clean White, Modern Dark, Ocean Blue, etc.

## Shop Deactivation Effects

When a shop is deactivated (`isActive: false`), the following restrictions apply:

### Public Access
- ❌ Shop page is **not accessible** via public URL (`/shop/:slug`)
- ❌ Products from inactive shops **do not appear** in public views
- ❌ Shop returns 404 error when accessed publicly

### Owner Access
- ✅ Owner can **view** inactive shops in dashboard
- ✅ Dashboard shows `activeCount` and `inactiveCount` for shops
- ✅ Owner can **see** products from inactive shops
- ❌ Owner **cannot add** new products to inactive shops
- ❌ Owner **cannot update** products in inactive shops
- ❌ Owner **cannot edit** inactive shop details
- ❌ Owner **cannot change** theme of inactive shops

### Error Messages
When attempting to modify inactive shops:
- **Add Product:** "Cannot add products to an inactive shop. This shop was deactivated due to plan limits. Please upgrade your plan to reactivate it."
- **Update Product:** "Cannot update products in an inactive shop. Please upgrade your plan to reactivate this shop."
- **Edit Shop:** "Cannot update an inactive shop. This shop was deactivated due to plan limits. Please upgrade your plan to reactivate it."

## Downgrade Process

### Step 1: Validation
Before downgrade is processed, the system checks:
1. ✅ Does user have more shops than allowed?
2. ✅ Does user have more products than allowed?
3. ✅ Is storage usage within limits?

### Step 2: Prevention
If any limit is exceeded, downgrade is **blocked** with specific error message:
```json
{
  "success": false,
  "message": "Cannot downgrade. You have 3 shops, but free plan allows only 1. Please delete 2 shop(s) first.",
  "requiresAction": true,
  "currentShops": 3,
  "allowedShops": 1
}
```

### Step 3: Execution (if validation passes)
1. Update `user.plan` to new plan
2. Reset `user.planExpiry` to null (for free plan)
3. Update all shops' `showBranding` to true (for free plan)
4. Deactivate extra shops (set `isActive: false`)
5. Reset custom themes to preset themes (Premium → Pro)

### Step 4: Response
Return success message with plan details:
```json
{
  "success": true,
  "data": {
    "plan": "free",
    "planExpiry": null,
    "restrictions": {
      "maxShops": 1,
      "maxProducts": 10,
      "storage": 0,
      "brandsRemoved": false,
      "customThemes": false
    }
  },
  "message": "Successfully downgraded to free plan. Only your oldest shop remains active. Some features have been restricted."
}
```

## Upgrade/Reactivation Behavior

### When User Upgrades Again
When a user with inactive shops upgrades to a higher plan:

1. **Manual Reactivation Required:** Inactive shops remain inactive
2. **User Action:** User must manually reactivate shops via dashboard
3. **Automatic Checks:** System validates new plan limits before allowing reactivation
4. **Data Preservation:** All data in inactive shops is preserved (products, images, settings)

### Alternative Approach (Future Enhancement)
- **Auto-Reactivation:** Automatically reactivate shops up to new plan limit
- **Prioritization:** Reactivate based on last active date or user selection
- **Notification:** Send email/notification about reactivated shops

## API Endpoints Affected

### Protected by Shop Active Status
- `PUT /api/shops/my/shop?shopId=xxx` - Update shop (blocked if inactive)
- `PUT /api/shops/my/theme?shopId=xxx` - Update theme (blocked if inactive)
- `POST /api/products` - Create product (requires `shopId`, blocked if inactive)
- `PUT /api/products/:id` - Update product (blocked if shop is inactive)

### Filtered by Shop Active Status
- `GET /api/shops/:slug` - Get shop by slug (returns 404 if inactive)
- `GET /api/products/:id` - Get product (returns 404 if shop is inactive)

### Multiple Shop Support
- `GET /api/shops/my/shops` - Returns all shops with `isActive` status
- `GET /api/products/my/products?shopId=xxx` - Supports filtering by specific shop

## Dashboard Display

### Shop List Display
Users can see all their shops with status indicators:
```json
{
  "shops": [
    {
      "id": "...",
      "shopName": "My First Shop",
      "isActive": true,
      "createdAt": "2024-01-01"
    },
    {
      "id": "...",
      "shopName": "My Second Shop",
      "isActive": false,
      "createdAt": "2024-02-01"
    }
  ],
  "activeCount": 1,
  "inactiveCount": 1,
  "maxShops": 1
}
```

### Visual Indicators (Frontend Implementation Needed)
- 🟢 **Active Shop:** Full access, normal display
- 🔴 **Inactive Shop:** Grayed out, "Upgrade to Reactivate" badge
- 💎 **Upgrade Prompt:** "You have 1 inactive shop. Upgrade to Pro to reactivate it!"

## Summary

✅ **Implemented:**
- Shop deactivation on downgrade
- Validation before downgrade (prevents data loss)
- Active status checks on all shop/product operations
- Multi-shop support in API endpoints
- Detailed error messages

⏳ **To Implement (Frontend):**
- Visual indicators for inactive shops
- Upgrade prompts for inactive shops
- Shop selection UI for multi-shop users
- Storage usage meter
- Manual shop reactivation after upgrade
