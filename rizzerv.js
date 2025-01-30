/***********************************************************
 * rizzerv.js
 * - Filter logic
 * - Up to 4 selections
 * - Thumbnails in "footer" bar (now fixed at bottom)
 * - Clicking a thumbnail => scroll to card
 ************************************************************/

// Core DOM elements
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

// Thumbnails container
const selectedImages = document.getElementById("selectedImages");

let selectedRestaurants = [];
const MAX_SELECTION = 4;

// Keep all restaurants + filtered subset
let allRestaurants = [];
let filteredRestaurants = [];

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
      renderRestaurantList(filteredRestaurants);
      populateCategorySelect(allRestaurants);
    })
    .catch(err => console.error("Error fetching CSV:", err));
}

/************************************************************
 * CSV Parsing
 * Columns: 0) name, 1) photo_1, 3) desc_short, 4) neighborhood, 5) source1, 9) category
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
 * Render restaurant cards
 ************************************************************/
function renderRestaurantList(restaurants) {
  restaurantList.innerHTML = "";

  restaurants.forEach(r => {
    const card = document.createElement("div");
    card.classList.add("restaurant-card");

    // ID to scroll to
    const cardId = `card-${slugify(r.name)}`;
    card.id = cardId;

    // Mark selected if in array
    if (selectedRestaurants.some(sel => sel.name === r.name)) {
      card.classList.add("selected");
    }

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

    // Toggle selection on click
    card.addEventListener("click", () => {
      toggleSelection(card, r);
    });

    restaurantList.appendChild(card);
  });
}

/************************************************************
 * Toggle selection => add or remove thumbnail in fixed footer
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
      thumb.id = `thumbnail-${slugify(data.name)}`;

      // Click => scroll to card
      thumb.addEventListener("click", (e) => {
        e.stopPropagation();
        const cardToScroll = document.getElementById(`card-${slugify(data.name)}`);
        if (cardToScroll) {
          cardToScroll.scrollIntoView({ behavior: "smooth", block: "center" });
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

  // Show/hide Send button
  sendButton.style.display = selectedRestaurants.length > 0 ? "block" : "none";
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

  sortedCats.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

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
