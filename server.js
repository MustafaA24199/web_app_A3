const path = require('path');
const fs = require('fs');
const express = require('express');
const storeService = require('./store-service.js'); 
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const { 
  addItem, 
  getItemsByCategory, 
  getItemsByMinDate, 
  getItemById, 
  getAllItems, 
  getPublishedItems, 
  getCategories 
} = storeService;

cloudinary.config({
  cloud_name: 'dyzupsv5u',
  api_key: '391944133355469',
  api_secret: 'Og7dSw026kms_k2Xd_duYIYjCNQ',
  secure: true
});

const upload = multer();
const app = express();

app.use(express.static('public'));

const port = process.env.PORT || 8080;

// Route for "/" that redirects to "/about"
app.get('/', (req, res) => {
  res.redirect('/about');
});

// Route for "/about" that serves the about.html file
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

// Route to display form to add items
app.get('/items/add', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'addItems.html'));
});

// Route to handle adding a new item with optional image upload
app.post('/items/add', upload.single("featureImage"), async (req, res) => {
  if (req.file) {
      let streamUpload = (req) => {
          return new Promise((resolve, reject) => {
              let stream = cloudinary.uploader.upload_stream((error, result) => {
                  if (result) {
                      resolve(result);
                  } else {
                      reject(error);
                  }
              });
              streamifier.createReadStream(req.file.buffer).pipe(stream);
          });
      };

      async function upload(req) {
          let result = await streamUpload(req);
          return result;
      }

      upload(req).then((uploaded) => {
          processItem(uploaded.url);
      }).catch((error) => {
          console.error("Image upload failed:", error);
          processItem("");
      });
  } else {
      processItem("");
  }

  function processItem(imageUrl) {
      req.body.featureImage = imageUrl;
      addItem(req.body).then(() => {
          res.redirect('/items');
      }).catch(err => {
          res.status(500).send("Unable to add item");
      });
  }
});

// Route for "/shop" to get published items
app.get('/shop', (req, res) => {
  storeService.getPublishedItems()
      .then((publishedItems) => {
          fs.readFile(path.join(__dirname, 'views', 'shop.html'), 'utf8', (err, data) => {
              if (err) {
                  res.status(500).send("Error loading shop page");
                  return;
              }

              // Generate HTML for each item
              const itemsHtml = publishedItems.map(item => `
                  <div class="entry">
                      <h2>${item.title}</h2>
                      <img src="${item.featureImage}" alt="${item.title}">
                      <p>${item.body}</p>
                      <p>Price: $${item.price.toFixed(2)}</p>
                  </div>
              `).join('');

              const finalHtml = data.replace('{{items}}', itemsHtml);
              res.send(finalHtml);
          });
      })
      .catch((err) => {
          res.status(500).send("Unable to load shop page");
      });
});


// Consolidated "/items" route with optional query parameters
app.get('/items', (req, res) => {
  const renderItemsPage = (items) => {
      fs.readFile(path.join(__dirname, 'views', 'items.html'), 'utf8', (err, data) => {
          if (err) {
              res.status(500).send("Error loading items page");
              return;
          }

          // Generate HTML for each item
          const itemsHtml = items.map(item => `
              <div class="item">
                  <h2>${item.title}</h2>
                  <img src="${item.featureImage}" alt="${item.title}">
                  <p>${item.body}</p>
                  <p>Price: $${item.price.toFixed(2)}</p>
                  <p>Category: ${item.category}</p>
                  <p>Date: ${item.postDate}</p>
              </div>
              <hr>
          `).join('');

          // Replace the placeholder with the generated HTML
          const finalHtml = data.replace('{{items}}', itemsHtml);

          // Send the final HTML
          res.send(finalHtml);
      });
  };

  // Check for query parameters and filter accordingly
  if (req.query.category) {
      storeService.getItemsByCategory(req.query.category)
          .then(renderItemsPage)
          .catch(err => {
              res.status(404).send(`<p>${err}</p>`);
          });
  } else if (req.query.minDate) {
      storeService.getItemsByMinDate(req.query.minDate)
          .then(renderItemsPage)
          .catch(err => {
              res.status(404).send(`<p>${err}</p>`);
          });
  } else {
      storeService.getAllItems()
          .then(renderItemsPage)
          .catch(err => {
              res.status(404).send(`<p>${err}</p>`);
          });
  }
});


// Route to retrieve a single item by ID
app.get('/item/:id', (req, res) => {
  getItemById(req.params.id).then((item) => {
      res.json(item);
  }).catch(err => {
      res.status(404).json({ message: err });
  });
});

// Route for "/categories" to get all categories
app.get('/categories', (req, res) => {
  storeService.getCategories()
      .then((allCategories) => {
          // Load the HTML template for categories
          fs.readFile(path.join(__dirname, 'views', 'categories.html'), 'utf8', (err, data) => {
              if (err) {
                  res.status(500).send("Error loading categories page");
                  return;
              }

              // Generate HTML for each category
              const categoriesHtml = allCategories.map(category => `
                  <div class ="entry">
                  <h3>${category.category}</h3>
                  <p>Category ID: ${category.id}</p>
                  </div>
              `).join('');

              // Replace the placeholder with the generated HTML
              const finalHtml = data.replace('{{categories}}', categoriesHtml);

              // Send the final HTML
              res.send(finalHtml);
          });
      })
      .catch((err) => {
          res.status(500).send("Unable to load categories page");
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
