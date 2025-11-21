require('dotenv').config();
const mongoose = require('mongoose');
const Shop = require('../models/Shop');
const User = require('../models/User');

/**
 * Diagnostic script to check shop ownership issues
 * 
 * This script will:
 * 1. List all shops and their owners
 * 2. Check if any shops have invalid owner references
 * 3. Identify users who should have shops but don't
 * 4. Find shops that are referenced by multiple users
 */

async function diagnoseShopOwnership() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all shops
    const shops = await Shop.find().lean();
    console.log(`\n📊 Total shops in database: ${shops.length}`);

    // Get all users with shop references
    const usersWithShops = await User.find({ shop: { $ne: null } }).lean();
    console.log(`👥 Users with shop references: ${usersWithShops.length}`);

    // Check for shop ownership issues
    console.log('\n🔍 Analyzing shop ownership...\n');

    const ownershipMap = new Map(); // owner ID -> array of shops
    const shopToUsersMap = new Map(); // shop ID -> array of users

    // Build ownership map
    for (const shop of shops) {
      const ownerId = shop.owner.toString();
      if (!ownershipMap.has(ownerId)) {
        ownershipMap.set(ownerId, []);
      }
      ownershipMap.get(ownerId).push(shop);
    }

    // Build shop-to-users map
    for (const user of usersWithShops) {
      const shopId = user.shop.toString();
      if (!shopToUsersMap.has(shopId)) {
        shopToUsersMap.set(shopId, []);
      }
      shopToUsersMap.get(shopId).push(user);
    }

    // Report issues
    console.log('🚨 ISSUES FOUND:\n');

    let issueCount = 0;

    // Issue 1: Shops referenced by multiple users
    for (const [shopId, users] of shopToUsersMap.entries()) {
      if (users.length > 1) {
        issueCount++;
        const shop = shops.find(s => s._id.toString() === shopId);
        console.log(`❌ Shop "${shop?.shopName || shopId}" is referenced by ${users.length} users:`);
        for (const user of users) {
          console.log(`   - User: ${user.name} (${user.email}) - ID: ${user._id}`);
        }
        if (shop) {
          console.log(`   Actual owner: ${shop.owner}`);
          const actualOwner = await User.findById(shop.owner).lean();
          if (actualOwner) {
            console.log(`   Owner details: ${actualOwner.name} (${actualOwner.email})`);
          }
        }
        console.log('');
      }
    }

    // Issue 2: Users with shop references that don't match the shop's owner
    for (const user of usersWithShops) {
      const shopId = user.shop.toString();
      const shop = shops.find(s => s._id.toString() === shopId);
      
      if (!shop) {
        issueCount++;
        console.log(`❌ User "${user.name}" (${user.email}) references non-existent shop: ${shopId}`);
        console.log('');
        continue;
      }

      if (shop.owner.toString() !== user._id.toString()) {
        issueCount++;
        console.log(`❌ User "${user.name}" (${user.email}) references shop "${shop.shopName}"`);
        console.log(`   But shop is owned by: ${shop.owner}`);
        const actualOwner = await User.findById(shop.owner).lean();
        if (actualOwner) {
          console.log(`   Actual owner: ${actualOwner.name} (${actualOwner.email})`);
        }
        console.log('');
      }
    }

    // Issue 3: Shops with owners that don't reference them back
    for (const shop of shops) {
      const owner = await User.findById(shop.owner).lean();
      if (!owner) {
        issueCount++;
        console.log(`❌ Shop "${shop.shopName}" has invalid owner reference: ${shop.owner}`);
        console.log('');
        continue;
      }

      if (!owner.shop || owner.shop.toString() !== shop._id.toString()) {
        issueCount++;
        console.log(`❌ Shop "${shop.shopName}" owned by ${owner.name} (${owner.email})`);
        console.log(`   But user's shop reference is: ${owner.shop || 'null'}`);
        console.log('');
      }
    }

    if (issueCount === 0) {
      console.log('✅ No ownership issues found!');
    } else {
      console.log(`\n⚠️  Total issues found: ${issueCount}`);
    }

    // Summary statistics
    console.log('\n📈 SUMMARY:');
    console.log(`   Total shops: ${shops.length}`);
    console.log(`   Users with shops: ${usersWithShops.length}`);
    console.log(`   Unique shop owners: ${ownershipMap.size}`);

    // Check for the specific user mentioned in the bug report
    const emyUser = await User.findOne({ $or: [{ email: 'emife@gmail.com' }, { name: /emy/i }] }).lean();
    if (emyUser) {
      console.log(`\n🔎 EMY'S SHOP DETAILS:`);
      console.log(`   User: ${emyUser.name} (${emyUser.email})`);
      console.log(`   User ID: ${emyUser._id}`);
      console.log(`   User's shop reference: ${emyUser.shop}`);
      
      const emyShop = await Shop.findOne({ owner: emyUser._id }).lean();
      if (emyShop) {
        console.log(`   Shop: ${emyShop.shopName} (${emyShop.slug})`);
        console.log(`   Shop ID: ${emyShop._id}`);
        
        // Check who else references this shop
        const otherUsers = await User.find({ 
          shop: emyShop._id, 
          _id: { $ne: emyUser._id } 
        }).lean();
        
        if (otherUsers.length > 0) {
          console.log(`   ⚠️  ${otherUsers.length} other users reference this shop:`);
          for (const user of otherUsers) {
            console.log(`      - ${user.name} (${user.email})`);
          }
        }
      }
    }

    console.log('\n✅ Diagnosis complete');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

diagnoseShopOwnership();
