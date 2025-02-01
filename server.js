//this is my server.js file
require('dotenv').config();

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const session = require("express-session");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const cron = require('node-cron');

const app = express();
const db = new sqlite3.Database("./database.sqlite");
const db1 = new sqlite3.Database('./newsletter.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());  // To parse JSON requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret:  process.env.MY_CODE, // Replace with a strong secret
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 120000 }, // Default session expiry time (2 minutes)
  })
);

// Create users table
db.serialize(() => {  
  db.run(
    "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, phone TEXT UNIQUE, password TEXT, resetToken TEXT, resetTokenExpiry INTEGER)"
  );

  
  // Create products table
  db.run(
    "CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, description TEXT, price REAL, image TEXT)"
  );

db.run(
  "CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, phone TEXT, items TEXT, total_price REAL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)"
  );


//
//
//this is the  of product section

  // Insert sample product data
  db.get("SELECT COUNT(*) AS count FROM products", (err, row) => {
    if (row.count === 0) {
      const sampleProducts = [
        ["Toyota Camry", "A reliable and efficient car.", 100, "images/fourt.png"],
        // Add more sample products as needed
      ];
      sampleProducts.forEach(product => {
        db.run(
          "INSERT INTO products (name, description, price, image) VALUES (?, ?, ?, ?)",
          product,
          function (err) {
            if (err) console.log("Error inserting product:", err);
          }
        );
      });
    }
  });
});

// Get Products
app.get("/api/products", (req, res) => {
  db.all("SELECT * FROM products", (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(rows); // Send the products data as JSON
  });
});


// Add product to cart
app.post("/api/add-to-cart", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "User not logged in" });
  }

  const { productId } = req.body;
  if (!productId) {
    return res.status(400).json({ error: "Product ID is required" });
  }

  db.run(
    "INSERT INTO cart (user_id, product_id) VALUES (?, ?)",
    [req.session.user.id, productId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Error adding product to cart" });
      }
      res.json({ success: true });
    }
  );
});

// Save order
app.post("/save-order", (req, res) => {
    const { user, cartItems } = req.body;
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
    const itemsJson = JSON.stringify(cartItems);

    db.run(
        `INSERT INTO orders (email, phone, items, total_price) VALUES (?, ?, ?, ?)`,
        [user.email, user.phone, itemsJson, totalPrice],
        function (err) {
            if (err) {
                res.status(500).json({ message: "Error saving order" });
            } else {
                res.json({ message: "Order saved successfully!", orderId: this.lastID });
            }
        }
    );
});

// Get all orders
app.get("/all-orders", (req, res) => {
    db.all("SELECT * FROM orders", (err, rows) => {
        if (err) {
            res.status(500).json({ message: "Error retrieving orders" });
        } else {
            res.json(rows);
        }
    });
});

// Get orders for a specific user
app.get("/user-orders/:email", (req, res) => {
    const email = req.params.email;
    db.all("SELECT * FROM orders WHERE email = ?", [email], (err, rows) => {
        if (err) {
            res.status(500).json({ message: "Error retrieving user orders" });
        } else {
            res.json(rows);
        }
    });
});


// API to save orders
app.post('/api/save-order', (req, res) => {
    const { email, phone, cartItems } = req.body;

    if (!email || !phone || !cartItems || cartItems.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid order details.' });
    }

    const productDetails = JSON.stringify(cartItems);

    const sql = `INSERT INTO orders (email, phone, product_details) VALUES (?, ?, ?)`;
    db.run(sql, [email, phone, productDetails], function (err) {
        if (err) {
            console.error('Error saving order:', err.message);
            return res.status(500).json({ success: false, error: 'Failed to save order.' });
        }
        res.json({ success: true, orderId: this.lastID });
    });
});

// API to retrieve all orders (for order-history.html)
app.get('/api/orders', (req, res) => {
    db.all(`SELECT * FROM orders`, [], (err, rows) => {
        if (err) {
            console.error('Error retrieving orders:', err.message);
            return res.status(500).json({ success: false, error: 'Failed to retrieve orders.' });
        }
        res.json({ success: true, orders: rows });
    });
});
//
//
//this is the end of product section







