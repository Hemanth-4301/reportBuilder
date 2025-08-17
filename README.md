# Manufacturing Report Builder

A comprehensive drag-and-drop report builder application designed specifically for large-scale manufacturers in industries like CPG, Pharma, Auto, Tire, Battery, and Discrete Value. This application allows users to create custom reports from manufacturing data stored in MongoDB without requiring custom development.

## 🚀 Features

### Core Functionality
- **Drag & Drop Interface**: Intuitive report building with visual data modeling
- **MongoDB Integration**: Pre-seeded database with manufacturing sample data
- **Real-time Visualization**: Charts, tables, and graphs using Chart.js
- **Export Capabilities**: PDF, CSV, and PNG export options
- **AI-Powered Suggestions**: Optional Google Gemini integration for smart recommendations

### Data Sources
- **Production Data**: Product quantities, dates, factories, shifts, and production lines
- **Defects Tracking**: Defect counts, types, severity levels, and inspector information
- **Sales Analytics**: Regional sales data, amounts, channels, and customer information

### Visualization Types
- Interactive data tables with sorting and filtering
- Bar charts for comparing quantities across categories
- Line charts for trend analysis over time
- Pie/Doughnut charts for distribution analysis

### Advanced Features
- **Natural Language Queries**: Describe reports in plain English
- **Data Aggregations**: Sum, count, and average operations
- **Dynamic Filtering**: Date ranges, factories, products, and regions
- **Responsive Design**: Mobile-first design that works on all devices
- **Dark Mode**: Full dark theme support

## 🛠️ Technology Stack

### Frontend
- **React 18+** with functional components and hooks
- **TailwindCSS 3+** for responsive styling
- **Framer Motion** for smooth animations
- **Chart.js & React-ChartJS-2** for data visualization
- **React Beautiful DnD** for drag-and-drop functionality
- **Axios** for API communication

### Backend
- **Node.js 20+** with Express.js 4+
- **MongoDB** with Mongoose ODM
- **Google Generative AI** for intelligent suggestions
- **CORS, Helmet** for security
- **Joi** for input validation

### Additional Libraries
- **jsPDF & html2canvas** for PDF/image exports
- **Papa Parse** for CSV handling
- **React Hot Toast** for notifications
- **Lucide React** for consistent iconography

## 📦 Installation & Setup

### Prerequisites
- Node.js 20+ 
- MongoDB (local or cloud instance)
- Google Gemini API key (optional, for AI features)

### 1. Clone and Install Dependencies

```bash
# Install all dependencies (root, client, and server)
npm run install:all
```

### 2. Environment Configuration

Create a `.env` file in the project root:

```env
MONGODB_URI=mongodb://localhost:27017/manufacturing_reports
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
NODE_ENV=development
```

### 3. Seed the Database

```bash
# Seed MongoDB with sample manufacturing data
cd server && npm run seed
```

This will create:
- 50 production records across multiple factories and products
- 30 defect records with various types and severity levels  
- 40 sales records across different regions and channels

### 4. Start Development Servers

