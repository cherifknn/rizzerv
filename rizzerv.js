/***********************************************************
 * rizzerv.js
 * - Swipe-based filter and selection
 * - Up to 4 selections
 * - Thumbnails in "footer" bar (fixed at bottom)
 * - Clicking a thumbnail => scroll to card
 ************************************************************/

// Core DOM elements
const selectButton = document.getElementById("selectButton");
const pageHome = document.getElementById("page-home");
const pageList = document.getElementById("page-list");
const swipeContainer = document.getElementById("swipeContainer");
const sendButton = document.getElementById("sendButton");

// Filter elements
const filterButton = document.getElementById("filterButton");
const filterPanel = document.getElementById("filterPanel");
const descriptionSearch = document.getElementById("descriptionSearch");
const applyFilterButton = document.getElementById("applyFilterButton");
const clearFilterButton = document.getElementById("clearFilterButton");

// Thumbnails container
const selectedImages = document.getElementById("selectedImages");

let selectedRestaurants = [];
const MAX_SELECTION = 4;

// Keep all restaurants + filtered subset
let allRestaurants = [];
let filteredRestaurants = [];

// Current card index
let currentIndex = 0;

/**
 * "Select Restaurants" button (Home page)
 */
selectButton.addEventListener("click", () => {
  // Hide home page, show list page (with header/footer)
  pageHome.classList.add("hidden");
  pageList.classList.remove("hidden");

  window.scrollTo(0, 0);

  // Fetch CSV
  fetchRestaurants();
});

/**
 * Fetch CSV data
 */
function fetchRestaurants() {
  const csvFilePath = "restaurants.csv";
  fetch(csvFilePath)
    .then(response => response.text())
    .then(csvData => {
      allRestaurants = parseCSV(csvData);
      filteredRestaurants = allRestaurants.slice();
      renderRestaurantCards(filteredRestaurants);
      populateCategorySelect(allRestaurants);
      displayCurrentCard();
    })
    .catch(err => console.error("Error fetching CSV:", err));
}

/************************************************************
 * CSV Parsing
 * Columns: 0) name, 1) photo_1, 3) description_short, 
 * 4) neighborhood, 5) source1, 9) category
 ************************************************************/
function parseCSV(csvString) {
  const lines = csvString.trim().split("\n");
  lines.shift(); // remove header

  const result = [];
  for (let line of lines) {
    const fields = parseCSVLine(line);
    if (fields.length < 10) continue;

    result.push({
      name: fields[0].trim(),
      photo_1: fields[1].trim(),
      description_short: fields[3].trim(),
      neighborhood: fields[4].trim(),
      source1: fields[5].trim(),
      category: fields[9].trim(),
    });
  }
  return result;
}

/**
 * Parse a single CSV line, respecting quotes
 */
function parseCSVLine(line) {
  let inQuotes = false;
  let field = "";
  const fields = [];

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(field);
      field = "";
    } else {
      field += char;
    }
  }
  fields.push(field);
  return fields.map(f => f.trim());
}

/************************************************************
 * Render restaurant cards into swipe-container
 ************************************************************/
function renderRestaurantCards(restaurants) {
  swipeContainer.innerHTML = "";

  restaurants.forEach((r, index) => {
    const card = document.createElement("div");
    card.classList.add("restaurant-card");
    card.dataset.index = index; // For reference

    // Image
    const img = document.createElement("img");
    img.src = r.photo_1;
    img.alt = r.name;

    // Content
    const content = document.createElement("div");
    content.classList.add("card-content");

    const title = document.createElement("div");
    title.classList.add("card-title");
    title.textContent = r.name;

    const meta = document.createElement("div");
    meta.classList.add("card-meta");
    meta.textContent = `${r.category} | ${r.neighborhood} | ${r.source1}`;

    const desc = document.createElement("div");
    desc.classList.add("card-description");
    desc.textContent = r.description_short;

    content.appendChild(title);
    content.appendChild(meta);
    content.appendChild(desc);

    card.appendChild(img);
    card.appendChild(content);

    swipeContainer.appendChild(card);
  });
}

/************************************************************
 * Populate category select dropdown
 ************************************************************/
