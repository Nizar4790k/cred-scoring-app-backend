
const { MongoClient } = require('mongodb');

async function testDatabase() {
    
    const client = await new MongoClient(process.env.MONGODB_SERVER);

    try {
        const dbName = process.env.DATABASE_NAME;
        await client.connect();
        console.log('Connected successfully to the database');
        const db = client.db(dbName);

    } catch (err) {
        console.log(err);
    } finally {
        client.close();
    }





}

module.exports = {
    testDatabase:testDatabase
    
  };