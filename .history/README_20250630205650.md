# Talabak Admin Dashboard

A modern, responsive admin dashboard for managing the Talabak marketplace platform. This dashboard connects to the backend server at `t3h.dracode.org` and provides comprehensive management tools for products, users, categories, and reports.

## 🚀 Features

- **Real-time Backend Connection**: Connected to `https://t3h.dracode.org/api`
- **Authentication System**: Secure login with JWT tokens and automatic refresh
- **Product Management**: Create, edit, delete, and manage product listings
- **User Management**: View, block/unblock, and manage user accounts
- **Category Management**: Organize products with hierarchical categories
- **Report Management**: Handle user reports and complaints
- **Real-time Status**: Live connection status indicator
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🔧 Backend Connection

The admin dashboard is configured to work with the backend server at:
```
https://t3h.dracode.org/api
```

### Connection Features:
- **Automatic Health Checks**: Monitors server connectivity every 30 seconds
- **Retry Logic**: Automatic retry for failed requests with exponential backoff
- **Token Refresh**: Automatic JWT token refresh when needed
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Visual feedback during API requests

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd talabak-admin-main
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## 🔐 Authentication

### Admin Login
- Navigate to `/login`
- Enter your admin credentials
- The system will automatically redirect you to the dashboard

### Access Control
- **Admin Users**: Full access to all dashboard features
- **Non-Admin Users**: Redirected to account deletion page

## 📊 Dashboard Overview

The dashboard provides real-time statistics and management tools:

### Statistics Cards
- **Server Status**: Live connection status to backend
- **Total Products**: Number of products in the system
- **Active Products**: Currently active product listings
- **Categories**: Number of product categories
- **Users**: Total registered users

### Management Sections
- **Products**: Manage product listings, images, and details
- **Users**: View and manage user accounts, block/unblock users
- **Categories**: Create and manage product categories
- **Reports**: Handle user reports and complaints

## 🔄 API Endpoints

The dashboard connects to the following backend endpoints:

### Authentication
- `POST /auth/login/` - User login
- `POST /auth/token/refresh/` - Refresh JWT tokens

### Products
- `GET /products/` - List all products
- `POST /products/create/` - Create new product
- `PUT /products/{id}/update/` - Update product
- `DELETE /products/{id}/delete/` - Delete product

### Users
- `GET /users/` - List all users
- `GET /users/me/` - Get current user
- `POST /admin-block/` - Block user
- `DELETE /admin-block/{id}/unblock/` - Unblock user

### Categories
- `GET /categories/` - List all categories
- `POST /categories/create/` - Create category
- `PUT /categories/{id}/update/` - Update category
- `DELETE /categories/{id}/delete/` - Delete category

### Reports
- `GET /reports/all` - List all reports
- `PUT /reports/{id}/status/` - Update report status

## 🎨 UI Components

The dashboard uses a modern, accessible design system:

- **Loading Bar**: Shows API request progress
- **Connection Status**: Real-time backend connectivity indicator
- **Data Tables**: Sortable and filterable data displays
- **Modal Dialogs**: Clean, accessible forms and confirmations
- **Responsive Layout**: Adapts to different screen sizes

## 🚨 Error Handling

The dashboard includes comprehensive error handling:

- **Network Errors**: Automatic retry with exponential backoff
- **Authentication Errors**: Automatic token refresh or logout
- **Validation Errors**: User-friendly error messages
- **Server Errors**: Graceful degradation with helpful feedback

## 🔧 Development

### Tech Stack
- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **UI Components**: Custom components with Radix UI primitives
- **Icons**: Lucide React
- **Animations**: Framer Motion

### Project Structure
```
app/
├── (dashboard)/          # Dashboard pages
├── components/           # Reusable components
├── lib/                  # Utilities and API
├── providers/            # Context providers
└── login/               # Authentication pages
```

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software for the Talabak marketplace platform.

---

**Backend Server**: `t3h.dracode.org`  
**API Base URL**: `https://t3h.dracode.org/api`  
**Status**: Production Ready ✅
