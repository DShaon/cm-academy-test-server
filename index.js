const express = require('express');
const app = express();
const cors = require('cors');
const { ObjectId } = require('mongodb'); // Import ObjectId
const SSLCommerzPayment = require('sslcommerz-lts')

const nodemailer = require("nodemailer");
const PDFDocument = require('pdfkit');
const fs = require('fs');

require('dotenv').config();

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// //////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////
// / send grid emails 


const paymentConfirmEmail = (order) => {
    const studentEmail = order.order.studentEmail;
    const date = order.order.date;
    const orderId = order.transactionId;
    const studentName = order.order.studentName;

    const instructorName = order.course.instructor;
    const instructorEmail = order.course.instructorEmail;
    const courseTitle = order.course.title;
    const totalPrice = order.course.coursePrice;


    const pdfDoc = new PDFDocument();

    // Pipe the PDF content to a writable stream
    const pdfStream = fs.createWriteStream('invoice.pdf');
    pdfDoc.pipe(pdfStream);

    // Function to add a heading with styles
    function addHeading(text, fontSize, color, align, margin) {
        pdfDoc.font('Helvetica-Bold')
            .fontSize(fontSize)
            .fillColor(color)
            .text(text, { align: align, continued: false })
            .moveDown(margin);
    }

    // Function to add a paragraph with styles
    function addParagraph(text, fontSize, color, align, margin) {
        pdfDoc.font('Helvetica')
            .fontSize(fontSize)
            .fillColor(color)
            .text(text, { align: align, continued: false })
            .moveDown(margin);
    }

    // Header
    pdfDoc.rect(0, 0, 610, 130)
        .fill('#e1e1e1');

    pdfDoc.image('./logo.png', 60, 30, { width: 80, height: 80 });
    addHeading('Invoice from CM Academy', 24, '#0EADF0', 'center', 2);



    // Order Details
    pdfDoc.rect(20, 130, 560, 300)
        .fill('#ffffff');

    addHeading(`Course: ${courseTitle}`, 18, '#5b5b5b', 'left', 1);

    addParagraph(`Order ID: ${orderId}`, 14, '#5b5b5b', 'left', 0.5);
    addParagraph(`Student Name: ${studentName}`, 14, '#5b5b5b', 'left', 0.5);
    addParagraph(`Student Email: ${studentEmail}`, 14, '#5b5b5b', 'left', 0.5);
    addParagraph(`Date: ${date}`, 14, '#5b5b5b', 'left', 0.5);
    addParagraph(`Total Price: ${totalPrice} BDT`, 14, '#5b5b5b', 'left', 0.5);


    pdfDoc.rect(20, 320, 560, 100)
        .fill('#f7f7f7');

    addHeading('Instructor Details', 16, '#5b5b5b', 'left', 0.5);

    addParagraph(`Instructor Email: ${instructorEmail}`, 14, '#5b5b5b', 'left', 0.5);
    addParagraph(`Instructor Name: ${instructorName}`, 14, '#5b5b5b', 'left', 0.5);

    // End the PDF document
    pdfDoc.end();

    // Send email with PDF attachment
    const transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
        }
    });

    const adminEmail = "code.mates.team@gmail.com";
    const recipients = [instructorEmail, studentEmail, adminEmail];

    transporter.sendMail({
        from: 'tayebhossain018@gmail.com',
        to: recipients.join(', '),
        subject: 'Your Invoice from CM Academy',
        text: 'Thank you for enrolling in the course.',
        attachments: [
            {
                filename: 'invoice.pdf',
                content: fs.createReadStream('invoice.pdf')
            }
        ]
    }, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

    // Remove the temporary PDF file
    pdfStream.on('finish', () => {
        fs.unlink('invoice.pdf', (err) => {
            if (err) {
                console.error('Error deleting temporary PDF file:', err);
            }
        });
    });
};


