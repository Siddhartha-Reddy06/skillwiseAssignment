# Inventory Management System

A full-stack inventory management application built with Node.js/Express (backend) and React (frontend).

## Features

- ✅ Product CRUD operations
- ✅ Search and filter products by name and category
- ✅ Inline editing of products
- ✅ Import/Export products via CSV
- ✅ Inventory history tracking
- ✅ Responsive design
- ✅ Stock status indicators (In Stock/Out of Stock)

## Project Structure

```
taskfd/
├── backend/
│   ├── routes/
│   │   └── products.js
│   ├── uploads/
│   ├── db.js
│   ├── server.js
│   ├── package.json
│   └── .gitignore
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── .gitignore
├── sample-products.csv
├── .gitignore
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults to localhost:5000):
```env
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Products
- `GET /api/products` - Get all products (supports pagination, sorting, filtering)
- `GET /api/products/:id` - Get single product
- `GET /api/products/search?name={query}` - Search products by name
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/:id/history` - Get inventory history for a product
- `GET /api/products/categories/list` - Get unique categories

### Import/Export
- `POST /api/products/import` - Import products from CSV file
- `GET /api/products/export` - Export all products as CSV

## CSV Import Format

The CSV file should have the following columns (case-insensitive):
- `name` (required)
- `unit`
- `category`
- `brand`
- `stock` (default: 0)
- `status`
- `image`

Example:
```csv
name,unit,category,brand,stock,status
Product 1,kg,Electronics,Brand A,100,Active
Product 2,pieces,Clothing,Brand B,50,Active
```

## Technologies Used

### Backend
- Node.js
- Express.js
- SQLite3
- Multer (file uploads)
- CSV Parser
- Express Validator

### Frontend
- React
- Axios
- React Router DOM
- CSS3 (Responsive Design)

## Database Schema

### Products Table
- `id` (INTEGER PRIMARY KEY)
- `name` (TEXT UNIQUE NOT NULL)
- `unit` (TEXT)
- `category` (TEXT)
- `brand` (TEXT)
- `stock` (INTEGER NOT NULL)
- `status` (TEXT)
- `image` (TEXT)

### Inventory History Table
- `id` (INTEGER PRIMARY KEY)
- `product_id` (INTEGER, FOREIGN KEY)
- `old_quantity` (INTEGER)
- `new_quantity` (INTEGER)
- `change_date` (TEXT)
- `user_info` (TEXT)

## Deployment

### Backend Deployment (Render/Heroku/etc.)
1. Set environment variables if needed
2. Ensure `npm start` script is configured
3. Note: SQLite may not persist on some platforms - consider PostgreSQL for production

### Frontend Deployment (Netlify/Vercel)
1. Build the React app: `npm run build`
2. Update `REACT_APP_API_URL` to point to your deployed backend
3. Deploy the `build` folder

## License

ISC

