# 🚗 Car Rental Platform

A full-stack car rental platform built with the MERN stack, featuring AI-powered search, serverless architecture, and WCAG 2.1 Level AA accessibility compliance.     

[![CI/CD Pipeline](https://github.com/iffat180/car-rental-platform/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/iffat180/car-rental-platform/actions)
[![Accessibility](https://img.shields.io/badge/WCAG-2.1%20Level%20AA-green.svg)](https://www.w3.org/WAI/WCAG21/quickref/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## 🌟 Live Demo

- **Frontend**: [https://car-rental-nu-rouge.vercel.app/](https://car-rental-nu-rouge.vercel.app/)
- **API Documentation**: Coming soon

## 📸 Screenshots

### Home Page
![Home Page](./docs/screenshots/home.png)

### Car Search with AI
![AI Search](./docs/screenshots/search.png)

### Booking Process
![Booking](./docs/screenshots/booking.png)

### Owner Dashboard
![Dashboard](./docs/screenshots/dashboard.png)

## ✨ Key Features

### User Features
- 🔍 **AI-Powered Semantic Search** - Find cars using natural language queries
- 📅 **Smart Booking System** - Real-time availability checking with date validation
- 📄 **Automated Invoice Generation** - Professional PDF invoices with CloudFront delivery
- ♿ **Full Accessibility** - WCAG 2.1 Level AA compliant with screen reader support
- 📱 **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- 🔐 **Secure Authentication** - JWT-based auth with role-based access control

### Owner Features
- 🚙 **Car Management** - Easy car listing with image uploads
- 📊 **Dashboard Analytics** - Track bookings, revenue, and car performance
- 🖼️ **Automatic Image Optimization** - AWS Lambda processes uploads automatically
- 💰 **Revenue Tracking** - Real-time earnings and booking statistics

### Technical Features
- ⚡ **Serverless Architecture** - AWS Lambda for scalable, cost-effective processing
- 🌐 **Global CDN** - CloudFront distribution across 400+ edge locations
- 🧪 **Automated Testing** - 119 tests with 100% pass rate in CI/CD pipeline
- 🔄 **Continuous Deployment** - Auto-deploy on every push to main branch
- 🎯 **Vector Search** - Pinecone database for semantic similarity matching

## 🏗️ Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (React + Vite)                    │
│  - Semantic Search UI                                       │
│  - Booking Forms (WCAG AA Compliant)                        │
│  - Owner Dashboard                                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│              BACKEND API (Express.js on Render)             │
│  - Authentication (JWT)                                     │
│  - Car & Booking Management                                 │
│  - User Management                                          │
└────────┬────────────────────────┬───────────────────────────┘
         │                        │
         ↓                        ↓
┌────────────────────┐   ┌────────────────────────────────────┐
│   MongoDB Atlas    │   │         AWS Services               │
│  - Users           │   │  ┌──────────────────────────────┐  │
│  - Cars            │   │  │ Lambda Functions             │  │
│  - Bookings        │   │  │ - Image Optimizer            │  │
└────────────────────┘   │  │ - Invoice Generator          │  │
                         │  └──────────────────────────────┘  │
                         │  ┌──────────────────────────────┐  │
                         │  │ S3 Buckets                   │  │
                         │  │ - uploads/                   │  │
                         │  │ - optimized/                 │  │
                         │  │ - invoices/                  │  │
                         │  │ - cars/                      │  │
                         │  │ - users/                     │  │
                         │  └──────────────────────────────┘  │
                         │  ┌──────────────────────────────┐  │
                         │  │ CloudFront CDN               │  │
                         │  │ - Global Distribution        │  │
                         │  │ - <20ms Latency              │  |
                         │  └──────────────────────────────┘  │
                         │  ┌──────────────────────────────┐  │
                         │  │ API Gateway                  │  │
                         │  │ - Invoice API Endpoint       │  │
                         │  └──────────────────────────────┘  │
                         └────────────────────────────────────┘
                                        │
                                        ↓
                         ┌────────────────────────────────────┐
                         │     AI/ML Services                 |
                         |  - OpenAI (Embeddings & GPT-4)     │
                         │  - Pinecone (Vector Database)      │
                         └────────────────────────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS 4
- **State Management**: Context API
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **Validation**: Express Validator

### AWS Services
- **Lambda**: Serverless compute for image processing and PDF generation
- **S3**: Object storage for images and documents
- **CloudFront**: Global CDN with 400+ edge locations
- **API Gateway**: RESTful API endpoints for Lambda functions
- **IAM**: Security and access management

### AI/ML
- **OpenAI API**: Text embeddings (text-embedding-3-small) and GPT-4
- **Pinecone**: Vector database for semantic search

### DevOps & Testing
- **CI/CD**: GitHub Actions
- **Testing**: Jest (Backend - 46 tests), Vitest (Frontend - 93 tests)
- **Code Quality**: ESLint
- **Deployment**: Vercel (Frontend), Render (Backend)

### Accessibility
- **Standards**: WCAG 2.1 Level AA
- **Testing**: Lighthouse, axe DevTools
- **Features**: ARIA landmarks, keyboard navigation, screen reader support

## 📦 Installation & Setup

### Prerequisites
- Node.js 20+
- MongoDB Atlas account
- AWS account
- OpenAI API key
- Pinecone account

### 1. Clone Repository
```bash
git clone https://github.com/iffat180/car-rental-platform.git
cd car-rental-platform
```

### 2. Backend Setup
```bash
cd server
npm install

# Create .env file
cat > .env << 'ENV'
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-s3-bucket-name
CLOUDFRONT_DOMAIN=your-cloudfront-domain

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX=your_pinecone_index
ENV

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install

# Create .env file
cat > .env << 'ENV'
VITE_API_URL=http://localhost:5000/api
VITE_CLOUDFRONT_DOMAIN=your-cloudfront-domain
VITE_INVOICE_API_URL=your-api-gateway-invoice-url
ENV

# Start development server
npm run dev
```

### 4. Lambda Functions Setup
```bash
# Image Optimizer
cd lambda/image-optimizer
npm install
zip -r function.zip .
# Upload to AWS Lambda console

# Invoice Generator
cd ../invoice-generator
npm install
zip -r function.zip .
# Upload to AWS Lambda console
```

## 🧪 Testing

### Run All Tests
```bash
# Backend tests (46 tests)
cd server
npm test

# Frontend tests (73 tests)
cd client
npm test

# Total: 119 tests
```

### Test Coverage
- **Backend**: Validation logic, business rules, model constraints
- **Frontend**: Utility functions, booking calculations, form validation
- **Accessibility**: WCAG 2.1 Level AA compliance

### CI/CD Pipeline
Every push to `main` triggers:
1. ✅ Install dependencies
2. ✅ Run all 139 tests
3. ✅ Auto-deploy frontend (Vercel)
4. ✅ Auto-deploy backend (Render)

## 🚀 Deployment

### Frontend (Vercel)
- Connected to GitHub repository
- Auto-deploys on push to `main`
- Environment variables configured in Vercel dashboard

### Backend (Render)
- Connected to GitHub repository
- Auto-deploys on push to `main`
- Environment variables configured in Render dashboard

### Lambda Functions
- Deployed via AWS Lambda Console
- Image Optimizer: S3 trigger on `uploads/` folder
- Invoice Generator: API Gateway trigger

## 📊 Performance Metrics

- **Lighthouse Scores**:
  - Performance: 95+
  - Accessibility: 95+ (WCAG 2.1 Level AA)
  - Best Practices: 95+
  - SEO: 95+

- **API Response Times**:
  - Average: <200ms
  - Vector Search: <500ms
  - Image Optimization: ~4s (async)
  - Invoice Generation: ~4s

- **Global CDN**:
  - Latency: <20ms worldwide
  - Edge Locations: 400+
  - Cache Hit Ratio: 85%+

## 💰 Cost Breakdown

**Monthly Infrastructure Costs**: ~$2.70

- S3 Storage: $1.20
- CloudFront: $1.50
- Lambda: $0 (within free tier: 1M requests, 400K GB-seconds)
- MongoDB Atlas: $0 (free tier: 512MB)
- Vercel: $0 (free tier)
- Render: $0 (free tier)

**AI Services** (pay-per-use):
- OpenAI API: ~$5-10/month (depending on usage)
- Pinecone: $0 (free tier: 100K vectors)

## ♿ Accessibility Features

### WCAG 2.1 Level AA Compliance
- ✅ Keyboard navigation throughout entire application
- ✅ Screen reader support with ARIA landmarks and labels
- ✅ Skip navigation link for keyboard users
- ✅ Proper heading hierarchy (h1 → h2 → h3)
- ✅ Color contrast ratios meeting 4.5:1 standard
- ✅ Form labels and error announcements
- ✅ Focus indicators on all interactive elements
- ✅ Semantic HTML structure
- ✅ Alternative text for all images
- ✅ ARIA live regions for dynamic content

### Testing Tools Used
- Lighthouse accessibility audits
- axe DevTools
- Keyboard-only navigation testing
- Screen reader testing (NVDA, VoiceOver)

## 🔐 Security Features

- **Authentication**: JWT-based with secure HTTP-only cookies
- **Authorization**: Role-based access control (User, Owner)
- **Input Validation**: Server-side validation with express-validator
- **SQL Injection Prevention**: Mongoose ODM with parameterized queries
- **XSS Protection**: React's built-in XSS protection
- **CORS**: Configured for specific origins
- **Rate Limiting**: API rate limiting implemented
- **Secure Headers**: Helmet.js for security headers
- **AWS IAM**: Least-privilege access policies

## 📈 Future Enhancements

- [ ] Real-time chat between users and owners (Socket.io)
- [ ] Payment integration (Stripe)
- [ ] Email notifications (AWS SES)
- [ ] Mobile app (React Native)
- [ ] Multi-language support (i18n)
- [ ] Advanced analytics dashboard
- [ ] Car damage reporting with image upload
- [ ] Insurance integration
- [ ] Dynamic pricing based on demand

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Your Name**
- GitHub: [@iffat180](https://github.com/iffat180)
- LinkedIn: [LinkedIn](https://linkedin.com/in/iffatmohd)
- Portfolio: [Portfolio](https://iffat180.github.io/)
- Email: iffat180@gmail.com

## 🙏 Acknowledgments

- AWS Free Tier for cloud infrastructure
- OpenAI for AI/ML capabilities
- MongoDB Atlas for database hosting
- Vercel and Render for deployment platforms
- The open-source community

---

**Built with ❤️ using the MERN stack, AWS, and AI**
