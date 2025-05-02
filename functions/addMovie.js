const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;
const collectionName = process.env.MONGODB_COLLECTION_NAME;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Método não permitido" };
  }

  const client = new MongoClient(uri);
  try {
    const data = JSON.parse(event.body);

    const newMovie = {
      title: data.title,
      year: parseInt(data.year),
      genres: data.genres?.split(',').map(g => g.trim()),
      cast: data.cast?.split(',').map(c => c.trim()),
      poster: data.poster?.trim() || null,
    };

    await client.connect();
    const db = client.db(dbName);
    const result = await db.collection(collectionName).insertOne(newMovie);

    return {
      statusCode: 200,
      body: JSON.stringify({ insertedId: result.insertedId })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  } finally {
    await client.close();
  }
};
