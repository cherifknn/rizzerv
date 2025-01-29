/***********************************************************
 * rizzerv.js — Full Code:
 * - Filter logic
 * - Up to 4 selections
 * - Thumbnails at bottom-right
 * - Clicking a thumbnail scrolls to the card
 ************************************************************/

// Grab core DOM elements
const selectButton = document.getElementById("selectButton");
const pageHome = document.getElementById("page-home");
const pageList = document.getElementById("page-list");
const restaurantList = document.getElementById("restaurantList");
const sendButton = document.getElementById("sendButton");

// Filter elements
const filterButton = document.getElementById("filterButton");
const filterPanel = document.getElementById("filterPanel");
const categorySelect = document.getElementById("categorySelect");
const applyFilterButton = document.getElementById("applyFilterButton");

// Thumbnails container for selected restaurants
const selectedImages = document.getElementById("selectedImages");

// Track selections
let selectedRestaurants = [];
const MAX_SELECTION = 4;

// Store all restaurants and the filtered subset
let allRestaurants = [];
let filteredRestaurants = [];

/**
 * Handle "Select Restaurants" button (Home Page)
 */
selectButton.addEventListener("click", () => {
  // Hide home page, show list page
  pageHome.classList.add("hidden");
  pageList.classList.remove("hidden");

  // Scroll to top
  window.scrollTo(0, 0);

  // Fetch CSV and display
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
      filteredRestaurants = allRestaurants.slice(); // copy
      renderRestaurantList(filteredRestaurants);
      populateCategorySelect(allRestaurants);
    })
    .catch(err => console.error("Error fetching CSV:", err));
}

/************************************************************
 * CSV Parsing
 * Columns used:
 *  0) name
 *  1) photo_1
 *  3) description_short
 *  4) neighborhood
 *  5) source1
 *  9) category
 ************************************************************/
function parseCSV(csvString) {
  const lines = csvString.trim().split("\n");
  lines.shift(); // remove header

  const result = [];
  for (let line of lines) {
    const fields = parseCSVLine(line);
    if (fields.length < 10) continue; // ensure enough columns

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
 * Render list of restaurants
 ************************************************************/
function renderRestaurantList(restaurants) {
  restaurantList.innerHTML = "";

  restaurants.forEach(r => {
    // Create the card
    const card = document.createElement("div");
    card.classList.add("restaurant-card");

    // Give each card a unique ID for scrolling
    const cardId = `card-${slugify(r.name)}`;
    card.id = cardId;

    // Mark if already selected
    if (selectedRestaurants.some(sel => sel.name === r.name)) {
      card.classList.add("selected");
    }

    // Add image
    const img = document.createElement("img");
    img.src = r.photo_1;
    img.alt = r.name;

    // Content container
    const content = document.createElement("div");
    content.classList.add("card-content");

    // Title
    const title = document.createElement("div");
    title.classList.add("card-title");
    title.textContent = r.name;

    // Meta info
    const meta = document.createElement("div");
    meta.classList.add("card-meta");
    meta.textContent = `${r.category} | ${r.neighborhood} | ${r.source1}`;

    // Description
    const desc = document.createElement("div");
    desc.classList.add("card-description");
    desc.textContent = r.description_short;

    content.appendChild(title);
    content.appendChild(meta);
    content.appendChild(desc);

    card.appendChild(img);
    card.appendChild(content);

    // Toggle selection on click
    card.addEventListener("click", () => {
      toggleSelection(card, r);
    });

    restaurantList.appendChild(card);
  });
}

/************************************************************
 * Toggle selection + Thumbnails
 ************************************************************/
function toggleSelection(cardElement, data) {
  const isSelected = cardElement.classList.contains("selected");

  if (!isSelected) {
    // Select
    if (selectedRestaurants.length < MAX_SELECTION) {
      cardElement.classList.add("selected");
      selectedRestaurants.push(data);

      // Create thumbnail
      const thumb = document.createElement("img");
      thumb.src = data.photo_1;
      thumb.alt = data.name;

      // ID for easy removal
      thumb.id = `thumbnail-${slugify(data.name)}`;

      // Scroll back to card if clicked
      thumb.addEventListener("click", (e) => {
        // Prevent thumbnail click from toggling selection
        e.stopPropagation();

        // Scroll to the card
        const cardToScroll = document.getElementById(`card-${slugify(data.name)}`);
        if (cardToScroll) {
          cardToScroll.scrollIntoView({ behavior: "smooth", block: "center" });
          // Optionally, briefly highlight the card
          highlightCard(cardToScroll);
        }
      });

      selectedImages.appendChild(thumb);

    } else {
      alert(`You can only select up to ${MAX_SELECTION} restaurants.`);
    }
  } else {
    // Deselect
    cardElement.classList.remove("selected");
    selectedRestaurants = selectedRestaurants.filter(r => r.name !== data.name);

    // Remove thumbnail
    const thumbToRemove = document.getElementById(`thumbnail-${slugify(data.name)}`);
    if (thumbToRemove) {
      thumbToRemove.remove();
    }
  }

  // Show/hide "Send" button
  sendButton.style.display = selectedRestaurants.length > 0 ? "block" : "none";
}

/**
 * Optional: highlight the card briefly when scrolling
 */
function highlightCard(cardElement) {
  cardElement.style.transition = "box-shadow 0.5s ease-out";
  const originalBoxShadow = cardElement.style.boxShadow;

  cardElement.style.boxShadow = "0 0 10px 2px rgba(255, 200, 0, 0.8)";

  // Revert after 1 second
  setTimeout(() => {
    cardElement.style.boxShadow = originalBoxShadow || "none";
  }, 1000);
}

/************************************************************
 * Helper: slugify() for valid element IDs
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
 * Filter Logic
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

  // Each category
  sortedCats.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

/**
 * Apply filter
 */
applyFilterButton.addEventListener("click", () => {
  filterPanel.classList.add("hidden");
  const selectedCat = categorySelect.value;

  if (!selectedCat) {
    filteredRestaurants = allRestaurants.slice();
  } else {
    filteredRestaurants = allRestaurants.filter(r => r.category === selectedCat);
  }
  renderRestaurantList(filteredRestaurants);
});

/**
 * Toggle filter panel
 */
filterButton.addEventListener("click", () => {
  filterPanel.classList.toggle("hidden");
});

/************************************************************
 * "Send" button
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