// Product Data
const products = [
    {
        id: 1,
        name: "New Gen X-Bud",
        price: 99.99,
        image: "images/buds1.webp",
        description: "Premium wireless earbuds with crystal clear sound",
        colors: ["Black", "White", "Blue"],
        rating: 4.5,
        stock: 15
    },
    {
        id: 2,
        name: "Gaming Headphone Pro",
        price: 199.99,
        image: "images/head1.webp",
        description: "Noise-cancelling headphones with premium comfort",
        colors: ["Light Grey", "Black"],
        rating: 4.8,
        stock: 8
    },
    {
        id: 3,
        name: "Bass Boost Pro",
        price: 149.99,
        image: "images/applehead.png",
        description: "Extra bass headphones for powerful sound",
        colors: ["Red", "Black", "Blue"],
        rating: 4.3,
        stock: 12
    },
    {
        id: 4,
        name: "Studio Monitor",
        price: 249.99,
        image: "images/pngwing.com.png",
        description: "Professional studio headphones for accurate sound",
        colors: ["Black"],
        rating: 4.9,
        stock: 5
    },
    {
        id: 5,
        name: "Wireless Over-Ear",
        price: 179.99,
        image: "images/overear.png",
        description: "Comfortable wireless over-ear headphones",
        colors: ["Black", "Brown"],
        rating: 4.6,
        stock: 10
    },
    {
        id: 6,
        name: "Noise Cancelling Pro",
        price: 229.99,
        image: "images/nhead.png",
        description: "Advanced noise cancellation technology",
        colors: ["Silver", "Black"],
        rating: 4.7,
        stock: 7
    }
];

// Cart Data
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

// DOM Elements
const productContainer = document.getElementById('product-container');
const cartItemsContainer = document.getElementById('cart-items');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartTax = document.getElementById('cart-tax');
const cartTotal = document.getElementById('cart-total');
const cartCount = document.getElementById('cart-count');
const loginBtn = document.getElementById('login-btn');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');
const checkoutBtn = document.getElementById('checkout-btn');

// Modals
const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateCartCount();
    
    if (currentUser) {
        loginBtn.innerHTML = `<i class="fas fa-user"></i> ${currentUser.name}`;
    }
});