///////////////////////////////////////////////
/////////////////////////////////////



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

        //////////////////////////////////////////////////////////
        //////////////All Mongodb Collections start here//////////
        /////////////////////////////////////////////////////////
        const categoriesCollection = client.db('CM').collection('Categories');
        const usersCollection = client.db('CM').collection('users');
        const blogCollection = client.db('CM').collection('Blog');
        const ordersCollection = client.db('CM').collection('Orders');
        const bankAccountsCollection = client.db('CM').collection('bankAccounts');
        const withdrawRequestsCollection = client.db('CM').collection('withdrawRequests');
        const CategoriesNameCollection = client.db('CM').collection('CategoriesName');





        ////////// Route to blog insertion
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

        // get all course by category name "courseCategory" with error handling
        app.get('/categories/:courseCategory', async (req, res) => {
            try {
                const courseCategory = req.params.courseCategory;
                const categories = await categoriesCollection.find({ courseCategory }).toArray();
                res.json(categories);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Error fetching categories', error: error.message });
            }
        });


        // get all course by instructor email with error handling 
        app.get('/categories/instructor/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const categories = await categoriesCollection.find({ instructorEmail: email }).toArray();
                res.json(categories);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Error fetching categories', error: error.message });
            }
        });

        // get all course which ApprovedStatus is "Approved" from db
        app.get('/categories/approved', async (req, res) => {
            try {
                const categories = await categoriesCollection.find({ ApprovedStatus: "Approved" }).toArray();
                res.json(categories);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Error fetching categories', error: error.message });
            }
        });

        // getting single course by object id from db
        app.get('/categories/:courseId', async (req, res) => {
            try {
                const courseId = req.params.courseId;
                const course = await categoriesCollection.findOne({
                    _id: new ObjectId(courseId)
                });

                if (!course) {
                    return res.status(404).json({ message: 'Course not found' });
                }

                res.json(course);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Error fetching course', error: error.message });
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



        // Delete a course by id from db 

        app.delete('/categories/:courseId', async (req, res) => {
            try {
                const courseId = req.params.courseId;

                const result = await categoriesCollection.deleteOne({
                    _id: new ObjectId(courseId)
                });

                if (result.deletedCount === 0) {
                    return res.status(404).json({ message: 'Course not found' });
                }

                res.json({ message: 'Course deleted successfully' });
            } catch (error) {
                console.error('Error deleting course:', error);
                res.status(500).json({ message: 'An error occurred', error: error.message });
            }
        });


        // get all categories name from db
        app.get('/categoriesName', async (req, res) => {
            try {
                const categoriesName = await CategoriesNameCollection.find().toArray();
                res.json(categoriesName);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'Error fetching categories', error: error.message });
            }
        });
        // add new categories
        app.post('/categoriesName', async (req, res) => {
            try {
                const categoriesName = req.body;
                const result = await CategoriesNameCollection.insertOne(categoriesName);
                res.send(result);
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




        // Add all user into db
        app.post('/users', async (req, res) => {
            const user = req.body;

            console.log(user)

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


        // ///////////////////verify admin, instructor, student end point////// start/////////////////

        // Check if a user is a Instructor based on email
        app.get('/users/instructor/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const query = { email: email };
            const user = await usersCollection.findOne(query);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const result = { instructor: user?.role === 'instructor' };
            res.json(result);
        });


        // Check if a user is a student based on email
        app.get('/users/student/:email', async (req, res) => {
            const email = req.params.email;

            const query = { email: email };
            const user = await usersCollection.findOne(query);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const result = { student: user?.role === 'student' };
            res.json(result);
        });


        // Check if a user is an admin based on email
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;

            const query = { email: email };
            const user = await usersCollection.findOne(query);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const result = { admin: user?.role === 'admin' };
            res.json(result);
        });


        ///////////////////verify admin, instructor, student end point///////// End/////////////////


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
                success_url: `https://cm-academy-test-server-production.up.railway.app/payment/success/${tran_id}`,
                fail_url: `https://cm-academy-test-server-production.up.railway.app/payment/fail/${tran_id}`,
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



            // app.post('/payment/success/:tranId', async (req, res) => {

            //     const result = await ordersCollection.updateOne({ transactionId: req.params.tranId }, {
            //         $set: {
            //             paidStatus: true,
            //         },
            //     });

            //     if (result.modifiedCount > 0) {
            //         res.redirect(`https://cm-academy.netlify.app/payment/success/${req.params.tranId}`)
            //     }
            // });


            app.post('/payment/success/:tranId', async (req, res) => {

                const { tranId } = req.params;

                const order = await ordersCollection.findOne({ transactionId: tranId });

                paymentConfirmEmail(order);

                const result = await ordersCollection.updateOne({ transactionId: req.params.tranId }, {
                    $set: {
                        paidStatus: true,
                    },
                });

                if (result.modifiedCount > 0) {
                    res.redirect(`http://cm-academy.netlify.app/payment/success/${req.params.tranId}`)
                }
            });





            app.post('/payment/fail/:tranId', async (req, res) => {
                const result = await ordersCollection.deleteOne({ transactionId: req.params.tranId });

                if (result.deletedCount) {
                    res.redirect(`http://cm-academy.netlify.app/fail/${req.params.tranId}`)
                };
                // if (result.deletedCount) {
                //     res.redirect(`http://localhost:5173/payment/fail/${req.params.tranId}`)
                // };
            })

        })




        // get order from db
        app.get("/orders", async (req, res) => {
            const result = await ordersCollection.find().toArray();
            res.send(result);
        });

        // get all studentEmail from Orders collection whoes paidStatus is true and it will all enrolled student email//
        //////////////////////////////////////////////////  
        app.get('/orders/EnrolledEmail', async (req, res) => {
            try {
                const result = await ordersCollection.find({ "paidStatus": true }).toArray();
                console.log("Result:", result); // Log the result
                const studentEmails = result.map(order => order.order.studentEmail);
                console.log("Student Emails:", studentEmails); // Log the extracted student emails
                res.send(studentEmails);
            } catch (error) {
                console.error("Error fetching enrolled student emails:", error);
                res.status(500).send("Internal Server Error");
            }
        });



        // get order from db with student email
        app.get("/orders/:email", async (req, res) => {
            const email = req.params.email;
            const result = await ordersCollection.find({ "order.studentEmail": email }).toArray();
            res.send(result);
        });

        // get order from db with student email then course id
        app.get("/orders/:email/:courseId", async (req, res) => {
            try {
                const email = req.params.email;
                const courseId = new ObjectId(req.params.courseId); // Use 'new' to create ObjectId instance
                const result = await ordersCollection.find({ "order.studentEmail": email, "course._id": courseId }).toArray();
                res.send(result);
            } catch (error) {
                console.error("Error fetching orders:", error);
                res.status(500).send("Internal Server Error");
            }
        });





        // Create a route for storing bank account setup information
        app.post('/bank-account-setup', async (req, res) => {
            try {
                const {
                    InstructorEmail,
                    email,
                    accountHolderName,
                    accountNo,
                    routingNumber,
                    bankName,
                    bankBranchName,
                    phoneNumber,
                } = req.body;

                // Assuming i have a "bankAccounts" collection in MongoDB
                const bankAccount = {
                    InstructorEmail,
                    email,
                    accountHolderName,
                    accountNo,
                    routingNumber,
                    bankName,
                    bankBranchName,
                    phoneNumber,
                };

                // Insert the bank account data into the MongoDB collection
                const result = await bankAccountsCollection.insertOne(bankAccount);

                res.status(201).json({ message: 'Bank account setup data added successfully' });
            } catch (error) {
                console.error('Error adding bank account setup data:', error);
                res.status(500).json({ message: 'An error occurred', error: error.message });
            }
        });

        // get bank account setup information from db by instructor email
        app.get('/bank-account-setup/:email', async (req, res) => {
            const email = req.params.email;
            const result = await bankAccountsCollection.find({ "InstructorEmail": email }).toArray();
            res.send(result);
        });


        // store withdraw re to db
        app.post('/storeWData', async (req, res) => {
            try {
                const { totalAmount, email, withdrawStatus, name } = req.body;

                await withdrawRequestsCollection.insertOne({
                    name,
                    totalAmount,
                    email,
                    withdrawStatus,
                });

                res.status(200).json({ message: 'Withdrawal request saved successfully' });
            } catch (error) {
                console.error('Error saving withdrawal request:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });


        // get withdraw request data from db
        app.get('/getWithdrawRequests', async (req, res) => {
            const result = await withdrawRequestsCollection.find().toArray();
            res.send(result);
        });



        // get withdraw request data from db by email
        app.get('/getWithdrawRequests/:email', async (req, res) => {
            const email = req.params.email;
            const result = await withdrawRequestsCollection.find({ email }).toArray();
            res.send(result);
        });















        ////////////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////////////////
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




