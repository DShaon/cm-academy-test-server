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
        const RatingAndFeedbackCollection = client.db('CM').collection('RatingAndFeedback');
        const chatCollection = client.db('CM').collection('Chat');
        const supportTicketCollection = client.db('CM').collection('SupportTicket');
        const InstructorPaymentCollection = client.db('CM').collection('Payment');
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
                const { category, price, rating, popularity, bestSelling } = req.query;

                // Define a filter object based on query parameters
                const filter = {};

                if (category) {
                    filter.courseCategory = category;
                }

                if (price) {
                    filter.coursePrice = { $lte: parseInt(price) };
                }

                if (rating) {
                    filter.rating = { $gte: parseFloat(rating) };
                }

                // Add more filters for popularity and bestSelling as needed

                const categories = await categoriesCollection.find(filter).toArray();
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

        // get all approved or deny course by instructor email with error handling
        app.get('/categories/instructor/:email/:type', async (req, res) => {
            try {
                const email = req.params.email;
                const type = req.params.type;
                const categories = await categoriesCollection.find({ instructorEmail: email, ApprovedStatus: type }).toArray();
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


        // get all course by dyanmic "approved" or "deny" status from db
        app.get('/categories/status/:type', async (req, res) => {
            try {
                const type = req.params.type;
                const categories = await categoriesCollection.find({ ApprovedStatus: type }).toArray();
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


        // getting single course by object id from db
        app.get('/categories/byId/:courseId', async (req, res) => {
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

        // get all user from db
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
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

        // get all user by email from db
        app.get('/users/check/:email', async (req, res) => {
            const email = req.params.email;
            const result = await usersCollection.findOne({ email });
            res.send(result);
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



        // Update a student's information by email
        app.put("/users/student/:email", async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const { fullName, phone, userImage } = req.body;

            console.log(fullName, phone);

            try {
                // Find the student by email
                const student = await usersCollection.findOne({ email });

                if (!student) {
                    return res.status(404).json({ message: "Student not found" });
                }

                // Update the student's information
                await usersCollection.updateOne({ email }, { $set: { fullName, contactNumber: phone, userImage } });

                // Fetch the updated student data
                const updatedStudent = await usersCollection.findOne({ email });

                res.status(200).json(updatedStudent);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: "Internal server error" });
            }
        });




        // Update an instructor's information by email
        app.put("/users/instructor/:email", async (req, res) => {
            const email = req.params.email;
            const {
                fullName,
                contactNumber,
                userImage,
                aboutMe,
                designation, // Add designation field
                location, // Add location field
                facebookLink, // Add Facebook field
                linkedinLink, // Add LinkedIn field
                githubLink, // Add GitHub field
            } = req.body;

            try {
                // Find the instructor by email
                const instructor = await usersCollection.findOne({ email });

                if (!instructor) {
                    return res.status(404).json({ message: "Instructor not found" });
                }

                // Update the instructor's information, including the new fields
                await usersCollection.updateOne(
                    { email },
                    {
                        $set: {
                            fullName,
                            contactNumber,
                            userImage,
                            aboutMe,
                            designation, // Update with the new fields
                            location, // Update with the new fields
                            facebookLink, // Update with the new fields
                            linkedinLink, // Update with the new fields
                            githubLink, // Update with the new fields
                        },
                    }
                );

                // Fetch the updated instructor data
                const updatedInstructor = await usersCollection.findOne({ email });

                res.status(200).json(updatedInstructor);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: "Internal server error" });
            }
        });



        // get instructor information by email from db 

        app.get('/users/instructor/:email/info', async (req, res) => {
            const email = req.params.email;

            const query = { email: email };

            const instructor = await usersCollection.findOne(query);

            if (!instructor) {
                return res.status(404).json({ message: 'Instructor not found' });
            }

            res.json(instructor);
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


            // Route to handle successful payment
            app.post('/payment/success/:tranId', async (req, res) => {
                try {
                    const { tranId } = req.params;

                    // Fetch the order details
                    const order = await ordersCollection.findOne({ transactionId: tranId });

                    if (!order) {
                        return res.status(404).json({ message: 'Order not found' });
                    }

                    // Increment the enrollCount for the purchased course
                    const courseId = order.course._id.toString(); // Convert the course ID to a string

                    // Fetch the course details from the categoriesCollection
                    const course = await categoriesCollection.findOne({
                        _id: new ObjectId(courseId)
                    });

                    if (!course) {
                        return res.status(404).json({ message: 'Course not found' });
                    }

                    // Increment the enrollCount
                    const updatedEnrollCount = course.enrollCount + 1;

                    // Update the enrollCount in the categoriesCollection
                    const updateResult = await categoriesCollection.updateOne(
                        { _id: new ObjectId(courseId) },
                        { $set: { enrollCount: updatedEnrollCount } }
                    );

                    if (updateResult.modifiedCount > 0) {
                        // Enrollment count updated successfully
                        // Send confirmation email
                        paymentConfirmEmail(order);

                        // Update the paidStatus
                        const updatePaidStatusResult = await ordersCollection.updateOne(
                            { transactionId: tranId },
                            { $set: { paidStatus: true } }
                        );

                        if (updatePaidStatusResult.modifiedCount > 0) {
                            // Paid status updated successfully
                            res.redirect(`http://cm-academy.netlify.app/payment/success/${tranId}`);
                        } else {
                            // Handle the case where the paidStatus update failed
                            res.status(500).json({ message: 'Failed to update paidStatus' });
                        }
                    } else {
                        // Handle the case where the enrollCount update failed
                        res.status(500).json({ message: 'Failed to update enrollment count' });
                    }
                } catch (error) {
                    console.error('Error handling successful payment:', error);
                    res.status(500).json({ message: 'Internal server error' });
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


        // get all studentEmail with  studentName, date, courseId from Orders collection whose paidStatus is true and it will all enrolled student email and also insure that no duplicate email will be send to the client , also it will send how many course a student enrolled 
        app.get("/orders/studentEmail", async (req, res) => {
            const result = await ordersCollection.aggregate([
                {
                    $match: { "paidStatus": true }
                },
                {
                    $group: {
                        _id: "$order.courseId",
                        totalEnrolledCourse: { $sum: 1 },
                        studentName: { $first: "$order.studentName" },

                        mobile: { $first: "$order.mobile" },
                        email: { $first: "$order.studentEmail" }



                    }
                }
            ]).toArray();
            res.send(result);
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

        // check and update sessions completed status , if session status is false then make it true and increase totalCompletedSessions by 1
        app.put("/orders/:email/:courseId/:sessionTitle", async (req, res) => {
            try {
                const email = req.params.email;
                const courseId = new ObjectId(req.params.courseId);
                const sessionTitle = req.params.sessionTitle;

                // Find the order that matches the criteria
                const order = await ordersCollection.findOne({
                    "order.studentEmail": email, // Removed "order"
                    "course._id": courseId, // Removed "order"
                    "course.courseOutline": {
                        $elemMatch: {
                            "sessions": {
                                $elemMatch: {
                                    "sessionTitle": sessionTitle
                                }
                            }
                        }
                    }
                });
                // console.log(order)
                // Check if the order exists
                if (!order) {
                    return res.status(404).send("Order or session not found");
                }

                // Check if the course and courseOutline exist
                const course = order.course;

                // console.log(course.courseOutline)
                if (!course || !course.courseOutline) {
                    return res.status(404).send("Course or course outline not found");
                }

                // Find the session within the courseOutline
                let milestoneIndex = -1;
                let sessionIndex = -1;

                course.courseOutline.forEach((milestone, mIndex) => {
                    const sIndex = milestone.sessions.findIndex(
                        (session) => session.sessionTitle === sessionTitle
                    );

                    console.log(sIndex)
                    if (sIndex !== -1) {
                        milestoneIndex = mIndex;
                        sessionIndex = sIndex;
                    }
                });

                // Check if the session exists
                if (milestoneIndex === -1 || sessionIndex === -1) {
                    return res.status(404).send("Session not found");
                }

                // Find the session within the milestone's sessions array
                const session = course.courseOutline[milestoneIndex].sessions[sessionIndex];

                console.log(session.completed)
                // Check if the session is not completed (status is false)
                if (!session.completed) {
                    // Update the session status to true
                    session.completed = true;

                    // Increment the totalCompletedSessions by 1
                    order.totalCompletedSessions += 1;

                    console.log(order.totalCompletedSessions)
                    // Update the order in the database
                    const result = await ordersCollection.updateOne(
                        {
                            "order.studentEmail": email, // Removed "order"
                            "course._id": courseId, // Removed "order"
                        },


                        {
                            $set: {
                                "course": course, // Update the entire course object
                                totalCompletedSessions: order.totalCompletedSessions,

                            },


                        }
                    );

                    res.send(result);
                } else {
                    // Session is already completed
                    res.status(400).send("Session is already completed");
                }
            } catch (error) {
                console.error("Error updating session status:", error);
                res.status(500).send("Internal Server Error");
            }
        });





        // app.post('/api/storeQuizScore', async (req, res) => {
        //     try {
        //         const { milestoneName, score, courseId, studentEmail } = req.body;

        //         console.log('Received POST request to store quiz score:', req.body);

        //         // Find the order that matches the criteria
        //         const order = await ordersCollection.findOne({
        //             "order.studentEmail": studentEmail,
        //             "course._id": new ObjectId(courseId),
        //         });

        //         // Check if the order exists
        //         if (!order) {
        //             console.log('Order not found for studentEmail:', studentEmail, 'and courseId:', courseId);
        //             return res.status(404).send('Order not found');
        //         }

        //         console.log('Found order:', order);

        //         // Check if the course and course outline exist within the order
        //         const course = order.course;
        //         if (!course || !course.courseOutline) {
        //             console.log('Course or course outline not found in order:', order);
        //             return res.status(404).send('Course or course outline not found');
        //         }

        //         console.log('Found course:', course);

        //         // Find the milestone within the courseOutline
        //         const milestone = course.courseOutline.find(
        //             (ms) => ms.milestoneName === milestoneName
        //         );

        //         if (!milestone) {
        //             console.log('Milestone not found:', milestoneName);
        //             return res.status(404).send('Milestone not found');
        //         }

        //         console.log('Found milestone:', milestone);

        //         // Calculate the score percentage
        //         const scorePercentage = parseFloat(score);

        //         // Update the milestone's score field with the user's score as a percentage
        //         milestone.score = scorePercentage;

        //         // Update the order in the database to save the modified course
        //         const result = await ordersCollection.updateOne(
        //             {
        //                 "order.studentEmail": studentEmail,
        //                 "course._id": new ObjectId(courseId),
        //             },
        //             {
        //                 $set: {
        //                     'course': course, // Update the entire course object
        //                 },
        //             }
        //         );

        //         console.log('Updated order with new course:', course);

        //         res.status(200).send('Quiz score stored successfully.');
        //     } catch (error) {
        //         console.error('Error storing quiz score:', error);
        //         res.status(500).send('Internal Server Error');
        //     }
        // });



        app.post('/api/storeQuizScore', async (req, res) => {
            try {
                const { milestoneName, score, courseId, studentEmail } = req.body;

                console.log('Received POST request to store quiz score:', req.body);

                // Find the order that matches the criteria
                const order = await ordersCollection.findOne({
                    "order.studentEmail": studentEmail,
                    "course._id": new ObjectId(courseId),
                });

                // Check if the order exists
                if (!order) {
                    console.log('Order not found for studentEmail:', studentEmail, 'and courseId:', courseId);
                    return res.status(404).send('Order not found');
                }

                console.log('Found order:', order);

                // Check if the course and course outline exist within the order
                const course = order.course;
                if (!course || !course.courseOutline) {
                    console.log('Course or course outline not found in order:', order);
                    return res.status(404).send('Course or course outline not found');
                }

                console.log('Found course:', course);

                // Find the milestone within the courseOutline
                const milestone = course.courseOutline.find(
                    (ms) => ms.milestone == milestoneName
                );

                console.log("vokaaavokaaaa", milestone)
                if (!milestone) {
                    console.log('Milestone not found:', milestoneName);
                    return res.status(404).send('Milestone not found');
                }

                console.log('Found milestone:', milestone);

                // Add the new field quizScore to the milestone
                milestone.quizScore = score;

                // Update the order in the database to save the modified course
                const result = await ordersCollection.updateOne(
                    {
                        "order.studentEmail": studentEmail,
                        "course._id": new ObjectId(courseId),
                    },
                    {
                        $set: {
                            'course': course, // Update the entire course object
                        },
                    }
                );

                console.log('Updated order with new course:', course);

                res.status(200).send('Quiz score stored successfully.');
            } catch (error) {
                console.error('Error storing quiz score:', error);
                res.status(500).send('Internal Server Error');
            }
        });


        app.get('/api/getQuizResult', async (req, res) => {
            try {
                const { milestoneName, courseId, studentEmail } = req.query;

                // Find the order that matches the criteria
                const order = await ordersCollection.findOne({
                    "order.studentEmail": studentEmail,
                    "course._id": new ObjectId(courseId),
                });

                // Check if the order exists
                if (!order) {
                    return res.status(404).send('Order not found');
                }

                // Check if the course and course outline exist within the order
                const course = order.course;
                if (!course || !course.courseOutline) {
                    return res.status(404).send('Course or course outline not found');
                }

                // Find the milestone within the courseOutline
                const milestone = course.courseOutline.find(
                    (ms) => ms.milestone === milestoneName
                );

                if (!milestone) {
                    return res.status(404).send('Milestone not found');
                }

                // Check if the milestone has a quiz score
                if (milestone.quizScore === undefined) {
                    return res.status(404).send('Quiz score not found for the milestone');
                }

                // Return the quiz score for the milestone
                res.status(200).json({ milestoneName, quizScore: milestone.quizScore });
            } catch (error) {
                console.error('Error getting quiz result:', error);
                res.status(500).send('Internal Server Error');
            }
        });


        // get quiz score by email and course id and milestone name with route 

        app.get('/api/getQuizResult/:email/:courseId/:milestoneName', async (req, res) => {
            try {

                const email = req.params.email;
                const courseId = new ObjectId(req.params.courseId);
                const milestoneName = req.params.milestoneName;

                // Find the order that matches the criteria
                const order = await ordersCollection.findOne({
                    "order.studentEmail": email,
                    "course._id": courseId,
                });

                // Check if the order exists 
                if (!order) {
                    return res.status(404).send('Order not found');
                }

                // Check if the course and course outline exist within the order
                const course = order.course;
                if (!course || !course.courseOutline) {
                    return res.status(404).send('Course or course outline not found');
                }

                // Find the milestone within the courseOutline
                const milestone = course.courseOutline.find(
                    (ms) => ms.milestone === milestoneName
                );

                if (!milestone) {
                    return res.status(404).send('Milestone not found');
                }

                // Check if the milestone has a quiz score
                if (milestone.quizScore === undefined) {
                    return res.status(404).send('Quiz score not found for the milestone');
                }

                // Return the quiz score for the milestone
                res.status(200).json({ milestoneName, quizScore: milestone.quizScore });
            } catch (error) {
                console.error('Error getting quiz result:', error);
                res.status(500).send('Internal Server Error');
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
                const { totalAmount, email, withdrawStatus, name, timestamp } = req.body;

                await withdrawRequestsCollection.insertOne({
                    name,
                    totalAmount,
                    email,
                    withdrawStatus,
                    timestamp
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

        // update withdrawStatus true or false by id 

        app.post('/updateWithdrawStatus/:id', async (req, res) => {
            try {

                const id = req.params.id;
                const withdrawStatus = req.body.withdrawStatus;

                const result = await withdrawRequestsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { withdrawStatus: withdrawStatus } }
                );

                res.send(result);
            } catch (error) {
                console.error('Error updating withdraw status:', error);
                res.status(500).send('Internal Server Error');
            }
        });

        // update withdrawStatus true or false by email

        // app.post('/updateWithdrawStatus/:email', async (req, res) => {
        //     try {

        //         const email = req.params.email;
        //         const withdrawStatus = req.body.withdrawStatus;

        //         const result = await withdrawRequestsCollection.updateOne(
        //             { email: email },
        //             { $set: { withdrawStatus: withdrawStatus } }
        //         );
                    
        //         res.send(result);
        //     } catch (error) {

        //         console.error('Error updating withdraw status:', error);
        //         res.status(500).send('Internal Server Error');
        //     }
        // });



        // store rating and feedback to db 
        app.post('/ratingAndFeedback', async (req, res) => {
            try {
                const { courseTitle, courseInstructor, courseId, studentEmail, studentName, rating, feedback, studentImage, courseCategory } = req.body;

                await RatingAndFeedbackCollection.insertOne({
                    courseTitle,
                    courseInstructor,
                    courseId,
                    studentEmail,
                    studentName,
                    rating,
                    feedback,
                    studentImage,
                    courseCategory
                });

                res.status(200).json({ message: 'Rating and feedback saved successfully' });
            } catch (error) {
                console.error('Error saving rating and feedback:', error);
                res.status(500).json({ message: 'Internal server error' });
            }
        });



        // get rating and feedback from db
        app.get('/ratingAndFeedback', async (req, res) => {
            const result = await RatingAndFeedbackCollection.find().toArray();
            res.send(result);
        });


        // get rating and feedback from db by student email and course id

        app.get('/ratingAndFeedback/:email/:courseId', async (req, res) => {
            try {
                const email = req.params.email;
                const courseId = req.params.courseId; // courseId as a string from the URL

                console.log(email, courseId);

                const RatingAndFeedbackCollection = client.db('CM').collection('RatingAndFeedback');

                const ratingsAndFeedbacks = await RatingAndFeedbackCollection.find({
                    studentEmail: email,
                    courseId: courseId, // Use the courseId as a string
                }).toArray();

                res.send(ratingsAndFeedbacks);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        });





        // Check if a student has already enrolled in a course and return the course id

        app.get('/orders/:email/:courseId', async (req, res) => {
            try {
                const email = req.params.email;
                const courseId = req.params.courseId; // courseId as a string from the URL

                console.log(email, courseId);

                const orders = await ordersCollection.find({
                    "order.studentEmail": email,
                    "course._id": courseId, // Use the courseId as a string
                }).toArray();

                res.send(orders);
            } catch (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
            }
        });



        // Route to handle inserting chat messages
        const { ObjectId } = require('mongodb');

        // ... other imports and app setup ...

        // Define a route for handling POST requests to send messages
        app.post('/api/messages', async (req, res) => {
            try {
                const { userId, courseId, message } = req.body;

                await chatCollection.updateOne(
                    {
                        courseId: courseId,
                        userId: userId
                    },
                    { $push: { messages: message } },
                    { upsert: true } // Add this to create a new document if it doesn't exist
                );

                res.status(201).json({ message: 'Message sent successfully' });
            } catch (error) {
                console.error('Error sending message:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });



        // Route to fetch messages based on userId and courseId
        app.get('/api/messages/:courseId/:userId', async (req, res) => {
            try {
                const { courseId, userId } = req.params;

                if (!courseId || !userId) {
                    return res.status(400).json({ error: 'Invalid request' });
                }

                const course = await chatCollection.findOne({ courseId: courseId, userId: userId });

                if (course) {
                    res.status(200).json(course.messages);
                } else {
                    res.status(404).json({ error: 'Course not found' });
                }
            } catch (error) {
                console.error('Error fetching messages from MongoDB:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });



        //  get all message by course id from db 
        app.get('/api/messages/:courseId', async (req, res) => {
            try {

                const courseId = req.params.courseId;

                const messages = await chatCollection.find({
                    courseId,
                }).toArray();

                res.status(200).json(messages);
            } catch (error) {
                console.error('Error fetching messages from MongoDB:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });


        // Function to generate a short alphanumeric ticket number
        function generateShortTicketNumber(length) {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let ticketNumber = '';

            for (let i = 0; i < length; i++) {
                const randomIndex = Math.floor(Math.random() * characters.length);
                ticketNumber += characters[randomIndex];
            }

            return ticketNumber;
        }
        const shortTicketNumber = generateShortTicketNumber(2);
        console.log(shortTicketNumber)



        // create support ticket
        app.post('/api/support-tickets', async (req, res) => {
            try {
                const { studentName, subject, message, studentEmail, timestamp } = req.body;


                const shortTicketNumber = generateShortTicketNumber(8);

                // Create a new support ticket document with the ticket number
                const supportTicket = {
                    'TicketNumber': shortTicketNumber,
                    'StudentName': studentName,
                    'StudentEmail': studentEmail,
                    Subject: subject,
                    status: 'pending',
                    Date: timestamp,
                    messages: [
                        {
                            sender: 'student',
                            content: message,
                            timestamp,
                        },
                    ],
                };

                // Insert the support ticket into the SupportTicket collection
                await client.db('CM').collection('SupportTicket').insertOne(supportTicket);

                // Send a response indicating success
                res.status(201).json({ message: 'Support ticket created successfully' });
            } catch (error) {
                console.error('Error creating support ticket:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });



        // Route to fetch all support tickets from the database
        app.get('/api/support-tickets', async (req, res) => {
            try {
                const supportTickets = await client.db('CM').collection('SupportTicket').find().toArray();
                res.status(200).json(supportTickets);
            } catch (error) {
                console.error('Error fetching support tickets:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });


        // get support ticket by ticket number from db 
        app.get('/api/support-tickets/:ticketNumber', async (req, res) => {
            try {
                const ticketNumber = req.params.ticketNumber;

                const supportTicket = await client.db('CM').collection('SupportTicket').findOne({ 'TicketNumber': ticketNumber });

                if (supportTicket) {
                    res.status(200).json(supportTicket);
                } else {
                    res.status(404).json({ error: 'Support ticket not found' });
                }
            } catch (error) {
                console.error('Error fetching support ticket:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });


        // get all support ticket by student email and student name from db
        app.get('/api/support-tickets/:studentEmail/:studentName', async (req, res) => {
            try {
                const studentEmail = req.params.studentEmail;
                const studentName = req.params.studentName;

                const supportTickets = await client.db('CM').collection('SupportTicket').find({
                    StudentEmail: studentEmail,
                    StudentName: studentName,
                }).toArray();

                res.status(200).json(supportTickets);
            } catch (error) {
                console.error('Error fetching support tickets:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });



        app.post('/api/support-tickets/:ticketNumber/add-message', async (req, res) => {
            try {
                const ticketNumber = req.params.ticketNumber;
                const newMessage = req.body;

                // Find the ticket based on the ticket number and update its messages array
                const result = await client.db('CM').collection('SupportTicket').updateOne(
                    { 'TicketNumber': ticketNumber },
                    { $push: { messages: newMessage } }
                );

                if (result.modifiedCount === 1) {
                    res.status(200).json(newMessage);
                } else {
                    res.status(404).json({ error: 'Support ticket not found' });
                }
            } catch (error) {
                console.error('Error adding message to support ticket:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });



        // Route to handle updating the status to "closed" for a support ticket with a given ticket number
        app.put('/api/support-tickets/:ticketNumber/close', async (req, res) => {
            try {
                const ticketNumber = req.params.ticketNumber;

                // Find the ticket based on the ticket number and update its status to "closed"
                const result = await client.db('CM').collection('SupportTicket').updateOne(
                    { 'TicketNumber': ticketNumber },
                    { $set: { status: 'closed' } }
                );

                if (result.modifiedCount === 1) {
                    res.status(200).json({ message: 'Support ticket closed successfully' });
                } else {
                    res.status(404).json({ error: 'Support ticket not found' });
                }
            } catch (error) {
                console.error('Error closing support ticket:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        });



        // Update finance details for a user
        // app.put('/updateFinance/:email', async (req, res) => {
        //     try {
        //         const email = req.params.email;
        //         const { totalAmount, withdrawn, balance } = req.body;


        //         console.log(email, totalAmount, withdrawn, balance);

        //         // Find the user's payment details and update the finance details
        //         const result = await InstructorPaymentCollection.updateOne(
        //             { email: email },
        //             {
        //                 $set: { totalAmount: totalAmount, withdrawn: withdrawn, balance: balance },

        //             },
        //             { upsert: true }
        //         );

        //         if (result.modifiedCount === 1) {
        //             res.status(200).json({ message: 'Finance details updated successfully' });
        //         } else {
        //             res.status(404).json({ error: 'User not found' });
        //         }
        //     } catch (error) {
        //         console.error('Error updating finance details:', error);
        //         res.status(500).json({ error: 'Internal Server Error' });
        //     }
        // });


        app.post('/updateFinance/:email', async (req, res) => {
            try {
                const { totalAmount, balance, withdrawn } = req.body;

                console.log('Received payment data:', totalAmount, balance, withdrawn);

                // Assuming you already have a MongoDB collection
                const InstructorPaymentCollection = client.db('CM').collection('Payment');

                // Find or create a document for the current user (you may use their email or ID)
                const userPaymentDoc = await InstructorPaymentCollection.findOneAndUpdate(
                    { instructorEmail: req.params.email }, // Assuming you have a user authentication system
                    {
                        $set: {
                            totalAmount,
                            currentBalance: balance,
                            totalWithdrawn: withdrawn,
                        },
                    },
                    { upsert: true, returnOriginal: false }
                );

                console.log('Updated payment document:', userPaymentDoc);

                if (userPaymentDoc) {
                    res.status(200).json({ message: 'Payment data stored successfully.' });
                } else {
                    res.status(500).json({ message: 'Failed to store payment data.' });
                }
            } catch (error) {
                console.error('Error storing payment data:', error);
                res.status(500).json({ message: 'Internal server error.' });
            }
        });




        ////////////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////////////////
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
        console.error(error, process.env.DB_USER);
    }
}


// shaon

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('CM Academy is on');
});

app.listen(port, () => {
    console.log(`CM Academy is on port ${port}`);
});




