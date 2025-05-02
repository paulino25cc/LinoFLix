const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); 

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;
const collectionName = process.env.MONGODB_COLLECTION_NAME;

const client = new MongoClient(uri);


app.get("/movies", async (req, res) => {
  const page = parseInt(req.query.page || "1");
  const limit = parseInt(req.query.limit || "25");
  const search = req.query.search || "";

  const query = search
    ? { title: { $regex: search, $options: "i" } }
    : {};

  try {
    await client.connect();
    const db = client.db(dbName);
    const moviesCol = db.collection(collectionName);

    const movies = await moviesCol
      .find(query)
      .project({ title: 1, year: 1, poster: 1 })
      .sort({ year: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const total = await moviesCol.countDocuments(query);

    res.json({ movies, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get("/movies/:id", async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const movie = await db.collection(collectionName).findOne({ _id: new ObjectId(req.params.id) });
    const comments = await db.collection("comments")
      .find({ movie_id: req.params.id })
      .sort({ date: -1 })
      .toArray();

    res.json({ movie, comments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/movies", async (req, res) => {
  const { title, year, genres, cast, poster } = req.body;
  try {
    await client.connect();
    const db = client.db(dbName);
    const result = await db.collection(collectionName).insertOne({
      title,
      year: parseInt(year),
      genres: genres?.split(',').map(g => g.trim()),
      cast: cast?.split(',').map(c => c.trim()),
      poster: poster || '',
    });
    res.json({ insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.put("/movies/:id", async (req, res) => {
  const { title, year, genres, cast, poster } = req.body;
  try {
    await client.connect();
    const db = client.db(dbName);
    const result = await db.collection(collectionName).updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          title,
          year: parseInt(year),
          genres: genres?.split(',').map(g => g.trim()),
          cast: cast?.split(',').map(c => c.trim()),
          poster: poster || '',
        }
      }
    );
    res.json({ modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/comments", async (req, res) => {
  const { name, email, text, movie_id } = req.body;
  try {
    await client.connect();
    const db = client.db(dbName);
    const result = await db.collection("comments").insertOne({
      name,
      email,
      text,
      movie_id,
      date: new Date()
    });
    res.json({ insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.delete("/comments/:id", async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const result = await db.collection("comments").deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ativo em http://localhost:${PORT}`);
});
