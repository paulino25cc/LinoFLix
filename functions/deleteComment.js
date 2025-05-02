const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;

exports.handler = async (event) => {
  if (event.httpMethod !== "DELETE") {
    return { statusCode: 405, body: "Método não permitido" };
  }

  const client = new MongoClient(uri);
  try {
    const { id } = JSON.parse(event.body);

    await client.connect();
    const db = client.db(dbName);
    const result = await db.collection("comments").deleteOne({ _id: new ObjectId(id) });

    return {
      statusCode: 200,
      body: JSON.stringify({ deletedCount: result.deletedCount })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  } finally {
    await client.close();
  }
};
