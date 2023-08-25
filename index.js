const express = require('express');
const app = express();
const cors = require('cors');
const { ObjectId } = require('mongodb'); // Import ObjectId

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
        const blogCollection = client.db('CM').collection('Blog');







        // Route to blog insertion
        app.post('/blog', async (req, res) => {
            try {
                const blog = req.body; // Form data sent from the client

                // Insert the form data into the MongoDB collection 'Categories'
                const categoriesCollection = client.db('CM').collection('Blog');
                await blogCollection.insertOne(blog);

                res.status(201).json({ message: 'blog added successfully' });
            } catch (error) {
                console.error('Error Adding blog:', error);
                res.status(500).json({ message: 'An error occurred', error: error.message });
            }
        });

        // Route to handle form data insertion
        app.post('/addCourse', async (req, res) => {
            try {
                const formData = req.body; // Form data sent from the client

                // Insert the form data into the MongoDB collection 'Categories'
                const categoriesCollection = client.db('CM').collection('Categories');
                await categoriesCollection.insertOne(formData);

                res.status(201).json({ message: 'Form data inserted successfully' });
            } catch (error) {
                console.error('Error inserting form data:', error);
                res.status(500).json({ message: 'An error occurred', error: error.message });
            }
        });

        // Route to blog insertion
        app.post('/blog', async (req, res) => {
            try {
                const blog = req.body; // blog data sent from the client
                console.log(blog)

                // Insert the blog data into the MongoDB collection 'Blog'
                const blogCollection = client.db('CM').collection('Blog');
                await blogCollection.insertOne(blog);

                res.status(201).json({ message: 'blog added successfully' });
            } catch (error) {
                console.error('Error Adding blog:', error);
                res.status(500).json({ message: 'An error occurred', error: error.message });
            }
        });





        // Getting all blog from Db
        app.get('/all-blog', async (req, res) => {
            try {
                const blogs = await blogCollection.find().toArray();
                res.json(blogs);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Error fetching blog', error: error.message });
            }
        });



        // Getting all courses categories from Db
        app.get('/categories', async (req, res) => {
            try {
                const categories = await categoriesCollection.find().toArray();
                res.json(categories);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Error fetching categories', error: error.message });
            }
        });

        
        // Update the approval status of a course
        app.put('/categories/:courseId/approval', async (req, res) => {
            try {
                const courseId = req.params.courseId;
                const { ApprovedStatus } = req.body; // Use ApprovedStatus field

                const result = await categoriesCollection.updateOne(
                    { _id: new ObjectId(courseId) }, // Use new ObjectId() here
                    { $set: { ApprovedStatus } } // Update the ApprovedStatus field
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({ message: 'Course not found' });
                }

                res.json({ message: 'Course approval status updated successfully' });
            } catch (error) {
                console.error('Error updating course approval:', error);
                res.status(500).json({ message: 'An error occurred', error: error.message });
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


        // Add all user into db
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


        // get user based user from db
        app.get('/users/:role', async (req, res) => {
            const role = req.params.role;
            try {
                const users = await usersCollection.find({ role }).toArray();
                res.json(users);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Error fetching users', error: error.message });
            }
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
        console.error(error, process.env.DB_USER);
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('CM Academy is on');
});

app.listen(port, () => {
    console.log(`CM Academy is on port ${port}`);
});




