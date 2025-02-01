
//start of product section
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch products from the API
        const response = await fetch('/api/products');
        const products = await response.json();

        const productContainer = document.querySelector('#product-container'); // Ensure this container exists.

        // Render products dynamically
        products.forEach(product => {
            const productHTML = `
            <div class="col-md-4 mb-4">
              <div class="card">
                <img src="${product.image}" class="card-img-top" alt="${product.name}">
                <div class="card-body">
                  <h5 class="card-title">${product.name}</h5>
                  <p class="card-text">Description: ${product.description}</p>
                  <p class="card-text">Price: $${product.price}</p>
                  <button class="btn btn-primary viewBtn" data-id="${product.id}">View</button>
                  <button class="btn btn-success addToCartBtn" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">Add to Cart</button>
                </div>
              </div>
            </div>`;
            productContainer.innerHTML += productHTML;
        });

        // Initialize event handlers for Add to Cart buttons
        setupAddToCart();

        // Load cart from local storage
        loadCartFromLocalStorage();
    } catch (error) {
        displayError('Failed to load products. Please try again later.');
        console.error("Error loading products:", error);
    }
});

// Cart functionality
let cart = [];

// Setup Add to Cart Buttons
function setupAddToCart() {
    document.querySelectorAll('.addToCartBtn').forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.getAttribute('data-id');
            const productName = button.getAttribute('data-name');
            const productPrice = button.getAttribute('data-price');

            // Check if the product is already in the cart
            const existingProduct = cart.find(item => item.id === productId);
            if (!existingProduct) {
                cart.push({ id: productId, name: productName, price: parseFloat(productPrice) });
                updateCartList();
                saveCartToLocalStorage();
                displayMessage(`${productName} added to cart.`);
            } else {
                displayError('Product is already in the cart!');
            }
        });
    });
}

// Update Cart List and Render Items
function updateCartList() {
    const cartContainer = document.querySelector('#cart-list');
    cartContainer.innerHTML = ''; // Clear current list

    // Render each cart item with a remove button
    cart.forEach((product, index) => {
        const cartItemHTML = `
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <span>${product.name} - $${product.price.toFixed(2)}</span>
          <button class="btn btn-danger btn-sm" onclick="removeFromCart(${index})">Remove</button>
        </li>`;
        cartContainer.innerHTML += cartItemHTML;
    });

    // Add "Order Now" button at the end of the cart
    if (cart.length > 0) {
        const orderNowButton = `
          <button class="btn btn-primary mt-3 w-100" onclick="placeOrder()">Order Now</button>`;
        cartContainer.innerHTML += orderNowButton;
    }

    // Update Total Price
    const totalPrice = cart.reduce((total, product) => total + product.price, 0);
    document.querySelector('#total-price').textContent = `Total: $${totalPrice.toFixed(2)}`;
}

// Remove an item from the cart
function removeFromCart(index) {
    const removedItem = cart[index];
    cart.splice(index, 1); // Remove the item at the specified index
    updateCartList(); // Re-render the cart list
    saveCartToLocalStorage(); // Update local storage
    displayMessage(`${removedItem.name} removed from cart.`);
}


//display error message
function displayMessage(message) {
    const messageContainer = document.querySelector('#message-container');
    messageContainer.innerHTML = 
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>;

    // Auto-remove the alert after 5 seconds
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 100);
}





//session check area
const showError = (errors) => {
  const errorContainer = document.getElementById("error-container");
  const errorList = document.getElementById("error-list");
  errorList.innerHTML = ""; // Clear previous errors

  errors.forEach((error) => {
    const li = document.createElement("li");
    li.textContent = error;
    errorList.appendChild(li);
  });

  errorContainer.style.display = "block"; // Show the error container
};


const checkSessionBtn = document.getElementById("check-session-btn");

checkSessionBtn.addEventListener("click", () => {
  fetch("/check-session")
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "in-session") {
        usernameDisplay.style.display = "block"; // Show username
        checkSessionBtn.style.display = "none"; // Hide the button
        alert(`You are logged in as ${data.user.email}`);
      } else {
        const authModal = new bootstrap.Modal(document.getElementById("authModal"));
        authModal.show();
      }
    })
    .catch((error) => {
      console.error("Error fetching session data:", error);
      showError(["Failed to fetch session data. Please try again later."]);
    });
});

document.getElementById("toggle-form").addEventListener("click", () => {
  const modalLabel = document.getElementById("authModalLabel");
  const phoneContainer = document.getElementById("phone-container");
  const namecontainer = document.getElementById("name-container");
  
  if (modalLabel.innerText === "Login") {
    modalLabel.innerText = "Sign-Up";
    phoneContainer.style.display = "block";
	namecontainer.style.display = "block";
  } else {
    modalLabel.innerText = "Login";
    phoneContainer.style.display = "none";
    namecontainer.style.display = "none";
  }
});

