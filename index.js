const express = require('express');
const app = express();
const cors = require('cors');
const { ObjectId } = require('mongodb'); // Import ObjectId
const SSLCommerzPayment = require('sslcommerz-lts')



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

        const store_id = process.env.StoreID
        const store_passwd = process.env.StorePassword
        const is_live = false //true for live, false for sandbox

        await client.connect();

        const categoriesCollection = client.db('CM').collection('Categories');

        const usersCollection = client.db('CM').collection('users');

        const blogCollection = client.db('CM').collection('Blog');

        const ordersCollection = client.db('CM').collection('Orders');







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

        console.log(process.env.StoreID)

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



        // getting single course by id
        app.get('/categories/:categoryId', async (req, res) => {
            try {
                const categoryId = req.params.categoryId;

                const category = await categoriesCollection.findOne({
                    _id: new ObjectId(categoryId)
                });

                if (!category) {
                    return res.status(404).json({ message: 'Category not found' });
                }

                res.json(category);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Error fetching category', error: error.message });
            }
        });



        // Update the approval status of a course
        app.put('/categories/:courseId/approval', async (req, res) => {
            try {
                const courseId = req.params.courseId;
                const { ApprovedStatus } = req.body; // Use ApprovedStatus field

                const result = await categoriesCollection.updateOne(
                    { _id: new ObjectId(courseId) }, // Use new ObjectId() heree
                    { $set: { ApprovedStatus } } // Update the AprvStatus field
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




        // app.get('/categories/:categoryId/subCategories/:subCategoryId', async (req, res) => {
        //     try {
        //         const categoryId = req.params.categoryId;
        //         const subCategoryId = req.params.subCategoryId;

        //         const category = await categoriesCollection.findOne({
        //             _id: categoryId
        //         });

        //         if (!category) {
        //             return res.status(404).json({ message: 'Category not found' });
        //         }

        //         const subCategory = category.subCategories.find(subCat => subCat._id === subCategoryId);

        //         if (!subCategory) {
        //             return res.status(404).json({ message: 'SubCategory not found' });
        //         }

        //         res.json(subCategory);
        //     } catch (error) {
        //         console.error(error);
        //         res.status(500).json({ message: 'Error fetching subCategory', error: error.message });
        //     }
        // });




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



        app.get('/users/:role/:id', async (req, res) => {
            try {
                const roleId = req.params.id;

                const user = await usersCollection.findOne({
                    _id: new ObjectId(roleId)
                });

                if (!user) {
                    return res.status(404).json({ message: 'user not found' });
                }

                res.json(user);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Error fetching user', error: error.message });
            }
        });




        // check Instructor ////////////////////
        ///////////////////////////////////
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


        //    Route to handle Payment/order insertion//////////////
        // /////////////////////////////////////////////////
        app.post('/order', async (req, res) => {

            const course = await categoriesCollection.findOne({ _id: new ObjectId(req.body.courseId) });
            const order = req.body;

            console.log(order)

            const tran_id = new ObjectId().toString();

            const data = {
                total_amount: course?.coursePrice || "0",
                currency: 'BDT',
                tran_id: tran_id, // use unique tran_id for each api call
                success_url: `http://localhost:5000/payment/success/${tran_id}`,
                fail_url: `http://localhost:5000/payment/fail/${tran_id}`,
                cancel_url: 'http://localhost:3030/cancel',
                ipn_url: 'http://localhost:3030/ipn',
                shipping_method: 'Courier',
                product_name: course?.title,
                product_category: 'Electronic',
                product_profile: 'general',
                cus_name: 'Customer Name',
                cus_email: course?.instructorEmail,
                cus_add1: 'Dhaka',
                cus_add2: 'Dhaka',
                cus_city: 'Dhaka',
                cus_state: 'Dhaka',
                cus_postcode: '1000',
                cus_country: 'Bangladesh',
                cus_phone: order?.mobile,
                cus_fax: '01711111111',
                ship_name: 'Customer Name',
                ship_add1: 'Dhaka',
                ship_add2: 'Dhaka',
                ship_city: 'Dhaka',
                ship_state: 'Dhaka',
                ship_postcode: 1000,
                ship_country: 'Bangladesh',
                instructor: course?.instructor,
                student_email: order?.studentEmail,
                student_name: order?.studentName,
            };


            // console.log(data);


            const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
            sslcz.init(data).then(apiResponse => {
                // Redirect the user to payment gateway
                let GatewayPageURL = apiResponse.GatewayPageURL
                res.send({ url: GatewayPageURL })

                const finalOrder = {
                    course,
                    paidStatus: false,
                    order,
                    transactionId: tran_id
                };
                const result = ordersCollection.insertOne(finalOrder)

                console.log('Redirecting to: ', GatewayPageURL)
            });



            app.post('/payment/success/:tranId', async (req, res) => {

                const result = await ordersCollection.updateOne({ transactionId: req.params.tranId }, {
                    $set: {
                        paidStatus: true,
                    },
                });

                if (result.modifiedCount > 0) {
                    res.redirect(`http://localhost:5173/payment/success/${req.params.tranId}`)
                }
            });

            app.post('/payment/fail/:tranId', async (req, res) => {
                const result = await ordersCollection.deleteOne({ transactionId: req.params.tranId });

                if (result.deletedCount) {
                    res.redirect(`http://localhost:5173/payment/fail/${req.params.tranId}`)
                };
            })

        })



        // get order from db
        app.get("/orders", async (req, res) => {
            const result = await ordersCollection.find().toArray();
            res.send(result);
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




