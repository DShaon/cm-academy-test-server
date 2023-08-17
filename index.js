const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lnbzdtk.mongodb.net/?retryWrites=true&w=majority`;

async function run() {
    try {
        const client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });

        await client.connect();

        const categoriesCollection = client.db('CM').collection('Categories');

        app.get('/categories', async (req, res) => {
            try {
                const categories = await categoriesCollection.find().toArray();
                res.json(categories);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Error fetching categories', error: error.message });
            }
        });



        app.get('/search', async (req, res) => {
            try {
                const searchTerm = req.query.q;
                const regex = new RegExp(searchTerm, 'i');

                const categories = await categoriesCollection
                    .find({
                        $or: [
                            { 'subCategories.title': regex },
                            { 'subCategories.instructor': regex },
                        ],
                    })
                    .toArray();

                res.json(categories);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Error searching for courses', error: error.message });
            }
        });








        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
        console.error(error);
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('CM Academy is on');
});

app.listen(port, () => {
    console.log(`CM Academy is on port ${port}`);
});