document.getElementById("auth-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const modalLabel = document.getElementById("authModalLabel").innerText;
  const endpoint = modalLabel === "Login" ? "login" : "signup";

  
  const email = document.getElementById("email").value; // Collect value by id
  const phone = document.getElementById("phone").value; // Collect value by id
  const password = document.getElementById("password").value; // Collect value by id

  // Construct the payload dynamically
  const body = { email, password };
  if (endpoint === "signup") {
    body.phone = phone;
  }

  fetch(`${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then((message) => Promise.reject(message));
      }
      return response.text();
    })
    .then((message) => {
      alert(message);
      const authModal = bootstrap.Modal.getInstance(document.getElementById("authModal"));
      authModal.hide();
      document.getElementById("error-container").style.display = "none";
    })
    .catch((errorMessage) => {
      showError([errorMessage]);
    });
});

  // Automatically check session when the page loads
 const ename = document.getElementById('ename');
  window.addEventListener("DOMContentLoaded", () => {
    fetch("/check-session")
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "in-session") {
          ename.innerText = `Welcome, ${data.user.email}!`;
		  checkSessionBtn.style.display = "none"; // Hide the button
        } else {
          alert("You are not in session.");
        }
      })
      .catch((error) => {
        console.error("Error fetching session data:", error);
        showError(["Failed to fetch session data on page load."]);
      });
  });

//end of session check area
	

  
  
  const totalPriceElement = document.getElementById('total-price');
    const cartList = document.getElementById('cart-list');

    // Example items in cart (to be dynamically managed in a real application)
    const cartItems = [
      { id: 1, name: 'there is nothing in your cart yet', price: 'just add one' },
    ];

    // Function to render the cart items
    function renderCartItems() {
      cartList.innerHTML = '';
      cartItems.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item';

        listItem.innerHTML = `
          <span>${item.name} - ${item.price}- ${item.description}</span>
          <button class="btn btn-danger btn-sm" onclick="removeItem(${index})">Remove</button>
        `;
        cartList.insertBefore(listItem, cartList.lastElementChild);
      });

      // Append the "Order Now" button at the end
      const orderNowButton = document.createElement('button');
      orderNowButton.className = 'btn btn-primary mt-3 w-100';
      orderNowButton.textContent = 'Order Now';
      orderNowButton.onclick = () => alert('Order placed successfully!');
      cartList.appendChild(orderNowButton);
    }

    // Function to toggle the cart list visibility
    totalPriceElement.addEventListener('click', () => {
      cartList.classList.toggle('show');
    });

    // Function to remove an item from the cart
    function removeItem(index) {
      cartItems.splice(index, 1);
      renderCartItems();
    }

    // Initial render of cart items
    renderCartItems();
  
  
  
  
 // start of slide in menu
   const slideMenu = document.getElementById('slideMenu');
    const menuOverlay = document.getElementById('menuOverlay');

    function toggleMenu() {
      slideMenu.classList.toggle('open');
      menuOverlay.classList.toggle('show');
    }

    function closeMenu() {
      slideMenu.classList.remove('open');
      menuOverlay.classList.remove('show');
    }

 // end of slide in menu  
	
   




//curosel slides
  let currentSlide = 0;
const slides = document.querySelector('.slides');
const slideElements = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
const slideCount = slideElements.length;

// Clone the first slide and append it to the end
const firstSlideClone = slideElements[0].cloneNode(true);
slides.appendChild(firstSlideClone);

function updateSlidePosition() {
  slides.style.transition = 'transform 0.5s ease-in-out';
  slides.style.transform = `translateX(-${currentSlide * 100}%)`;
  updateDots();
}

function updateDots() {
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentSlide);
  });
}

function goToSlide(slideIndex) {
  currentSlide = slideIndex;
  updateSlidePosition();
}

// Move to the next slide
function nextSlide() {
  currentSlide++;
  if (currentSlide === slideCount) {
    setTimeout(() => {
      slides.style.transition = 'none';
      currentSlide = 0;
      slides.style.transform = `translateX(0)`;
    }, 500);
  }
  updateSlidePosition();
}

// Auto-slide every 3 seconds
setInterval(nextSlide, 3000);

// Event listeners for dots
dots.forEach((dot, index) => {
  dot.addEventListener('click', () => goToSlide(index));
});

// Initialize
updateSlidePosition();

  
  const popupOverlay = document.getElementById('popupOverlay');
const popupContent = document.getElementById('popupContent');

function showPopup(slideIndex) {
  // Set the title and details dynamically based on the clicked slide
  const slideDetails = [
    { title: 'Mercedes benz cle360 ', details: 'fairly used and clean, for sale at 8.5m' },
    { title: 'Toyota camry', details: 'clean toyota camry, refurbished 2024 for sale at 3m' },
    { title: 'Toyota hilux', details: 'clean Toyota hilux for sale at 10.3m' },
  ];

  // Update the content of the popup based on the slideIndex
  if (slideDetails[slideIndex - 1]) {
    popupContent.querySelector('h2').textContent = slideDetails[slideIndex - 1].title;
    popupContent.querySelector('p').textContent = slideDetails[slideIndex - 1].details;
  } else {
    popupContent.querySelector('h2').textContent = 'No Title';
    popupContent.querySelector('p').textContent = 'No Details available.';
  }

  // Display the overlay
  popupOverlay.style.display = 'flex';
}

function closePopup() {
  // Hide the overlay
  popupOverlay.style.display = 'none';
}

// Attach event listeners to close the popup when clicking outside the content
popupOverlay.addEventListener('click', (e) => {
  if (e.target === popupOverlay) {
    closePopup();
  }
});
//end of curosel
  
  
  
  
  //start of login and signup functionlity
  
   
	//end of login and signup functionality