function populateCategorySelect(rests) {
  const categories = new Set();
  rests.forEach(r => {
    if (r.category) categories.add(r.category);
  });
  const sortedCats = Array.from(categories).sort();

  categorySelect.innerHTML = "";

  // "All Categories"
  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "All Categories";
  categorySelect.appendChild(allOption);

  sortedCats.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

/************************************************************
 * Display the current card based on currentIndex
 ************************************************************/
function displayCurrentCard() {
  const cards = swipeContainer.querySelectorAll(".restaurant-card");
  cards.forEach((card, index) => {
    if (index === currentIndex) {
      card.style.display = "block";
      card.classList.remove("swipe-left", "swipe-right");
      addSwipeListeners(card);
    } else {
      card.style.display = "none";
    }
  });
}

/************************************************************
 * Add swipe event listeners to a card
 ************************************************************/
function addSwipeListeners(card) {
  let startX = 0;
  let startY = 0;
  let isSwiping = false;

  // Touch events
  card.addEventListener("touchstart", touchStart);
  card.addEventListener("touchmove", touchMove);
  card.addEventListener("touchend", touchEnd);

  // Mouse events
  card.addEventListener("mousedown", mouseStart);
  card.addEventListener("mousemove", mouseMove);
  card.addEventListener("mouseup", mouseEnd);
  card.addEventListener("mouseleave", mouseEnd);

  function touchStart(e) {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    isSwiping = true;
  }

  function touchMove(e) {
    if (!isSwiping) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    // Optional: Visual feedback during swipe
    card.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${deltaX * 0.05}deg)`;
  }

  function touchEnd(e) {
    if (!isSwiping) return;
    isSwiping = false;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startX;
    handleSwipe(deltaX);
  }

  function mouseStart(e) {
    startX = e.clientX;
    startY = e.clientY;
    isSwiping = true;
  }

  function mouseMove(e) {
    if (!isSwiping) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    // Optional: Visual feedback during swipe
    card.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${deltaX * 0.05}deg)`;
  }

  function mouseEnd(e) {
    if (!isSwiping) return;
    isSwiping = false;
    const deltaX = e.clientX - startX;
    handleSwipe(deltaX);
  }

  /**
   * Handle swipe based on deltaX
   */
  function handleSwipe(deltaX) {
    const swipeThreshold = 100; // Minimum px needed for a swipe
    const cards = swipeContainer.querySelectorAll(".restaurant-card");

    if (deltaX > swipeThreshold) {
      // Swiped Right - Select
      card.classList.add("swipe-right");
      addToSelection(currentIndex);
    } else if (deltaX < -swipeThreshold) {
      // Swiped Left - Skip
      card.classList.add("swipe-left");
      // No action needed for skip
    } else {
      // Not a valid swipe - reset position
      card.style.transform = "";
      return;
    }

    // After animation, show next card
    card.addEventListener("transitionend", onTransitionEnd, { once: true });
  }

  /**
   * After swipe animation ends
   */
  function onTransitionEnd() {
    const cards = swipeContainer.querySelectorAll(".restaurant-card");
    card.style.display = "none";
    card.style.transform = "";
    currentIndex++;
    if (currentIndex < cards.length) {
      displayCurrentCard();
    } else {
      // No more cards
      alert("You've gone through all the restaurants!");
    }
  }
}

/************************************************************
 * Add restaurant to selection and update thumbnails
 ************************************************************/
function addToSelection(index) {
  if (selectedRestaurants.length >= MAX_SELECTION) {
    alert(`You can only select up to ${MAX_SELECTION} restaurants.`);
    return;
  }

  const restaurant = filteredRestaurants[index];
  if (!selectedRestaurants.some(r => r.name === restaurant.name)) {
    selectedRestaurants.push(restaurant);
    addThumbnail(restaurant);
  }

  // Show/hide Send button
  sendButton.style.display = selectedRestaurants.length > 0 ? "block" : "none";
}

/**
 * Create and append thumbnail image
 */
function addThumbnail(restaurant) {
  const thumb = document.createElement("img");
  thumb.src = restaurant.photo_1;
  thumb.alt = restaurant.name;
  thumb.id = `thumbnail-${slugify(restaurant.name)}`;

  // Click => scroll to card
  thumb.addEventListener("click", (e) => {
    e.stopPropagation();
    const cardToScroll = swipeContainer.querySelector(`.restaurant-card[data-index="${filteredRestaurants.indexOf(restaurant)}"]`);
    if (cardToScroll) {
      // Simulate smooth scrolling by setting currentIndex and displaying the card
      cardToScroll.style.display = "block";
      cardToScroll.classList.remove("swipe-left", "swipe-right");
      addSwipeListeners(cardToScroll);
      currentIndex = filteredRestaurants.indexOf(restaurant);
      displayCurrentCard();
      highlightCard(cardToScroll);
    }
  });

  selectedImages.appendChild(thumb);
}

/**
 * Optional: highlight the card briefly
 */
function highlightCard(cardElement) {
  cardElement.style.transition = "box-shadow 0.5s ease-out";
  const originalBoxShadow = cardElement.style.boxShadow;
  cardElement.style.boxShadow = "0 0 10px 2px rgba(255, 200, 0, 0.8)";

  setTimeout(() => {
    cardElement.style.boxShadow = originalBoxShadow || "none";
  }, 1000);
}

/************************************************************
 * Helper: slugify for safe IDs
 ************************************************************/
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/************************************************************
 * Filter Logic based on description_short
 ************************************************************/
applyFilterButton.addEventListener("click", () => {
  const query = descriptionSearch.value.trim().toLowerCase();
  filterPanel.classList.add("hidden");
  currentIndex = 0;
  selectedRestaurants = [];
  selectedImages.innerHTML = "";
  sendButton.style.display = "none";

  if (query === "") {
    filteredRestaurants = allRestaurants.slice();
  } else {
    filteredRestaurants = allRestaurants.filter(r => 
      r.description_short.toLowerCase().includes(query)
    );
  }
  renderRestaurantCards(filteredRestaurants);
  displayCurrentCard();
});

clearFilterButton.addEventListener("click", () => {
  descriptionSearch.value = "";
  filterPanel.classList.add("hidden");
  currentIndex = 0;
  selectedRestaurants = [];
  selectedImages.innerHTML = "";
  sendButton.style.display = "none";
  filteredRestaurants = allRestaurants.slice();
  renderRestaurantCards(filteredRestaurants);
  displayCurrentCard();
});

// Toggle filter panel visibility
filterButton.addEventListener("click", () => {
  filterPanel.classList.toggle("hidden");
});

/************************************************************
 * Send Button
 ************************************************************/
sendButton.addEventListener("click", () => {
  if (selectedRestaurants.length === 0) {
    alert("Please select at least one restaurant.");
    return;
  }
  const names = selectedRestaurants.map(r => r.name).join(", ");
  alert(`You selected: ${names}`);

  // Example: POST to server
  /*
  fetch("/submit-selections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selected: selectedRestaurants })
  })
    .then(res => res.json())
    .then(data => console.log("Server response:", data))
    .catch(err => console.error("Error:", err));
  */
});
