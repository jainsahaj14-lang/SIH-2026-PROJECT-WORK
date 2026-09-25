const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServerInstance = null;

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://localhost:27017/cognicare_ner';
  
  try {
    // Attempt local MongoDB connection first with a 3-second timeout
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[CogniCare DB] Connected to local MongoDB at: ${primaryUri}`);
  } catch (err) {
    console.warn(`[CogniCare DB] Local MongoDB unavailable (${err.message}). Starting embedded MongoMemoryServer for standalone demo...`);
    try {
      memoryServerInstance = await MongoMemoryServer.create();
      const memoryUri = memoryServerInstance.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[CogniCare DB] Connected to embedded MongoDB at: ${memoryUri}`);
    } catch (memErr) {
      console.error('[CogniCare DB] Failed to initialize embedded MongoDB:', memErr.message);
      process.exit(1);
    }
  }
};

const closeDB = async () => {
  await mongoose.connection.close();
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
  }
};

module.exports = { connectDB, closeDB };
