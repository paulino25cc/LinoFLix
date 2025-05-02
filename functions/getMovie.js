const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;
const moviesCollection = process.env.MONGODB_COLLECTION_NAME;
const commentsCollection = process.env.MONGODB_COMMENTS_COLLECTION;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);

    const movieId = event.queryStringParameters?.id;
    if (!movieId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Movie ID required" })
      };
    }

    const objectId = new ObjectId(movieId);
    const movie = await db.collection(moviesCollection).findOne({ _id: objectId });

    if (!movie) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Movie not found" })
      };
    }

    const comments = await db.collection(commentsCollection)
      .find({ movie_id: objectId })
      .sort({ date: -1 })
      .limit(10)
      .toArray();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ movie, comments })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  } finally {
    await client.close();
  }
};
