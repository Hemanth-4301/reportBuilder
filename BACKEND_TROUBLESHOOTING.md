# Backend Troubleshooting Guide

## Current Issue
The server starts successfully but cannot connect to MySQL database with error:
```
Access denied for user 'root'@'localhost' (using password: NO)
```

## Solutions (Try in Order)

### 1. Install and Start MySQL (if not installed)

#### Option A: MySQL Community Server
1. Download MySQL Community Server from: https://dev.mysql.com/downloads/mysql/
2. Install with default settings
3. During installation, set root password to: `Karthi216`
4. Start MySQL service

#### Option B: XAMPP (Easier Option)
1. Download XAMPP from: https://www.apachefriends.org/
2. Install XAMPP
3. Open XAMPP Control Panel
4. Start MySQL service
5. Click "Admin" next to MySQL to open phpMyAdmin
6. Create a new user or set root password to `Karthi216`

### 2. Verify MySQL is Running
Open Command Prompt and run:
```bash
mysql -u root -p
```
Enter password: `Karthi216`

If this works, MySQL is running correctly.

### 3. Create Database and Tables
Once MySQL is running, execute the setup script:

#### Option A: Using MySQL Command Line
```bash
mysql -u root -p < setup_database.sql
```

#### Option B: Using phpMyAdmin (if using XAMPP)
1. Open phpMyAdmin (http://localhost/phpmyadmin)
2. Click "Import" tab
3. Choose the `setup_database.sql` file
4. Click "Go"

### 4. Test the Server
After setting up the database:

```bash
cd "M:\Desktop\Open-sourse repos\repoBuilder\server"
node server.js
```

You should see:
```
🚀 Server running on port 5000
🌐 Health check: http://localhost:5000/api/health
✅ MySQL connection successful!
✅ Database synchronized
```

### 5. Alternative: Use SQLite (No MySQL Required)

If you don't want to install MySQL, I can modify the server to use SQLite instead:

1. Install SQLite dependency:
```bash
npm install sqlite3
```

2. I'll modify the server configuration to use SQLite

## Environment Variables Check

Your `.env` file should look like this (no quotes around password):
```
PORT=5000
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=Karthi216
MYSQL_DATABASE=manufacturing_reports
```

## Testing Database Connection

Once everything is set up, test these endpoints:
- http://localhost:5000/api/health - Server health check
- http://localhost:5000/api/database/collections - Available data tables
- http://localhost:5000/api/database/fields/production - Production table fields

## Common Issues and Solutions

### Issue: "Access denied for user 'root'"
**Solution:** Verify MySQL root password is set to `Karthi216`

### Issue: "Can't connect to MySQL server"
**Solution:** MySQL service is not running. Start MySQL service.

### Issue: "Unknown database 'manufacturing_reports'"
**Solution:** Run the `setup_database.sql` script to create the database.

### Issue: "Table doesn't exist"
**Solution:** Run the `setup_database.sql` script to create tables and sample data.

## Need Help?
If you're still having issues, let me know:
1. Which MySQL installation method you used
2. What error messages you're seeing
3. Whether you can connect to MySQL from command line

I can also help you switch to SQLite if you prefer a simpler database setup.