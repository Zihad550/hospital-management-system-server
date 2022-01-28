const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const fileUpload = require("express-fileupload");

const port = process.env.PORT || 8000;

// middle ware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bhmov.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("hospital_management");
    const usersCollection = database.collection("users");
    const patientsCollection = database.collection("patients");

    // add doctors, staffs
    app.post("/users", async (req, res) => {
      const pic = req.files.image;
      if (pic.size > 200000) {
        res.json({ error: "Please select a file less then 200kb" });
      } else {
        const picData = pic.data;
        const encodedPic = picData.toString("base64");
        const imageBuffer = Buffer.from(encodedPic, "base64");
        const user = {
          ...req.body,
          image: imageBuffer,
        };
        const result = await usersCollection.insertOne(user);
        res.json(result);
      }
    });

    // get user based on their role and id
    app.get("/users", async (req, res) => {
      const { id, role } = req.query;
      console.log(id, role);
      const result = await usersCollection
        .find({ $and: [{ personId: id }, { role }] })
        .toArray();
      res.json(result);
    });

    // add patient
    app.post("/patients", async (req, res) => {
      const pic = req.files.image;
      const find = await patientsCollection.findOne({
        personId: req.body.personId,
      });
      if (find) {
        res.json({
          error: "Person exists with the id. Please give a new id",
        });
      } else {
        if (pic.size > 200000) {
          res.json({ error: "Please select a file less then 200kb" });
        } else {
          const picData = pic.data;
          const encodedPic = picData.toString("base64");
          const imageBuffer = Buffer.from(encodedPic, "base64");
          const user = {
            ...req.body,
            image: imageBuffer,
          };
          const result = await patientsCollection.insertOne(user);
          res.json(result);
        }
      }
    });

    //get patients
    app.get("/patients", async (req, res) => {
      const result = await patientsCollection.find({}).toArray();
      res.json(result);
    });

    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to hospital management system server!");
});

app.listen(port, () => {
  console.log(`listening at ${port}`);
});
