// server.js

const express = require('express');
const storeService = require('./store-service.js'); // Import the store-service module

const app = express();

// Use the 'public' folder to serve static files
app.use(express.static('public'));

const port = process.env.PORT || 8080;

// Route for "/" that redirects to "/about"
app.get('/', (req, res) => {
  res.redirect('/about');
});

// Route for "/about" that serves the about.html file
app.get('/about', (req, res) => {
  res.sendFile(__dirname + '/views/about.html');
});

// Route for "/shop" to get published items
app.get('/shop', (req, res) => {
  storeService.getPublishedItems()
    .then((publishedItems) => {
      res.json(publishedItems);
    })
    .catch((err) => {
      res.status(500).json({ message: err });
    });
});

// Route for "/items" to get all items
app.get('/items', (req, res) => {
  storeService.getAllItems()
    .then((items) => {
      res.json(items);
    })
    .catch((err) => {
      res.status(500).json({ message: err });
    });
});

// Route for "/categories" to get all categories
app.get('/categories', (req, res) => {
  storeService.getCategories()
    .then((categories) => {
      res.json(categories);
    })
    .catch((err) => {
      res.status(500).json({ message: err });
    });
});

// Catch-all route for undefined routes (404 error)
app.use((req, res) => {
  res.status(404).json({ message: 'Page Not Found' });
});

// Initialize the store-service and start the server if successful
storeService.initialize()
  .then(() => {
    app.listen(port, () => {
      console.log(`Express http server listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error(`Failed to start the server: ${err}`);
  });