```bash
# Start both frontend and backend concurrently
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 🎯 Usage Guide

### 1. Select Data Sources
- Use the sidebar to browse available MongoDB collections
- Click on collections to select them for your report
- Expand collections to view and select specific fields

### 2. Configure Your Report
- **Drag & Drop**: Reorder selected fields in the canvas
- **Add Filters**: Set date ranges, factory names, product IDs
- **Set Aggregations**: Configure sum, count, or average operations
- **Choose Visualization**: Select from table, bar, line, or pie charts

### 3. Generate Reports
- Click "Generate Report" to process your configuration
- View real-time preview in the preview pane
- Export results as PDF, CSV, or PNG

### 4. AI-Powered Features (Optional)
- **Smart Suggestions**: Get AI recommendations for optimal visualizations
- **Natural Language**: Describe reports in plain English ("Show total production by factory")
- **Automatic Configuration**: AI configures chart settings based on your data

## 🏗️ Project Structure

```
manufacturing-report-builder/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Canvas.jsx
│   │   │   ├── PreviewPane.jsx
│   │   │   └── ...
│   │   ├── services/          # API service layers
│   │   │   ├── databaseService.js
│   │   │   ├── reportsService.js
│   │   │   └── aiService.js
│   │   ├── App.jsx            # Main React component
│   │   └── main.jsx           # React entry point
│   ├── public/
│   └── package.json
├── server/                    # Node.js backend
│   ├── controllers/           # Business logic
│   │   ├── databaseController.js
│   │   ├── reportsController.js
│   │   └── aiController.js
│   ├── models/               # MongoDB schemas
│   │   ├── Production.js
│   │   ├── Defects.js
│   │   └── Sales.js
│   ├── routes/               # API endpoints
│   │   ├── database.js
│   │   ├── reports.js
│   │   └── ai.js
│   ├── utils/
│   │   └── seedDatabase.js   # Database seeding
│   ├── server.js             # Express server
│   └── package.json
├── .env.example              # Environment template
├── package.json              # Root package with scripts
└── README.md
```

## 🔧 API Endpoints

### Database Operations
- `GET /api/database/collections` - Get all available collections
- `GET /api/database/collections/:name/:limit?` - Get collection data
- `POST /api/database/connect-db` - Test database connection

### Report Generation
- `POST /api/reports/generate-report` - Generate report with configuration

### AI Features (Optional)
- `POST /api/ai/suggest-visualization` - Get AI visualization recommendations
- `POST /api/ai/generate-query` - Generate config from natural language

## 🚀 Deployment

### Build for Production

```bash
# Build client for production
npm run build
```

### Production Start

```bash
# Start production server
npm start
```

## 🎨 Design Features

### Responsive Design
- **Mobile-first**: Optimized for screens from 320px to 4K
- **Adaptive Layout**: Sidebar collapses on mobile, touch-friendly interfaces
- **Flexible Grid**: Components reflow based on screen size

### Dark Mode
- **System Preference**: Automatically detects system theme preference
- **Manual Toggle**: Header toggle for theme switching
- **Persistent**: Theme preference saved to localStorage

### Animations & Interactions
- **Framer Motion**: Smooth page transitions and component animations
- **Hover Effects**: Interactive buttons and cards with transform effects
- **Loading States**: Elegant spinners and skeleton loaders

## 🧪 Sample Data

The seeded database includes realistic manufacturing data:

### Production Collection
- Products: PROD-001 through PROD-005
- Factories: Factory-A, Factory-B, Factory-C
- Shifts: Morning, Afternoon, Night
- Production Lines: Line-1 through Line-4
- Quantities: 100-1099 units per record

### Defects Collection
- Defect Types: Cosmetic, Functional, Critical, Minor
- Severity Levels: Low, Medium, High, Critical
- Inspectors: John Doe, Jane Smith, Bob Johnson, Alice Brown

### Sales Collection
- Regions: North America, Europe, Asia Pacific, South America, Middle East
- Channels: Direct, Retail, Online, Distributor
- Sales Representatives: Mike Wilson, Sarah Davis, Tom Anderson, Lisa Garcia

## 🔒 Security Features

- **CORS Configuration**: Controlled cross-origin requests
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Joi schema validation
- **Helmet.js**: Security headers
- **Environment Variables**: Sensitive data protection

## 📱 Mobile Experience

- **Touch Optimized**: Large touch targets and gesture support
- **Responsive Navigation**: Collapsible sidebar with backdrop
- **Mobile Charts**: Optimized chart sizing for mobile screens
- **Swipe Gestures**: Natural mobile interactions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Ensure MongoDB is running
mongod --dbpath /path/to/your/db

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/manufacturing_reports
```

**AI Features Not Working**
```bash
# Add Gemini API key to .env
GEMINI_API_KEY=your_actual_api_key_here

# AI features are optional and will show fallback messages if not configured
```

**Port Already in Use**
```bash
# Change port in .env
PORT=3001

# Or kill process using the port
lsof -ti:5000 | xargs kill -9
```

**Build Failures**
```bash
# Clear node_modules and reinstall
rm -rf node_modules client/node_modules server/node_modules
rm package-lock.json client/package-lock.json server/package-lock.json
npm run install:all
```

## 📞 Support

For support, create an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ for manufacturing excellence** 🏭