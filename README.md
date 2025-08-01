# 📝 Note-Taking Application

A modern, full-stack note-taking application built with React, Django, and PostgreSQL. Features real-time collaboration, markdown support, and comprehensive note management capabilities.

![Note App Demo](https://img.shields.io/badge/Status-Active-brightgreen)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### 🎯 Core Functionality
- **📝 Rich Text Editor**: Full markdown support with live preview
- **🏷️ Smart Tagging**: Organize notes with custom tags
- **🔍 Advanced Search**: Search through titles, content, and tags
- **👥 Note Sharing**: Share notes with other users with customizable permissions
- **🔒 Privacy Controls**: Private, shared, and public note visibility options
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices

### 🚀 Advanced Features
- **⚡ Real-time Updates**: Live collaboration and updates
- **🎨 Markdown Rendering**: Enhanced markdown support with syntax highlighting
- **🔗 Public Links**: Generate shareable public links for notes
- **📊 Dashboard Analytics**: View note statistics and activity
- **🌙 Modern UI**: Clean, intuitive interface with smooth animations
- **🔐 User Authentication**: Secure login and registration system

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API communication

### Backend  
- **Django** - Python web framework
- **Django REST Framework** - API development
- **JWT Authentication** - Secure token-based auth

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## 🚀 Quick Start

### Prerequisites
Make sure you have the following installed on your system:
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/abel-hid/note-app.git
   ```

2. **Navigate to the project directory**
   ```bash
   cd note-app
   ```

3. **Build and start the application**
   ```bash
   docker compose up --build
   ```
   
   This command will:
   - Build all necessary Docker images
   - Start the sqlite3 database
   - Launch the Django backend server
   - Start the React frontend development server
   - Set up the reverse proxy

4. **Access the application**
   
   Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```

### 🎉 That's it! 
Your note-taking application should now be running locally.

## 📖 Usage Guide

### Getting Started
1. **Create an Account**: Register with your email and username
2. **Login**: Use your credentials to access the dashboard
3. **Create Your First Note**: Click the "Create Note" button and start writing

### Note Management
- **📝 Creating Notes**: Use the rich markdown editor with live preview
- **🏷️ Adding Tags**: Type tags separated by commas for better organization  
- **🔒 Setting Visibility**:
  - **Private**: Only you can see the note
  - **Shared**: Share with specific users
- **✏️ Editing**: Click on any note to view and edit (with proper permissions)

### Collaboration Features
- **👥 Share Notes**: Share notes with other users in the system
- **📊 Dashboard**: View all your notes, shared notes, create notes


