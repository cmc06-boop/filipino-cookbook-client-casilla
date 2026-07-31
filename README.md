# Filipino Cookbook Client

## 1. Application Title

**Filipino Cookbook Client**

A web-based client application that consumes the Filipino Cookbook REST API and presents Filipino food information through an interactive user interface.

---

## 2. Application Description

### Purpose

This client application serves as a driver program that retrieves Filipino food information from a classmate's REST API. It demonstrates how a front-end application can consume secured API endpoints, process JSON responses, and display the data in a readable format without accessing the API developer's database directly.

### API Used

This application uses the **Filipino Cookbook API** developed by **Lizhary Ylexis C. Gomez**. All data is retrieved through HTTP API requests using the Fetch API. The client does **not** connect directly to the API developer's MySQL database.

### Major Features

- **Home** — Displays the API welcome message and note retrieved from `GET /api`
- **Foods** — Browse all Filipino foods with category filter chips
- **Categories** — View all food categories and foods under each category
- **Ingredients** — Browse all available ingredients
- **Search** — Search foods by name from the header search bar
- **Random Food** — Display a randomly selected food item
- **Add Food** — Submit a new food record to the API via a form

### Intended Users

- Students completing API integration laboratory activities
- Users who want to explore Filipino recipes through a web interface
- Anyone learning how to build a client application that consumes a REST API

---

## 3. Technologies Used

