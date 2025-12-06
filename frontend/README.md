# Merry's Way Coffee Shop - E-Commerce Platform

A full-featured, modern e-commerce platform for Merry's Way Coffee Shop built with React and TypeScript. This application provides a complete online shopping experience with product browsing, shopping cart, wishlist, order management, secure payments, and an AI-powered customer service chatbot.

## ✨ Features

### 🛍️ E-Commerce Features
- **Product Catalog**: Browse coffee products with categories, search, and filtering
- **Product Details**: Detailed product information with images and descriptions
- **Shopping Cart**: Add, remove, and manage items with quantity controls
- **Wishlist**: Save favorite products for later
- **Order Management**: View order history with status tracking
- **Secure Payments**: Integrated Stripe payment processing
- **Responsive Design**: Beautiful, mobile-first UI that works on all devices

### 👤 User Features
- **Authentication**: Secure login, signup, and password recovery
- **User Profile**: Manage personal information, address, and profile picture
- **Protected Routes**: Secure access to user-specific pages
- **Form Validation**: Comprehensive form validation using React Hook Form + Zod
- **Toast Notifications**: Beautiful, user-friendly notifications

### 🤖 AI Chatbot
- **AI-Powered Support**: Integrated RunPod API for intelligent customer service
- **Real-time Chat**: Interactive chatbot with typing indicators
- **Voice Support**: Voice recognition capabilities
- **Context-Aware**: Understands coffee shop context and product queries

### 🔐 Admin Features
- **Admin Dashboard**: Comprehensive admin panel for managing the shop
- **Product Management**: Add, edit, and delete products
- **Order Management**: View and manage customer orders
- **User Management**: Admin user management capabilities
- **Analytics**: View sales and order statistics

### 🎨 UI/UX Features
- **Modern Design**: Beautiful gradient design with coffee shop theme
- **Smooth Animations**: Elegant fade-in effects and transitions
- **Loading States**: Beautiful loading spinners for better UX
- **Empty States**: Engaging empty state designs for cart and wishlist
- **404 Page**: Custom 404 page with navigation options
- **Accessibility**: ARIA labels and keyboard navigation support

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Firebase Account** (for authentication and database)
- **Stripe Account** (for payment processing)
- **RunPod API** (optional, for chatbot functionality)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your configuration:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   
   # Stripe Configuration
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   VITE_PAYMENT_API_URL=http://localhost:3000/api/payments
   
   # RunPod API (Optional - for chatbot)
   VITE_RUNPOD_API_URL=https://api.runpod.ai/v2/YOUR_ENDPOINT_ID/run
   VITE_RUNPOD_API_KEY=your_runpod_api_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   
   The app will automatically open at `http://localhost:5173`

## 🔧 Configuration

### Firebase Setup

1. **Create a Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add Project" and follow the setup wizard
   - Enable Authentication (Email/Password)
   - Create a Realtime Database
   - Set up Storage for product images

2. **Get Firebase Configuration:**
   - Go to Project Settings → General
   - Scroll down to "Your apps" section
   - Click the web icon (</>) to add a web app
   - Copy the Firebase configuration object

3. **Add to `.env` file:**
   - Add all Firebase configuration values to your `.env` file
   - Make sure to use the `VITE_` prefix for all variables

4. **Set up Database Rules:**
   ```json
   {
     "rules": {
       "users": {
         "$uid": {
           ".read": "$uid === auth.uid",
           ".write": "$uid === auth.uid"
         }
       },
       "products": {
         ".read": true,
         ".write": "auth !== null && root.child('admins').child(auth.uid).exists()"
       },
       "orders": {
         ".read": "auth !== null",
         ".write": "auth !== null"
       },
       "admins": {
         ".read": "auth !== null && root.child('admins').child(auth.uid).exists()",
         ".write": false
       }
     }
   }
   ```

### Stripe Setup

