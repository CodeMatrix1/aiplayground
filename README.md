# AI Playground - Multi-Modal AI Tasks

A comprehensive Next.js application that provides multi-modal AI-powered capabilities including conversation analysis, image analysis, document summarization, and URL summarization. Built with Next.js, MongoDB, and OpenAI APIs.

## 🚀 Features

### 🔊 Conversation Analysis
- **Speech-to-Text**: Upload audio files (MP3, WAV, M4A, FLAC, OGG) for transcription using OpenAI Whisper
- **Speaker Diarization**: Identify and separate different speakers in conversations (up to 2 speakers)
- **Conversation Summary**: AI-powered summarization of conversation content
- **Real-time Processing**: Live audio playback and processing status updates

### 🖼️ Image Analysis
- **Detailed Descriptions**: Generate comprehensive textual descriptions of images
- **Object Detection**: Identify objects and elements within images
- **Color Analysis**: Extract dominant colors from images
- **Tag Generation**: Create relevant tags for image categorization
- **Multiple Formats**: Support for JPEG, PNG, GIF, BMP, WebP

### 📄 Document Summarization
- **PDF Processing**: Extract and summarize content from PDF files
- **Word Document Support**: Handle DOC and DOCX files
- **Key Points Extraction**: Identify main points and topics
- **Metadata Analysis**: Extract document information (pages, word count, etc.)
- **Smart Truncation**: Handle large documents efficiently

### 🌐 URL Summarization
- **Web Content Extraction**: Scrape and analyze web page content
- **Content Summarization**: Generate concise summaries of web articles
- **Metadata Extraction**: Extract title, author, reading time, and word count
- **Key Points**: Identify main topics and key points from web content

### 🔐 Authentication & Security
- **NextAuth.js Integration**: Secure authentication with Google OAuth and credentials
- **Protected API Routes**: All endpoints require authentication
- **User Session Management**: Persistent user sessions
- **Task History**: Track and manage user's processing history

### 📊 Task Management
- **Real-time Status**: Track processing status (Pending, Processing, Completed, Failed)
- **Task History**: View and filter past tasks by type and status
- **Metadata Storage**: Store file information, processing results, and metadata
- **Error Handling**: Comprehensive error handling and user feedback

## 🛠️ Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **Tailwind CSS**: Utility-first CSS framework
- **React Dropzone**: File upload handling
- **Lucide React**: Icon library
- **React Hot Toast**: Toast notifications

### Backend
- **Next.js API Routes**: Server-side API endpoints
- **Prisma**: Database ORM with MongoDB
- **NextAuth.js**: Authentication framework
- **OpenAI API**: AI-powered text and image analysis
- **Whisper API**: Speech-to-text transcription

### Database
- **MongoDB**: NoSQL database for data persistence
- **Prisma Client**: Type-safe database queries

### Infrastructure
- **Docker**: Containerization for all services
- **Docker Compose**: Multi-service orchestration
- **Nginx**: Reverse proxy with rate limiting
- **Python**: Speaker diarization service

## 📋 Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- MongoDB (or use Docker)
- OpenAI API key
- Google OAuth credentials (optional)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd aiplayground
```

### 2. Environment Setup
Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="mongodb://localhost:27017/aiplayground"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OpenAI
OPENAI_API_KEY="your-openai-api-key-here"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# File Upload
UPLOAD_DIR="./uploads"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push
```

### 5. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 🐳 Docker Deployment

### 1. Build and Run with Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build
```

### 2. Access the Application
- **Application**: http://localhost:3000
- **MongoDB**: localhost:27017
- **Nginx**: http://localhost:80

### 3. Stop Services
```bash
docker-compose down
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MongoDB connection string | Yes |
| `NEXTAUTH_URL` | Application URL for NextAuth | Yes |
| `NEXTAUTH_SECRET` | Secret key for NextAuth | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |

### API Rate Limits

The application includes rate limiting through Nginx:
- **General API**: 10 requests/second
- **File Uploads**: 2 requests/second
- **File Size Limit**: 100MB per upload

## 📁 Project Structure

```
aiplayground/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── upload-audio/         # Audio processing
│   │   ├── upload-image/         # Image analysis
│   │   ├── upload-document/      # Document processing
│   │   ├── summarize-url/        # URL summarization
│   │   └── tasks/                # Task management
│   ├── components/               # React components
│   ├── lib/                      # Utility functions
│   └── globals.css               # Global styles
├── prisma/                       # Database schema
├── scripts/                      # Python scripts
│   ├── diarization.py           # Speaker diarization
│   ├── requirements.txt         # Python dependencies
│   └── Dockerfile.python        # Python service Dockerfile
├── uploads/                      # File upload directory
├── docker-compose.yml           # Docker orchestration
├── Dockerfile                   # Next.js Dockerfile
├── nginx.conf                   # Nginx configuration
└── README.md                    # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get session

### File Processing
- `POST /api/upload-audio` - Process audio files
- `POST /api/upload-image` - Analyze images
- `POST /api/upload-document` - Summarize documents
- `POST /api/summarize-url` - Summarize web content

### Task Management
- `GET /api/tasks` - Get user's task history

All endpoints require authentication and return JSON responses.

## 🔒 Security Features

- **Authentication Required**: All API routes are protected
- **File Upload Validation**: Strict file type and size validation
- **Rate Limiting**: Nginx-based rate limiting
- **CORS Configuration**: Proper CORS headers
- **Input Sanitization**: All inputs are validated and sanitized
- **Error Handling**: Comprehensive error handling without exposing sensitive information

## 🧪 Testing

### Manual Testing
1. **Authentication**: Test sign-in/sign-out functionality
2. **File Uploads**: Test each file type with various sizes
3. **Processing**: Verify AI processing results
4. **Task History**: Check task tracking and filtering

### API Testing
Use tools like Postman or curl to test API endpoints:

```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test file upload (requires authentication)
curl -X POST http://localhost:3000/api/upload-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test-image.jpg"
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MongoDB is running
   - Check DATABASE_URL in environment variables
   - Run `npx prisma generate` and `npx prisma db push`

2. **File Upload Failures**
   - Check file size limits (100MB)
   - Verify supported file formats
   - Ensure uploads directory exists and is writable

3. **Authentication Issues**
   - Verify NEXTAUTH_SECRET is set
   - Check Google OAuth credentials (if using)
   - Clear browser cookies and try again

4. **Docker Issues**
   - Ensure Docker and Docker Compose are installed
   - Check container logs: `docker-compose logs`
   - Rebuild containers: `docker-compose up --build`

### Logs and Debugging

```bash
# View application logs
docker-compose logs app

# View database logs
docker-compose logs mongodb

# View all logs
docker-compose logs -f
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for providing powerful AI APIs
- Next.js team for the excellent framework
- Prisma team for the database toolkit
- The open-source community for various dependencies

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the documentation

---

**Note**: This application requires API keys and may incur costs based on usage. Please review the pricing for OpenAI APIs and other services used.