| Category | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 |
| Programming | JavaScript (Vanilla) |
| API Communication | Fetch API |
| Data Format | JSON |
| Local Server | XAMPP (Apache) |
| API Server | PHP Built-in Server (classmate's API) |

---

## 4. Installation Instructions

### Prerequisites

- XAMPP or any local web server
- The Filipino Cookbook API (by Lizhary Ylexis Gomez) installed and running
- A valid API token matching the API's `config.php`

### Step 1: Clone the repository

```bash
git clone https://github.com/cmc06-boop/filipino-cookbook-client-casilla.git
cd filipino-cookbook-client-casilla
```
```
C:\xampp\htdocs\filipino-cookbook-client-casilla
```

### Step 2: Start the API server

Clone and run the classmate's API first:

```bash
git clone https://github.com/Yelsxii/filipino-cookbook-api-gomez.git
cd filipino-cookbook-api-gomez
composer install
```

**Windows:**
```powershell
copy config.example.php config.php
```

Edit `config.php` with your database credentials and API token, then start the server:

```bash
php -S 127.0.0.1:8080 -t public
```

### Step 3: Configure the client

Copy the example configuration file:

**Windows:**
```powershell
copy js\config.example.js js\config.js
```

Edit `js/config.js`:

```javascript
const API_CONFIG = {
    baseUrl: "http://127.0.0.1:8080",
    token: "YOUR_API_TOKEN"
};
```

Replace `YOUR_API_TOKEN` with the same token value configured in the API's `config.php`.

> **Note:** `js/config.js` is listed in `.gitignore` and must not be committed to a public repository.

### Step 4: Run the client application

Open in a browser:

```
http://localhost/filipino-cookbook-client-casilla/
```

Ensure the API server is running before using the client.

---

## 5. API Endpoints Used

All secured endpoints require the following headers:

```
Authorization: Bearer YOUR_API_TOKEN
Accept: application/json
```

| Method | Endpoint | Description | Used In |
|---|---|---|---|
| `GET` | `/api` | Returns the API welcome message and note | Home page |
| `GET` | `/api/foods` | Returns all foods with category, origin, instructions, and ingredients | Foods page |
| `GET` | `/api/foods/{id}` | Returns full details for one food item | Food details modal |
| `GET` | `/api/foods/search/{name}` | Searches foods by name (case-insensitive) | Search feature |
| `GET` | `/api/categories` | Returns all food categories | Categories page, Foods filter, Add Food form |
| `GET` | `/api/categories/{id}/foods` | Returns foods belonging to a specific category | Category filter, Category modal |
| `GET` | `/api/ingredients` | Returns all ingredients | Ingredients page, Add Food form |
| `GET` | `/api/foods/random` | Returns one randomly selected food | Random food feature |
| `POST` | `/api/foods` | Adds a new food record with validation | Add Food form |

### Example: GET /api/foods

**Request:**

```
GET http://127.0.0.1:8080/api/foods
Authorization: Bearer YOUR_API_TOKEN
Accept: application/json
```

**Response:**

```json
[
  {
    "food_id": 11,
    "food_name": "Lumpiang Shanghai",
    "category_name": "Appetizer",
    "origin_name": "Philippines",
    "instructions": "Mix ground pork, vegetables, and egg. Wrap in spring roll wrappers and deep-fry until golden brown.",
    "ingredients": ["Carrots", "Egg", "Garlic", "Ground pork", "Onion", "Spring roll wrapper"]
  }
]
```

### Example: POST /api/foods

**Request body:**

```json
{
  "food_name": "New Dish",
  "category_id": 1,
  "origin_id": 1,
  "instructions": "Prepare and cook.",
  "ingredient_ids": [1, 2]
}
```

**Success response:**

```json
{
  "status": "success",
  "message": "Food added successfully."
}
```

---

## 6. Screenshots

### Home Page

![Home Page](Screenshots/Welcome%20Public%20Route.png)

*Welcome message and note loaded programmatically from GET /api.*

### Foods Page

![Foods Page](Screenshots/Foods%20Page.png)

*Food cards retrieved from GET /api/foods with category filter chips.*

### Food Details

![Food Details](Screenshots/Food%20Details.png)

*Full food details displayed from GET /api/foods/{id}.*

### Categories

![Categories](Screenshots/Categories.png)

*Category list from GET /api/categories.*

### Food Per Category

![Food Per Category](Screenshots/Food%20Per%20Category.png)

*Foods under a selected category from GET /api/categories/{id}/foods.*

### Ingredients

![Ingredients](Screenshots/Ingredients.png)

*Ingredient grid from GET /api/ingredients.*

### Empty Search

![Empty Search](Screenshots/Empty%20Search.png)

*No matching results from GET /api/foods/search/{name} when the search term is invalid or not found.*

### Food Search

![Food Search](Screenshots/Food%20Search.png)

*Search results displayed from GET /api/foods/search/{name} when a matching food is found.*

### Random Food

![Random Food](Screenshots/Random%20Pick.png)

*Random food displayed from GET /api/foods/random.*

### Add Food

![Add Food](Screenshots/Add%20New%20Food.png)

*Add Food form for submitting data via POST /api/foods.*

### Add Food Success

![Add Food Success](Screenshots/Added%20Successfully.png)

*Success confirmation after a valid POST /api/foods request.*

### Invalid Token (Error Testing)

![Invalid Token](Screenshots/Invalid%20Token.png)

*Error message displayed when an invalid API token is used.*

### API Offline (Error Testing)

![API Offline](Screenshots/API%20Offline.png)

*Error message displayed when the API server is not running or unreachable.*

---

## 7. API Source and Acknowledgment

### API Source

This client application uses the Filipino Cookbook API developed by:

**Developer:** Lizhary Ylexis C. Gomez  
**Course & Section:** Information Technology - 4B  
**GitHub Username:** Yelsxii  
**GitHub Repository:** https://github.com/Yelsxii/filipino-cookbook-api-gomez.git

The API is used for educational purposes with the permission of the developer.

### Client Developer

**Client developed by:** Cherry Lyn M. Casilla

---

## Project Structure

```
filipino-cookbook-client-casilla/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── config.js              (local only, gitignored)
│   └── config.example.js
├── images/
├── Screenshots/
├── .gitignore
└── README.md
```

## Security Notes

- API tokens are stored in `js/config.js`, which is excluded from version control via `.gitignore`.
- Only `js/config.example.js` with placeholder values is included in the repository.
- The client communicates exclusively through HTTP API endpoints and does not access the API developer's database directly.
- JSON responses are processed and displayed through UI elements — raw JSON is never shown as final output.
