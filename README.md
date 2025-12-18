# HEALTHHUB Backend API

A comprehensive healthcare platform backend built with Node.js, Express, and Supabase.

## Features

- User authentication and profile management
- Doctor search and management
- Appointment booking system
- Medical products marketplace
- Order management
- AI-powered medical report summarization
- Role-based access control (patient, admin)
- Secure JWT authentication via Supabase

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Upload**: Multer

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3000
SUMMARIZER_SERVICE_URL=http://localhost:5000
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Authentication

#### Register User
- **POST** `/api/auth/register`
- Body: `{ email, password, name, role? }`
- Role: 'patient' (default) or 'admin'

#### Login
- **POST** `/api/auth/login`
- Body: `{ email, password }`

#### Logout
- **POST** `/api/auth/logout`
- Requires: Authentication

#### Get Current User
- **GET** `/api/auth/me`
- Requires: Authentication

### User Management

#### Get User Profile
- **GET** `/api/users/me`
- Requires: Authentication

#### Update User Profile
- **PUT** `/api/users/me`
- Body: `{ name }`
- Requires: Authentication

### Doctors

#### List All Doctors
- **GET** `/api/doctors`
- Query params: `specialty`, `hospital`
- Requires: Authentication

#### Get Doctor by ID
- **GET** `/api/doctors/:id`
- Requires: Authentication

#### Create Doctor
- **POST** `/api/doctors`
- Body: `{ name, specialty, hospital, languages?, profile_image?, rating? }`
- Requires: Admin role

#### Update Doctor
- **PUT** `/api/doctors/:id`
- Body: Any doctor fields to update
- Requires: Admin role

#### Delete Doctor
- **DELETE** `/api/doctors/:id`
- Requires: Admin role

### Appointments

#### Create Appointment
- **POST** `/api/appointments`
- Body: `{ doctor_id, date_time }`
- Requires: Authentication

#### Get User Appointments
- **GET** `/api/appointments/user/:userId`
- Requires: Authentication (own appointments) or Admin role

#### Delete Appointment
- **DELETE** `/api/appointments/:id`
- Requires: Authentication (own appointment) or Admin role

### Products

#### List Products
- **GET** `/api/products`
- Query params: `available`
- Requires: Authentication

#### Get Product by ID
- **GET** `/api/products/:id`
- Requires: Authentication

#### Create Product
- **POST** `/api/products`
- Body: `{ title, description, price, image_url?, available? }`
- Requires: Admin role

#### Update Product
- **PUT** `/api/products/:id`
- Body: Any product fields to update
- Requires: Admin role

#### Delete Product
- **DELETE** `/api/products/:id`
- Requires: Admin role

### Orders

#### Create Order
- **POST** `/api/orders`
- Body: `{ products: [{ product_id, quantity }] }`
- Requires: Authentication

#### Get User Orders
- **GET** `/api/orders/user/:userId`
- Requires: Authentication (own orders) or Admin role

### AI Summarization

#### Summarize Medical Report
- **POST** `/api/summarize`
- Body: `{ report_text }` or Form-data with `report` file
- Requires: Authentication

#### Get User Summaries
- **GET** `/api/summarize`
- Requires: Authentication

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your_supabase_access_token>
```

## Database Schema

### Tables
- **profiles**: User profiles linked to Supabase auth.users
- **doctors**: Healthcare provider information
- **appointments**: Scheduled appointments
- **products**: Medical products for marketplace
- **orders**: Customer orders
- **order_items**: Individual items in orders
- **report_summaries**: AI-generated medical report summaries

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- Admins have full access to all data
- Public data (doctors, products) is accessible to authenticated users

## Error Handling

All endpoints return appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## External Services

### AI Summarization Service

The backend integrates with an external AI summarization microservice. Configure the service URL in the environment variables:

```
SUMMARIZER_SERVICE_URL=http://your-summarizer-service-url
```

The service should accept POST requests to `/summarize` with:
```json
{
  "text": "medical report text"
}
```

And return:
```json
{
  "summary": "AI-generated summary"
}
```

## Development

The backend uses ES modules (type: "module" in package.json). All imports should use the `.js` extension.

## License

Private
