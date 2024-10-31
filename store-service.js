const fs = require('fs');
let items = [];
let categories = [];

// Function to initialize the data (read items and categories from JSON files)
module.exports.initialize = () => {
  return new Promise((resolve, reject) => {
    // Read items.json first
    fs.readFile('./data/items.json', 'utf8', (err, data) => {
      if (err) {
        reject('unable to read items file');
        return;
      }

      try {
        items = JSON.parse(data);
      } catch (parseError) {
        reject('unable to parse items file');
        return;
      }

      // Read categories.json after items.json has been successfully loaded
      fs.readFile('./data/categories.json', 'utf8', (err, data) => {
        if (err) {
          reject('unable to read categories file');
          return;
        }

        try {
          categories = JSON.parse(data);
        } catch (parseError) {
          reject('unable to parse categories file');
          return;
        }

        // Everything is successful, resolve the promise
        resolve();
      });
    });
  });
};

// Function to get all items
module.exports.getAllItems = () => {
  return new Promise((resolve, reject) => {
    if (items.length > 0) {
      resolve(items);
    } else {
      reject('no results returned');
    }
  });
};

// Function to get only published items
module.exports.getPublishedItems = () => {
  return new Promise((resolve, reject) => {
    const publishedItems = items.filter(item => item.published === true);
    if (publishedItems.length > 0) {
      resolve(publishedItems);
    } else {
      reject('no results returned');
    }
  });
};

// Function to get all categories
module.exports.getCategories = () => {
  return new Promise((resolve, reject) => {
    if (categories.length > 0) {
      resolve(categories);
    } else {
      reject('no results returned');
    }
  });
};