// Render Products
function renderProducts() {
    productContainer.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'col-md-4';
        productCard.innerHTML = `
            <div class="card product-card h-100">
                <img src="${product.image}" class="card-img-top product-img" alt="${product.name}">
                <div class="card-body">
                    <h5 class="card-title product-title">${product.name}</h5>
                    <div class="product-rating">
                        ${renderRating(product.rating)}
                        <span class="ms-1">(${product.rating})</span>
                    </div>
                    <p class="card-text">${product.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="product-price">$${product.price.toFixed(2)}</h5>
                        <button class="btn btn-primary add-to-cart" data-id="${product.id}">
                            <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        productContainer.appendChild(productCard);
    });
    
    // Add event listeners to "Add to Cart" buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', addToCart);
    });
}

// Render Rating Stars
function renderRating(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// Add to Cart Function
function addToCart(e) {
    const productId = parseInt(e.target.getAttribute('data-id'));
    const product = products.find(p => p.id === productId);
    
    // Check if product is already in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity++;
        } else {
            alert('Maximum stock reached for this item!');
            return;
        }
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCart();
    showAddedToCartAlert(product.name);
}

// Update Cart
function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCartItems();
    updateCartCount();
}

// Render Cart Items
function renderCartItems() {
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<tr><td colspan="5" class="text-center">Your cart is empty</td></tr>';
        cartSubtotal.textContent = '$0.00';
        cartTax.textContent = '$0.00';
        cartTotal.textContent = '$0.00';
        checkoutBtn.disabled = true;
        return;
    }
    
    let subtotal = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const cartItem = document.createElement('tr');
        cartItem.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <img src="${item.image}" class="cart-item-img me-3" alt="${item.name}">
                    <span>${item.name}</span>
                </div>
            </td>
            <td>$${item.price.toFixed(2)}</td>
            <td>
                <div class="d-flex">
                    <button class="btn btn-sm btn-outline-secondary quantity-btn minus" data-id="${item.id}">-</button>
                    <input type="number" class="form-control form-control-sm quantity-input" value="${item.quantity}" min="1" max="${item.stock}" data-id="${item.id}">
                    <button class="btn btn-sm btn-outline-secondary quantity-btn plus" data-id="${item.id}">+</button>
                </div>
            </td>
            <td>$${itemTotal.toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-danger remove-item" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        cartItemsContainer.appendChild(cartItem);
    });
    
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    
    cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    cartTax.textContent = `$${tax.toFixed(2)}`;
    cartTotal.textContent = `$${total.toFixed(2)}`;
    checkoutBtn.disabled = false;
    
    // Add event listeners to quantity buttons
    document.querySelectorAll('.minus').forEach(button => {
        button.addEventListener('click', decreaseQuantity);
    });
    
    document.querySelectorAll('.plus').forEach(button => {
        button.addEventListener('click', increaseQuantity);
    });
    
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', updateQuantity);
    });
    
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', removeItem);
    });
}

// Update Cart Count
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = count;
}

// Quantity Functions
function decreaseQuantity(e) {
    const productId = parseInt(e.target.getAttribute('data-id'));
    const item = cart.find(item => item.id === productId);
    
    if (item.quantity > 1) {
        item.quantity--;
    } else {
        cart = cart.filter(item => item.id !== productId);
    }
    
    updateCart();
}

function increaseQuantity(e) {
    const productId = parseInt(e.target.getAttribute('data-id'));
    const item = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);
    
    if (item.quantity < product.stock) {
        item.quantity++;
    } else {
        alert('Maximum stock reached for this item!');
    }
    
    updateCart();
}

function updateQuantity(e) {
    const productId = parseInt(e.target.getAttribute('data-id'));
    const newQuantity = parseInt(e.target.value);
    const item = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);
    
    if (newQuantity >= 1 && newQuantity <= product.stock) {
        item.quantity = newQuantity;
    } else {
        e.target.value = item.quantity;
        alert(`Quantity must be between 1 and ${product.stock}`);
    }
    
    updateCart();
}

function removeItem(e) {
    const productId = parseInt(e.target.getAttribute('data-id'));
    cart = cart.filter(item => item.id !== productId);
    updateCart();
}

// Show Added to Cart Alert
function showAddedToCartAlert(productName) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success position-fixed top-0 end-0 m-3';
    alert.style.zIndex = '9999';
    alert.style.transition = 'opacity 0.5s';
    alert.innerHTML = `
        <i class="fas fa-check-circle me-2"></i>
        ${productName} added to cart!
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.style.opacity = '0';
        setTimeout(() => alert.remove(), 500);
    }, 2000);
}

// Login/Register Functions
loginBtn.addEventListener('click', () => {
    if (currentUser) {
        // Show user dropdown or profile page
        alert(`Welcome back, ${currentUser.name}!`);
    } else {
        loginModal.show();
    }
});

showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.hide();
    registerModal.show();
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerModal.hide();
    loginModal.show();
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Simple validation (in a real app, you would check against a database)
    if (email && password) {
        currentUser = {
            name: email.split('@')[0],
            email: email
        };
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        loginModal.hide();
        loginBtn.innerHTML = `<i class="fas fa-user"></i> ${currentUser.name}`;
        alert('Login successful!');
    } else {
        alert('Please enter both email and password');
    }
});

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    
    if (password !== confirm) {
        alert('Passwords do not match!');
        return;
    }
    
    if (name && email && password) {
        currentUser = {
            name: name,
            email: email
        };
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        registerModal.hide();
        loginBtn.innerHTML = `<i class="fas fa-user"></i> ${currentUser.name}`;
        alert('Registration successful! You are now logged in.');
    } else {
        alert('Please fill all fields');
    }
});

// Checkout Function
checkoutBtn.addEventListener('click', () => {
    if (!currentUser) {
        cartModal.hide();
        loginModal.show();
        return;
    }
    
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    // In a real app, you would process payment here
    alert(`Order placed successfully! Total: ${cartTotal.textContent}`);
    cart = [];
    updateCart();
    cartModal.hide();
});

// Open cart modal when clicking cart button
document.querySelector('a[href="#cart"]').addEventListener('click', (e) => {
    e.preventDefault();
    cartModal.show();
});