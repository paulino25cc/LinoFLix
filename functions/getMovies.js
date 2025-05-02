const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;
const collection = process.env.MONGODB_COLLECTION_NAME;

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=60"
};

exports.handler = async (event) => {
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const db = client.db(dbName);

    const search = event.queryStringParameters?.search || "";
    const page = parseInt(event.queryStringParameters?.page || "1");
    const limit = parseInt(event.queryStringParameters?.limit || "25");
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { cast: { $regex: search, $options: "i" } },
          { directors: { $regex: search, $options: "i" } },
          { genres: { $regex: search, $options: "i" } }
        ]
      };
    }

    const movies = await db.collection(collection)
      .find(query)
      .project({ title: 1, year: 1, poster: 1, imdb: 1 })
      .sort({ year: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection(collection).countDocuments(query);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ movies, total })
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
