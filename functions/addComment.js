const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Método não permitido" };
  }

  const client = new MongoClient(uri);
  try {
    const data = JSON.parse(event.body);

    const newComment = {
      name: data.name || "Anónimo",
      text: data.text,
      movie_id: new ObjectId(data.movie_id),
      date: new Date()
    };

    await client.connect();
    const db = client.db(dbName);
    const result = await db.collection("comments").insertOne(newComment);

    return {
      statusCode: 200,
      body: JSON.stringify({ insertedId: result.insertedId })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  } finally {
    await client.close();
  }
};