// Utility: Generate random code
const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();


// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Replace with your email
    pass: process.env.EMAIL_PASS, // Replace with your email password
  },
});


//
//
//
//
//contact us section
app.post('/send-email', async (req, res) => {
  const { name, email, number, message } = req.body;

  if (!name || !email || !number || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const mailOptions = {
    from: email,
    to: 'refurbit024@gmail.com',
    subject: `Contact Us Form Submission from ${name}`,
    text: `You have received a new message from the contact form:

Name: ${name}
Email: ${email}
Phone Number: ${number}
Message: ${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send the email. Please try again later.' });
  }
});





//end of contact us section
//
//
//
//





//
//
//
//
// Forgot password endpoint
app.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = Date.now() + 3600000; // 1 hour

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.json({ success: false, message: 'Database error' });
    if (!user) return res.json({ success: false, message: 'User not found' });

    db.run(
      'UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?',
      [resetToken, resetTokenExpiry, email],
      (err) => {
        if (err) return res.json({ success: false, message: 'Error updating token' });

        const resetLink = `http://localhost:${port}/?token=${resetToken}`;
        transporter.sendMail(
          {
            from: 'your-email@gmail.com',
            to: email,
            subject: 'Password Reset',
            html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
          },
          (err) => {
            if (err) return res.json({ success: false, message: 'Error sending email' });
            res.json({ success: true, message: 'Reset link sent to email' });
          }
        );
      }
    );
  });
});

// Reset password endpoint
app.post('/reset-password', (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.json({ success: false, message: 'Passwords do not match' });
  }

  db.get('SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > ?', [token, Date.now()], (err, user) => {
    if (err) return res.json({ success: false, message: 'Database error' });
    if (!user) return res.json({ success: false, message: 'Invalid or expired token' });

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(
      'UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE resetToken = ?',
      [hashedPassword, token],
      (err) => {
        if (err) return res.json({ success: false, message: 'Error updating password' });
        res.json({ success: true, message: 'Password reset successful' });
      }
    );
  });
});
//end of Forgot password endpoint
//
//
//
//




// Endpoint to check if the user is in session
app.get("/check-session", (req, res) => {
  if (req.session.user) {
    res.json({ status: "in-session", user: req.session.user });
  } else {
    res.json({ status: "not-in-session" });
  }
});


app.post("/signup", async (req, res) => {
  const { email, phone, password } = req.body;

  if ( !email || !phone || !password) {
    return res.status(400).send("All fields are required.");
  }

  // Check if email or phone number already exists
  db.get("SELECT * FROM users WHERE email = ? OR phone = ?", [email, phone], (err, row) => {
    if (err) {
      return res.status(500).send("Database error. Please try again.");
    }
    if (row) {
      if (row.email === email) {
        return res.status(400).send("Email already exists");
      }
      if (row.phone === phone) {
        return res.status(400).send("Phone number already exists");
      }
    }

    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insert the new user into the database
    db.run(
      "INSERT INTO users (email, phone, password) VALUES (?, ?, ?)",
      [email, phone, hashedPassword],
      function (err) {
        if (err) {
          return res.status(500).send("Error signing up");
        }

        // Log the user in by assigning a session
        req.session.user = { id: this.lastID, email };
        req.session.cookie.maxAge = 120000; // Session expires in 2 minutes
        res.status(200).send("Sign-up successful! Please login.");
      }
    );
  });
});

// Endpoint for user login
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Check if the user exists
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
    if (!row) {
      return res.status(400).send("User not found");
    }

    // Verify the password
    const isPasswordValid = bcrypt.compareSync(password, row.password);
    if (!isPasswordValid) {
      return res.status(400).send("Invalid password");
    }

    // Assign session and set expiry to 1 minute
    req.session.user = { id: row.id, email: row.email };
    req.session.cookie.maxAge = 60000; // Session expires in 1 minute
    res.status(200).send("login Verification Successful, Please Refresh the page");
  });
});

// Endpoint for user logout
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error logging out");
    }
    res.status(200).send("Logged out successfully");
  });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
