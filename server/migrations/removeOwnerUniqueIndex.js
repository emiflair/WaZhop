const mongoose = require('mongoose');
require('dotenv').config();

const removeOwnerUniqueIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const { db } = mongoose.connection;
    const collection = db.collection('shops');

    // Get existing indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Drop the owner_1 unique index if it exists
    try {
      await collection.dropIndex('owner_1');
      console.log('✅ Successfully dropped owner_1 unique index');
    } catch (error) {
      if (error.codeName === 'IndexNotFound') {
        console.log('ℹ️  Index owner_1 does not exist');
      } else {
        throw error;
      }
    }

    // Create new non-unique index on owner
    await collection.createIndex({ owner: 1 });
    console.log('✅ Created new non-unique index on owner field');

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

removeOwnerUniqueIndex();
