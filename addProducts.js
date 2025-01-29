const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.sqlite");

// Add products
const products = [
  ["Honda Accord", "Comfortable and stylish sedan", 15000, "images/honda.png"],
  ["Ford Mustang", "A classic American muscle car", 30000, "images/fc7.png"],
  ["sienna", "A classic American muscle car", 30000, "images/tird.png"]
];

db.serialize(() => {
  products.forEach(([name, description, price, image]) => {
    db.run(
      "INSERT INTO products (name, description, price, image) VALUES (?, ?, ?, ?)",
      [name, description, price, image],
      (err) => {
        if (err) {
          console.error("Error inserting product:", err);
        } else {
          console.log(`Added product: ${name}`);
        }
      }
    );
  });
});

db.close();






