const { MongoClient } = require("mongodb");

// The uri string must be the connection string for the database (obtained on Atlas).
const uri = "mongodb+srv://shanna:mush@cluster0.esh0t93.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// --- This is the standard stuff to get it to work on the browser
const express = require('express');
const app = express();
const port = 3000;
app.listen(port);
console.log('Server started at http://localhost:' + port);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes will go here

// Default route:
app.get('/', function(req, res) {
  res.send(`
  <head>
  <title>Welcome!</title>
</head>
<body>
  <center>
    <h1>Welcome!</h1>
    <div id="login-section">
      <h2>Login</h2>
      <form action="/login" method="post">
        <label for="username">Username:</label><br>
        <input type="text" id="username" name="username"><br>
        <label for="password">Password:</label><br>
        <input type="password" id="password" name="password"><br><br>
        <input type="submit" value="Login">
      </form>
    </div>
    <div id="register-section">
      <h2>Register</h2>
      <form action="/register" method="post">
        <label for="new_username">New Username:</label><br>
        <input type="text" id="new_username" name="new_username"><br>
        <label for="new_password">New Password:</label><br>
        <input type="password" id="new_password" name="new_password"><br>
        <input type="submit" value="Register">
      </form>
    </div>
  </center>
</body>`
  );
});

app.get('/say/:name', function(req, res) {
  res.send('Hello ' + req.params.name + '!');
});

// Register route
app.post('/register', async function(req, res) {
  try {
    const { new_username, new_password } = req.body;

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Connect to the database
    await client.connect();
    const database = client.db('shannaDB');
    const users = database.collection('users');

    // Check if the username already exists
    const existingUser = await users.findOne({ username: new_username });
    if (existingUser) {
      return res.status(400).send('Username already exists');
    }

    // Insert the new user into the database
    await users.insertOne({ username: new_username, password: hashedPassword });
    res.send('User registered successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Login route
app.post('/login', async function(req, res) {
  try {
    const { username, password } = req.body;

    // Connect to the database
    await client.connect();
    const database = client.db('shannaDB');
    const users = database.collection('users');

    // Find the user in the database
    const user = await users.findOne({ username: username });
    if (!user) {
      return res.status(401).send('Invalid username or password');
    }

    // Check if the password is correct
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).send('Invalid username or password');
    }

    // Set the user's session
    req.session.user = user;
    res.send('Login successful');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


// Route to access database:
app.get('/api/mongo/:item', function(req, res) {
const client = new MongoClient(uri);
//const searchKey = "{ partID: '" + req.params.item + "' }";
console.log("Looking for: " + searchKey);

async function run() {
  try {
    const database = client.db('shannaDB');
    const parts = database.collection('shannaCollection');

    // Hardwired Query for a part that has partID '12345'
    // const query = { partID: '12345' };
    // But we will use the parameter provided with the route
    const query = { partID: req.params.item };

    const part = await parts.findOne(query);
    console.log(part);
    res.send('Found this: ' + JSON.stringify(part));  //Use stringify to print a json

  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);
});

