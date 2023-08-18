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
        const usersCollection = client.db('CM').collection('users');

        app.get('/categories', async (req, res) => {
            try {
                const categories = await categoriesCollection.find().toArray();
                res.json(categories);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Error fetching categories', error: error.message });
            }
        });

        app.get('/categories/:categoryId/subCategories/:subCategoryId', async (req, res) => {
            try {
                const categoryId = req.params.categoryId;
                const subCategoryId = req.params.subCategoryId;

                const category = await categoriesCollection.findOne({
                    _id: categoryId
                });

                if (!category) {
                    return res.status(404).json({ message: 'Category not found' });
                }

                const subCategory = category.subCategories.find(subCat => subCat._id === subCategoryId);

                if (!subCategory) {
                    return res.status(404).json({ message: 'SubCategory not found' });
                }

                res.json(subCategory);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Error fetching subCategory', error: error.message });
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



        app.post('/users', async (req, res) => {
            const user = req.body;

            const query = { email: user.email };
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists' });
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });


        // check Instructor 
        app.get('/users/instructor/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email)
            const query = { email: email };
            const user = await usersCollection.findOne(query);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const result = { instructor: user?.role === 'instructor' };
            res.json(result);
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




