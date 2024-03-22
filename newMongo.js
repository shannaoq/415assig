//T1 - connecting to the database, where my current users are stored
const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://shanna:mush@cluster0.esh0t93.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);
const express = require('express');
const app = express();
const port = 3000;
app.listen(port);
console.log('Server started at http://localhost:' + port);

//stuff I need for the cookies later
var cookies = require("cookie-parser");
app.use(cookies());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const session = require('express-session');

// Configure session middleware
//this is for the cookies
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 60 * 1000 
  }
}));

//append cookie-reporting link to all views
app.use((req, res, next) => {
  res.locals.cookieReportLink = `<a href="/cookie-report">View Cookies</a>`;
  next();
});

// Default route:
app.get('/', function(req, res) {
  res.send(`
  <head>
  <title>Welcome!</title>
  <style>
      .button {
        background-color: pink;
        padding: 10px;
        border-radius: 5px;
        color: white;
        text-decoration: none;
        margin-top: 10px;
        display: inline-block;
      }

      .container {
        display: flex;
        justify-content: center;
      }
      .column {
        flex: 1;
        padding: 1px;
      }
    </style>
  </head>
  <body>
    <center>
      <h1>Welcome!</h1>
      <div class="container">
        <div class="column">
          <div id="login-section">
            <h2>Login</h2>
            <form action="/login" method="post">
              <label for="username">Username:</label><br>
              <input type="text" id="username" name="username"><br>
              <label for="password">Password:</label><br>
              <input type="password" id="password" name="password"><br>
              <input type="submit" value="Login" class="button">
            </form>
          </div>
        </div>
        <div class="column">
          <div id="register-section">
            <h2>Not a current user? <br> Register</h2>
            <form action="/register" method="post">
              <label for="new_username">New Username:</label><br>
              <input type="text" id="new_username" name="new_username"><br>
              <label for="new_password">New Password:</label><br>
              <input type="password" id="new_password" name="new_password"><br>
              <input type="submit" value="Register" class="button">
            </form>
          </div>
        </div>
      </div>
      <div id="cookie-actions">
        <h2>Cookie Actions</h2>
        <div id="cookie-report-section">
          <h3>Cookie Report</h3>
          <a href="/cookie-report" class="button">View Cookies</a>
        </div>
        <div id="cookie-clearing-section">
          <h3>Clear Cookies</h3>
          <a href="/clear-cookies" class="button">Clear Cookies</a>
        </div>
      </div>
    </center>
  </body>
`);
});

