# Coffee Shop Customer Service Chatbot Application

A full-stack e-commerce platform for Merry's Way Coffee Shop, featuring an AI-powered customer service chatbot, secure payment processing, and comprehensive admin management capabilities. Built as part of CMPE 280 final project at San Jose State University.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Technologies](#technologies)
- [Team](#team)
- [Documentation](#documentation)
- [License](#license)

---

## 🎯 Overview

This project is a complete e-commerce solution that combines a modern React frontend with an intelligent Python-based chatbot backend. The system provides:

- **Customer-facing features**: Product browsing, shopping cart, wishlist, secure checkout, and order management
- **AI-powered chatbot**: Multi-agent system that handles customer queries, product recommendations, and order processing
- **Admin capabilities**: Comprehensive dashboard for managing products, orders, and users
- **Secure authentication**: Firebase-based user authentication with role-based access control
- **Payment processing**: Integrated Stripe payment gateway for secure transactions

---

## 🏗️ Architecture

### Data Flow

1. **User Interaction**: Customer interacts with React frontend
2. **Authentication**: Firebase Auth validates user credentials
3. **Product Browsing**: Products loaded from Firebase Realtime Database
4. **Chatbot Queries**: User messages sent to RunPod API
5. **Agent Processing**: Multi-agent system processes queries:
   - Guard Agent filters inappropriate content
   - Classification Agent routes to appropriate handler
   - Specialized agents (Details, Order, Recommendation) generate responses
6. **Vector Search**: Details Agent queries Pinecone for relevant product information
7. **Order Processing**: Orders stored in Firebase, payments processed via Stripe
8. **Admin Management**: Admin dashboard manages products, orders, and users

<img width="1024" height="572" alt="image" src="https://github.com/user-attachments/assets/ee253b96-264c-4d45-bd85-15b2b26a2e7b" />


## ✨ Features

### Customer Features
- 🔐 **User Authentication**: Secure signup, login, and password recovery
- 🛍️ **Product Catalog**: Browse products with search and filtering
- 🛒 **Shopping Cart**: Add, remove, and manage cart items
- ❤️ **Wishlist**: Save favorite products for later
- 💳 **Secure Checkout**: Stripe-integrated payment processing
- 📦 **Order History**: Track past orders and their status
- 👤 **User Profile**: Manage personal information and preferences
- 🤖 **AI Chatbot**: Intelligent customer service assistant

### Admin Features
- 📊 **Admin Dashboard**: Comprehensive management interface
- 📝 **Product Management**: Add, edit, and delete products
- 📋 **Order Management**: View and process customer orders
- 👥 **User Management**: Monitor and manage user accounts
- 📈 **Analytics**: View sales and order statistics

### AI Chatbot Capabilities
- 🛡️ **Content Filtering**: Blocks inappropriate or off-topic queries
- 🎯 **Intent Classification**: Routes queries to appropriate handlers
- 📚 **Product Q&A**: Answers questions using vector search
- 🛒 **Order Assistance**: Guides users through ordering process
- 💡 **Recommendations**: Provides product recommendations using Apriori algorithm and popularity data

---

## 📁 Project Structure

```
coffee_shop_customer_service_chatbot/
│
├── frontend/                    # React TypeScript frontend application
│   ├── src/                     # Source code
│   │   ├── components/          # Reusable React components
│   │   ├── pages/               # Page components
│   │   ├── contexts/            # React Context providers
│   │   ├── services/            # API service functions
│   │   ├── config/              # Configuration files
│   │   ├── hooks/               # Custom React hooks
│   │   ├── types/               # TypeScript type definitions
│   │   └── utils/               # Utility functions
│   ├── public/                  # Static assets
│   ├── dist/                    # Production build output
│   └── README.md                # Frontend documentation
│
├── python_code/                 # Python backend and AI chatbot
│   ├── api/                     # Serverless API code
│   │   ├── agents/              # AI agent implementations
│   │   │   ├── guard_agent.py
│   │   │   ├── classification_agent.py
│   │   │   ├── details_agent.py
│   │   │   ├── order_taking_agent.py
│   │   │   ├── recommendation_agent.py
│   │   │   └── utils.py
│   │   ├── recommendation_objects/  # Precomputed recommendation data
│   │   ├── agent_controller.py     # Agent orchestration
│   │   ├── main.py                 # RunPod handler entrypoint
│   │   ├── development_code.py     # Local testing CLI
│   │   └── Dockerfile              # Container build configuration
│   ├── products/                # Product data and images
│   ├── dataset/                 # CSV datasets for analytics
│   ├── build_vector_database.ipynb  # Vector database setup
│   ├── firebase_uploader.ipynb     # Firebase data upload
│   └── README.md                # Backend documentation
│
└── README.md                    # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (3.10 or higher)
- **npm** or **yarn**
- **Firebase Account** (for authentication and database)
- **Stripe Account** (for payment processing)
- **RunPod Account** (for chatbot API deployment)
- **Pinecone Account** (for vector database)

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/deepakkumarsjsu/Coffee-Chatbot-Application.git
   cd Coffee-Chatbot-Application
   ```

2. **Set up the Frontend:**
   ```bash
   cd frontend
   npm install
   # Create .env file with Firebase, Stripe, and RunPod credentials
   npm run dev
   ```
   See [Frontend README](frontend/README.md) for detailed setup instructions.

3. **Set up the Backend:**
   ```bash
   cd python_code
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   pip install -r api/requirements.txt
   # Create api/.env file with RunPod and Pinecone credentials
   ```
   See [Backend README](python_code/README.md) for detailed setup instructions.

4. **Deploy the Chatbot API:**
   - Build Docker image: `docker build -t coffee-chatbot-api python_code/api/`
   - Deploy to RunPod serverless endpoint
   - Configure environment variables in RunPod dashboard

5. **Set up Vector Database:**
   - Run `build_vector_database.ipynb` to generate embeddings
   - Upload vectors to Pinecone index

6. **Upload Product Data:**
   - Run `firebase_uploader.ipynb` to upload products to Firebase

For detailed setup instructions, refer to the individual README files in the `frontend/` and `python_code/` directories.

---

## 🛠️ Technologies

### Frontend Stack
- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Firebase**: Authentication, database, and storage
- **Stripe**: Payment processing
- **React Hook Form + Zod**: Form handling and validation

### Backend Stack
- **Python 3.10+**: Programming language
- **RunPod**: Serverless API hosting
- **Pinecone**: Vector database for semantic search
- **Docker**: Containerization
- **Jupyter Notebooks**: Data pipeline scripts

### AI/ML Stack
- **LLM API**: RunPod-hosted language model
- **Embeddings**: Vector embeddings for semantic search
- **Apriori Algorithm**: Association rule mining for recommendations
- **Multi-Agent System**: Specialized agents for different tasks

### Infrastructure
- **Firebase**: Backend-as-a-Service (Auth, Database, Storage)
- **Stripe**: Payment gateway
- **RunPod**: Serverless compute for AI API
- **Pinecone**: Managed vector database
- **GitHub**: Version control and collaboration

---

## 👥 Team

This project was developed by a team of three members for CMPE 280 at San Jose State University:

- **Person 1**: Frontend authentication, admin features, profile management
- **Person 2**: Product catalog, cart, wishlist, order management
- **Person 3**: Chatbot integration, payment processing, voice features

### Development Timeline

- **Sprint 1** (October 19 - November 1, 2025): Authentication, initial agents, product catalog
- **Sprint 2** (November 2-15, 2025): Cart, wishlist, chat interface, profile management
- **Sprint 3** (November 16-29, 2025): Admin dashboard, order history, chatbot agents
- **Sprint 4** (November 30 - December 6, 2025): UI/UX polish, performance optimization, testing

---

## 📚 Documentation

- **[Frontend Documentation](frontend/README.md)**: Complete guide for the React frontend application
- **[Backend Documentation](python_code/README.md)**: Complete guide for the Python backend and AI chatbot

### Key Documentation Sections

#### Frontend
- Setup and installation
- Firebase configuration
- Stripe integration
- Component structure
- API integration
- Building for production

#### Backend
- Agent architecture
- Vector database setup
- RunPod deployment
- Docker configuration
- Local development
- Testing guidelines

---

## 🔒 Security

- **Authentication**: Firebase Auth with email/password
- **Authorization**: Role-based access control (Admin/User)
- **Payment Security**: Stripe PCI-compliant payment processing
- **API Security**: Environment variables for sensitive credentials
- **Content Filtering**: Guard agent prevents inappropriate queries

---

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm run lint        # Lint code
npm run build       # Build for production
npm run preview     # Preview production build
```

### Backend Testing
```bash
cd python_code/api
python development_code.py  # Local CLI testing
```

### Performance Testing
- Lighthouse audits for frontend performance
- Accessibility audits (WCAG compliance)
- API response time monitoring

---

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Connection Errors**
   - Verify `.env` file configuration
   - Check Firebase project status
   - Review database security rules

2. **Stripe Payment Failures**
   - Ensure test mode keys are used in development
   - Verify backend payment API is running
   - Check network connectivity

3. **Chatbot API Errors**
   - Verify RunPod endpoint is deployed
   - Check environment variables in RunPod dashboard
   - Review API logs for errors

4. **Vector Search Issues**
   - Confirm Pinecone index exists and is populated
   - Verify embeddings were generated with correct model
   - Check namespace configuration

For more detailed troubleshooting, refer to the individual README files.

---

## 📝 License

Academic/class project use for CMPE 280. Update if redistributing.

---

## 🤝 Contributing

This is an academic project. For questions or issues, please contact the development team.

---

## 🙏 Acknowledgments

- **San Jose State University** - CMPE 280 Course
- **Firebase** - Backend infrastructure
- **Stripe** - Payment processing
- **RunPod** - AI API hosting
- **Pinecone** - Vector database service

---

**Built with ❤️ for Merry's Way Coffee Shop**