1. **Create a Stripe Account:**
   - Sign up at [Stripe](https://stripe.com)
   - Get your API keys from the Dashboard

2. **Get Publishable Key:**
   - Go to Developers → API keys
   - Copy your Publishable key (starts with `pk_test_` for test mode)
   - Add to `.env` as `VITE_STRIPE_PUBLISHABLE_KEY`

3. **Set up Backend API:**
   - The payment processing requires a backend server
   - Set `VITE_PAYMENT_API_URL` to your backend payment endpoint
   - For local development: `http://localhost:3000/api/payments`

4. **Test Mode:**
   - Use Stripe test cards for development
   - Card: `4242 4242 4242 4242`
   - Any future expiry date and CVC

### RunPod API Setup (Optional - for Chatbot)

1. **Deploy your chatbot API on RunPod:**
   - Follow RunPod documentation to deploy your API
   - Note your endpoint ID and API key

2. **Configure the frontend:**
   - Add `VITE_RUNPOD_API_URL` with your endpoint URL
   - Add `VITE_RUNPOD_API_KEY` with your API key

## 📁 Project Structure

```
frontend/
├── public/
│   └── coffee-icon.svg          # Favicon
├── src/
│   ├── assets/                  # Static assets (images, logos)
│   │   └── bestlogo.jpg
│   ├── components/              # Reusable React components
│   │   ├── AdminProtectedRoute.tsx
│   │   ├── ChatWidget.tsx
│   │   ├── ImageCropModal.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── MessageItem.tsx
│   │   ├── MessageList.tsx
│   │   ├── PaymentModal.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductDetailModal.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── TypingIndicator.tsx
│   ├── config/                  # Configuration files
│   │   ├── firebase.ts          # Firebase configuration
│   │   ├── runpodConfigs.ts    # RunPod API configuration
│   │   └── stripeConfig.ts     # Stripe configuration
│   ├── contexts/               # React Context providers
│   │   ├── AuthContext.tsx     # Authentication context
│   │   ├── CartContext.tsx     # Shopping cart context
│   │   └── WishlistContext.tsx # Wishlist context
│   ├── hooks/                   # Custom React hooks
│   │   └── useVoiceRecognition.ts
│   ├── pages/                   # Page components
│   │   ├── AdminDashboard.tsx   # Admin panel
│   │   ├── Cart.tsx            # Shopping cart page
│   │   ├── ChatRoom.tsx        # Chatbot interface
│   │   ├── ForgotPassword.tsx  # Password recovery
│   │   ├── Home.tsx            # Product catalog/home
│   │   ├── Login.tsx           # Login page
│   │   ├── NotFound.tsx        # 404 page
│   │   ├── OrderHistory.tsx    # Order history page
│   │   ├── Profile.tsx         # User profile page
│   │   ├── Signup.tsx          # Registration page
│   │   └── Wishlist.tsx       # Wishlist page
│   ├── services/                # API service functions
│   │   ├── adminService.ts     # Admin operations
│   │   ├── chatBot.ts          # Chatbot API calls
│   │   ├── ordersService.ts    # Order management
│   │   ├── paymentService.ts   # Payment processing
│   │   └── productsService.ts  # Product operations
│   ├── types/                   # TypeScript type definitions
│   │   └── types.ts
│   ├── utils/                   # Utility functions
│   │   ├── adminCheck.ts       # Admin verification
│   │   ├── debugAdmin.ts       # Admin debugging
│   │   ├── orderExtractor.ts   # Order data extraction
│   │   └── textToSpeech.ts     # Text-to-speech utilities
│   ├── App.tsx                  # Main app component
│   ├── main.tsx                 # Application entry point
│   └── index.css                # Global styles
├── .env.example                 # Environment variables template
├── index.html                   # HTML template
├── package.json                 # Dependencies and scripts
├── tailwind.config.cjs          # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── vite.config.ts               # Vite build configuration
```

## 🛠️ Technologies Used

### Core Framework
- **React 18**: Modern UI library with hooks
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **React Icons**: Icon library (Feather Icons)

### State Management
- **React Context API**: Global state management
- **React Hooks**: useState, useEffect, useContext, etc.

### Forms & Validation
- **React Hook Form**: Performant form library
- **Zod**: TypeScript-first schema validation
- **@hookform/resolvers**: Zod resolver for React Hook Form

### Authentication & Database
- **Firebase Auth**: User authentication
- **Firebase Realtime Database**: Real-time data storage
- **Firebase Storage**: File storage for images

### Payment Processing
- **Stripe**: Payment processing
- **@stripe/stripe-js**: Stripe.js library
- **@stripe/react-stripe-js**: React components for Stripe

### Routing
- **React Router DOM v7**: Client-side routing
- **Protected Routes**: Route protection for authenticated users

### UI/UX
- **React Hot Toast**: Beautiful toast notifications
- **React Easy Crop**: Image cropping functionality

### API & HTTP
- **Axios**: HTTP client for API requests

### AI Integration
- **RunPod API**: AI chatbot integration

## 📸 Screenshots

> **Note**: Add screenshots of your application here to showcase the features and UI.

### Home Page
![Home Page](screenshots/home.png)
*Product catalog with search and filtering*

### Shopping Cart
![Shopping Cart](screenshots/cart.png)
*Shopping cart with order summary*

### Checkout
![Checkout](screenshots/checkout.png)
*Secure payment processing with Stripe*

### User Profile
![Profile](screenshots/profile.png)
*User profile management*

### Admin Dashboard
![Admin Dashboard](screenshots/admin.png)
*Admin panel for managing products and orders*

### Chatbot
![Chatbot](screenshots/chatbot.png)
*AI-powered customer service chatbot*

## 📦 Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory. You can preview the production build with:

```bash
npm run preview
```

The preview server will start at `http://localhost:4173` (or another port if 4173 is in use).

### ⚡ Testing Lighthouse Performance

**Important**: Always test Lighthouse on a **production build**, not the development server. Development builds are not optimized and will show poor performance scores.

1. **Build the production version:**
   ```bash
   npm run build
   ```

2. **Start the preview server:**
   ```bash
   npm run preview
   ```

3. **Run Lighthouse:**
   - Open Chrome DevTools (F12)
   - Go to the "Lighthouse" tab
   - Select the categories you want to test (Performance, Accessibility, Best Practices, SEO)
   - Click "Analyze page load"
   - Wait for the analysis to complete

4. **Expected Scores:**
   - **Performance**: 80+ (with optimizations enabled)
   - **Accessibility**: 90+ (with proper ARIA labels)
   

**Note**: The production build includes:
- Code minification and tree-shaking
- Asset optimization
- Code splitting for better loading performance
- Optimized chunk sizes

## 🧪 Testing

Run the linter to check for code issues:

```bash
npm run lint
```

## 🐛 Troubleshooting

### Firebase Connection Issues
- **Check your `.env` file**: Ensure all Firebase variables are set correctly
- **Verify Firebase project**: Make sure your Firebase project is active
- **Check database rules**: Ensure your database rules allow the operations you're trying to perform
- **Review console**: Check browser console for detailed error messages

### Stripe Payment Issues
- **Check API key**: Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set correctly
- **Verify backend**: Ensure your payment backend API is running
- **Test mode**: Make sure you're using test mode keys and test cards
- **Network**: Check network tab for API call errors

### Build Issues
- **Clear cache**: Delete `node_modules` and `package-lock.json`, then run `npm install`
- **Check Node version**: Ensure you're using Node.js v18 or higher
- **TypeScript errors**: Run `npm run lint` to check for issues

### API Connection Issues
- **Check your `.env` file**: Make sure `VITE_RUNPOD_API_URL` and `VITE_RUNPOD_API_KEY` are set correctly
- **Verify API endpoint**: Ensure your RunPod endpoint is deployed and running
- **Check network**: Verify your internet connection

## 🤖 AI Tool Usage Disclosure

This project was developed with the assistance of AI coding tools. The following AI tools were used during development:

- **Cursor AI**: Used for code generation, refactoring, and debugging assistance
- **ChatGPT/Claude**: Used for architectural decisions, problem-solving, and code review

**Note**: While AI tools were used to accelerate development, all code has been reviewed, tested, and customized to meet the project requirements. The final implementation reflects the development team's understanding and decisions.

## 📝 License

Private project

## 🤝 Support

For issues or questions, please refer to the project documentation or contact the development team.

---

**Built with ❤️ for Merry's Way Coffee Shop**