//T2 - where the user registers
// Register page and buttons
app.post('/register', async function(req, res) {
  try {
    const { new_username, new_password } = req.body;

    // Connect to the database
    await client.connect();
    const database = client.db('shannaDB');
    const users = database.collection('loginStuff');

    // Check for username already existing
    const existingUser = await users.findOne({ username: new_username });
    if (existingUser) {
      return res.status(400).send(`
      <div style="text-align: center;">
          <p>Username already exists.</p>
          <button style="background-color: pink; padding: 10px; border-radius: 5px;">
            <a href="/" style="text-decoration: none; color: white;">Return to main page</a>
          </button>
          <button style="background-color: pink; padding: 10px; border-radius: 5px;">
            <a href="/cookie-report" style="text-decoration: none; color: white;">Cookie report</a>
          </button>
          </button>
          <button style="background-color: pink; padding: 10px; border-radius: 5px;">
          <a href="/clear-cookies" style="text-decoration: none; color: white;">Clear Cookies</a>
          </button>
        </div>
    `);
    }

    // Insert new user into my database
    await users.insertOne({ username: new_username, password: new_password });
    res.send(`
    <div style="text-align: center;">
    <p>User registered successfully.</p>
    <button style="background-color: pink; padding: 10px; border-radius: 5px;">
      <a href="/" style="text-decoration: none; color: white;">Return to main page</a>
    </button>
  </div>
    <div id="cookie-section" style="text-align: center;">
    <h3>Cookie Actions</h3>
    <button style="background-color: pink; padding: 10px; border-radius: 5px;">
        <a href="/cookie-report" style="text-decoration: none; color: white;">Cookie report</a>
    </button>
    </button>
      <button style="background-color: pink; padding: 10px; border-radius: 5px;">
      <a href="/clear-cookies" style="text-decoration: none; color: white;">Clear Cookies</a>
    </button>
    </div>
  `);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

//T3 allows the user to login if they have the correct credentials, otherwise they are denied acess until they register
// Login route
app.post('/login', async function(req, res) {
  try {
    const { username, password } = req.body;

    console.log("Received login request for username:", username);

    // Connect to database
    await client.connect();
    console.log("Connected to the database");

    const database = client.db('shannaDB');
    const users = database.collection('loginStuff');

    // Find user in the database
    const user = await users.findOne({ username: username });
    
    //T3.1 unsuccessful
    if (!user) {
      console.log("User not found:", username);
      return res.status(401).send(`
        <div style="text-align: center;">
          <p>Invalid username or password.</p>
          <button style="background-color: pink; padding: 10px; border-radius: 5px;">
            <a href="/" style="text-decoration: none; color: white;">Return to main page</a>
          </button>
          <button style="background-color: pink; padding: 10px; border-radius: 5px;">
            <a href="/cookie-report" style="text-decoration: none; color: white;">Cookie report</a>
          </button>
          </button>
          <button style="background-color: pink; padding: 10px; border-radius: 5px;">
             <a href="/clear-cookies" style="text-decoration: none; color: white;">Clear Cookies</a>
          </button>
        </div>
      `);
    }

    console.log("User found:", username);

    // Check if the password is correct
    if (password !== user.password) {
      console.log("Incorrect password for user:", username);
      return res.status(401).send(`
        <div style="text-align: center;">
          <p>Invalid username or password.</p>
          <button style="background-color: pink; padding: 10px; border-radius: 5px;">
            <a href="/" style="text-decoration: none; color: white;">Return to main page</a>
          </button>
        </div>
      `);
    }

    //T3.2 Successful
    console.log("User logged in successfully:", username);

    //where the user's cookie is generated
    // Set the user's session
    req.session.user = user;
    res.cookie('user', username) //I want the cookie to be set as the user's username
    const sessionId = req.sessionID;
    const sessionData = req.session;
    res.send(`
      <div style="text-align: center;">
        <p>Login successful!</p>
        <h2>Session Information:</h2>
        <p>User's cookie: ${username}</p>
            <button style="background-color: pink; padding: 10px; border-radius: 5px;">
            <a href="/" style="text-decoration: none; color: white;">Return to main page</a>
          </button>
          <button style="background-color: pink; padding: 10px; border-radius: 5px;">
            <a href="/cookie-report" style="text-decoration: none; color: white;">Cookie report</a>
          </button>
        </div>
    `);
  } catch (error) {
    console.error('Error:', error); // Log error for debugging
    res.status(500).send('Internal Server Error');
  } finally {
    // close database
    await client.close();
  }
});

//T4 - cookie report
// Endpoint to report cookies
app.get('/cookie-report', function (req, res) {
  const mycookies = req.cookies;

  // Filter out the session cookie
  const filteredCookies = Object.keys(mycookies).reduce((acc, key) => {
    if (key !== 'connect.sid') {
      acc[key] = mycookies[key];
    }
    return acc;
  }, {});

  if (Object.keys(filteredCookies).length === 0) {
    // No cookies present
    res.send(`
    <div style="text-align: center;">
      <h1>Active Cookies</h1>
      <h2>The cookies are gone!!!!</h2>
      <button style="background-color: pink; padding: 10px; border-radius: 5px;">
        <a href="/" style="text-decoration: none; color: white;">Return to main page</a>
      </button>
      <button style="background-color: pink; padding: 10px; border-radius: 5px;">
      <a href="/clear-cookies" style="text-decoration: none; color: white;">Clear Cookies</a>
    </button>
    </div>
    `);
  } else {
    // Cookies are present
    let cookiesOutput = `
    <div style="text-align: center;">
      <h1>Active Cookies</h1>
    `;
    // Iterate over each cookie and print associated cookie value
    Object.keys(filteredCookies).forEach(cookie => {
      cookiesOutput += `
      <p>Cookie: ${filteredCookies[cookie]}</p>
      `;
    });
    cookiesOutput += `
      <button style="background-color: pink; padding: 10px; border-radius: 5px;">
        <a href="/" style="text-decoration: none; color: white;">Return to main page</a>
      </button>
      <button style="background-color: pink; padding: 10px; border-radius: 5px;">
        <a href="/clear-cookies" style="text-decoration: none; color: white;">Clear Cookies</a>
      </button>
    </div>
    `;
    res.send(cookiesOutput);
  }
});


//T5
// Route to clear all cookies
app.get('/clear-cookies', (req, res) => {
  // Check if the cookie exists before attempting to clear it
  if (req.cookies && req.cookies.user) {
    // Clear the cookie
    res.clearCookie("user");
  }

  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error('Error clearing cookies:', err);
      res.status(500).send('Error clearing cookies');
    } else {
      // Redirect after clearing cookies
      res.send(`
      <div style="text-align: center;">
        <h1>The cookies are all gone!</h1>
        <button style="background-color: pink; padding: 10px; border-radius: 5px;">
            <a href="/cookie-report" style="text-decoration: none; color: white;">Cookie report</a>
          </button>
          <br><br>
        <button style="background-color: pink; padding: 10px; border-radius: 5px;">
            <a href="/" style="text-decoration: none; color: white;">Return to main page</a>
          </button>
      </div>
      `);
    }
  });
});

