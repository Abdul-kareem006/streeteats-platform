# StreetEats B2B Platform

StreetEats is a comprehensive B2B raw material sourcing platform specifically designed to help street food vendors find trusted suppliers, compare prices, and seamlessly manage their daily inventory needs.

## 🚀 Key Features

### For Vendors (Street Food Operators)
- **Smart Price Comparison**: Instantly search for raw materials (e.g., Tomatoes, Rice, Cooking Oil) across all trusted suppliers to find the cheapest options.
- **Supplier Discovery & Trust**: View supplier trust scores based on successful deliveries and minimal complaints. Badges highlight "Highly Trusted Suppliers" and "Best Prices".
- **Cart & Order System**: Persistent cart management with Minimum Order Quantity (MOQ) enforcement and out-of-stock prevention.
- **Order Tracking & Cancellation**: Track order lifecycles (Pending -> Accepted -> Packed -> Delivered) with the ability to cancel pending orders.
- **Smart Reorder Suggestions**: Automatically recommends ingredients based on your past purchase history.
- **Grievance System**: Submit complaints regarding quality, delivery, or payment issues directly.

### For Suppliers (Wholesalers)
- **Inventory Management**: Create and manage raw materials with specific pricing, stock levels, and Minimum Order Quantities (MOQ).
- **Shop Availability Toggle**: Instantly toggle whether you are "Accepting Orders" or "Closed".
- **Real-Time Order Notifications**: The dashboard automatically polls for new orders, alerting you instantly via toast notifications.
- **Order Lifecycle Management**: Streamlined UI to manage incoming orders through acceptance, packing, and final delivery.

### For Admins (Platform Moderators)
- **Trust Enforcement Dashboard**: Dedicated secure dashboard to monitor the entire platform's health.
- **Supplier & Vendor Suspension**: Soft suspend bad actors based on community grievances. Suspended suppliers are instantly removed from vendor searches and cannot receive new orders.

## 🛠️ Tech Stack

- **Frontend**: React.js, Tailwind CSS, Lucide React (Icons), React Router
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (via official Node.js Driver)

## 📦 Getting Started Locally

### Prerequisites
- Node.js (v14 or higher)
- MongoDB running locally or a MongoDB Atlas URI

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Abdul-kareem006/streeteats-platform.git
   cd streeteats-platform
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   # Start the Express server (runs on port 5000 by default)
   npm start
   # Or for development:
   npm run dev
   ```

3. **Frontend Setup**
   Open a new terminal window:
   ```bash
   cd client
   npm install
   # Start the React development server
   npm run dev
   ```

4. **Verify Application**
   The frontend should now be running on `http://localhost:5173` (or similar Vite port), communicating with the backend API on `http://localhost:5000`.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.
