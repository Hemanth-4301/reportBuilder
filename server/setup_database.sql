-- Manufacturing Reports Database Setup Script
-- Run this script in MySQL to create the database and sample data

-- Create database
CREATE DATABASE IF NOT EXISTS manufacturing_reports;
USE manufacturing_reports;

-- Create Production table
CREATE TABLE IF NOT EXISTS Production (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    shift VARCHAR(50) NOT NULL,
    productId VARCHAR(100) NOT NULL,
    product_type VARCHAR(100) NOT NULL,
    produced_quantity INT NOT NULL,
    target_quantity INT NOT NULL,
    efficiency_score DECIMAL(5,2) DEFAULT 0.00,
    factory VARCHAR(100) NOT NULL,
    machine_id VARCHAR(50),
    operator_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Defects table
CREATE TABLE IF NOT EXISTS Defects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    productId VARCHAR(100) NOT NULL,
    defect_type VARCHAR(100) NOT NULL,
    defect_count INT NOT NULL,
    severity VARCHAR(50) NOT NULL,
    factory VARCHAR(100) NOT NULL,
    machine_id VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Sales table
CREATE TABLE IF NOT EXISTS Sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_date DATE NOT NULL,
    productId VARCHAR(100) NOT NULL,
    product_type VARCHAR(100) NOT NULL,
    quantity_sold INT NOT NULL,
    revenue DECIMAL(10,2) NOT NULL,
    customer_id VARCHAR(100),
    region VARCHAR(100),
    sales_rep VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data for Production
INSERT INTO Production (date, shift, productId, product_type, produced_quantity, target_quantity, efficiency_score, factory, machine_id, operator_id) VALUES
('2024-01-15', 'Day', 'PROD-001', 'Widget A', 850, 900, 94.44, 'Factory North', 'M-001', 'OP-101'),
('2024-01-15', 'Night', 'PROD-001', 'Widget A', 780, 900, 86.67, 'Factory North', 'M-001', 'OP-102'),
('2024-01-16', 'Day', 'PROD-002', 'Widget B', 920, 1000, 92.00, 'Factory South', 'M-002', 'OP-103'),
('2024-01-16', 'Night', 'PROD-002', 'Widget B', 880, 1000, 88.00, 'Factory South', 'M-002', 'OP-104'),
('2024-01-17', 'Day', 'PROD-003', 'Gadget X', 650, 700, 92.86, 'Factory East', 'M-003', 'OP-105'),
('2024-01-17', 'Night', 'PROD-003', 'Gadget X', 620, 700, 88.57, 'Factory East', 'M-003', 'OP-106'),
('2024-01-18', 'Day', 'PROD-001', 'Widget A', 910, 900, 101.11, 'Factory North', 'M-001', 'OP-101'),
('2024-01-18', 'Night', 'PROD-002', 'Widget B', 950, 1000, 95.00, 'Factory South', 'M-002', 'OP-102'),
('2024-01-19', 'Day', 'PROD-003', 'Gadget X', 680, 700, 97.14, 'Factory East', 'M-003', 'OP-103'),
('2024-01-19', 'Night', 'PROD-001', 'Widget A', 820, 900, 91.11, 'Factory North', 'M-001', 'OP-104');

-- Insert sample data for Defects
INSERT INTO Defects (date, productId, defect_type, defect_count, severity, factory, machine_id, description) VALUES
('2024-01-15', 'PROD-001', 'Surface Scratch', 12, 'Minor', 'Factory North', 'M-001', 'Minor surface scratches during handling'),
('2024-01-15', 'PROD-001', 'Dimensional Error', 3, 'Major', 'Factory North', 'M-001', 'Parts not meeting dimensional specifications'),
('2024-01-16', 'PROD-002', 'Color Variation', 8, 'Minor', 'Factory South', 'M-002', 'Slight color variation from standard'),
('2024-01-16', 'PROD-002', 'Assembly Issue', 5, 'Major', 'Factory South', 'M-002', 'Components not properly assembled'),
('2024-01-17', 'PROD-003', 'Packaging Defect', 15, 'Minor', 'Factory East', 'M-003', 'Packaging material issues'),
('2024-01-17', 'PROD-003', 'Functional Failure', 2, 'Critical', 'Factory East', 'M-003', 'Product fails functional testing'),
('2024-01-18', 'PROD-001', 'Surface Scratch', 7, 'Minor', 'Factory North', 'M-001', 'Minor surface scratches during handling'),
('2024-01-18', 'PROD-002', 'Color Variation', 10, 'Minor', 'Factory South', 'M-002', 'Slight color variation from standard'),
('2024-01-19', 'PROD-003', 'Assembly Issue', 4, 'Major', 'Factory East', 'M-003', 'Components not properly assembled'),
('2024-01-19', 'PROD-001', 'Dimensional Error', 1, 'Major', 'Factory North', 'M-001', 'Parts not meeting dimensional specifications');

-- Insert sample data for Sales
INSERT INTO Sales (sale_date, productId, product_type, quantity_sold, revenue, customer_id, region, sales_rep) VALUES
('2024-01-15', 'PROD-001', 'Widget A', 800, 24000.00, 'CUST-001', 'North', 'John Smith'),
('2024-01-15', 'PROD-002', 'Widget B', 750, 37500.00, 'CUST-002', 'South', 'Jane Doe'),
('2024-01-16', 'PROD-001', 'Widget A', 850, 25500.00, 'CUST-003', 'East', 'Mike Johnson'),
('2024-01-16', 'PROD-003', 'Gadget X', 600, 42000.00, 'CUST-004', 'West', 'Sarah Wilson'),
('2024-01-17', 'PROD-002', 'Widget B', 900, 45000.00, 'CUST-005', 'North', 'John Smith'),
('2024-01-17', 'PROD-001', 'Widget A', 780, 23400.00, 'CUST-006', 'South', 'Jane Doe'),
('2024-01-18', 'PROD-003', 'Gadget X', 650, 45500.00, 'CUST-007', 'East', 'Mike Johnson'),
('2024-01-18', 'PROD-002', 'Widget B', 920, 46000.00, 'CUST-008', 'West', 'Sarah Wilson'),
('2024-01-19', 'PROD-001', 'Widget A', 810, 24300.00, 'CUST-009', 'North', 'John Smith'),
('2024-01-19', 'PROD-003', 'Gadget X', 670, 46900.00, 'CUST-010', 'South', 'Jane Doe');

-- Create indexes for better performance
CREATE INDEX idx_production_date ON Production(date);
CREATE INDEX idx_production_product ON Production(productId);
CREATE INDEX idx_defects_date ON Defects(date);
CREATE INDEX idx_defects_product ON Defects(productId);
CREATE INDEX idx_sales_date ON Sales(sale_date);
CREATE INDEX idx_sales_product ON Sales(productId);

-- Show tables created
SHOW TABLES;

-- Display sample data
SELECT 'Production Table Sample:' as Info;
SELECT * FROM Production LIMIT 5;

SELECT 'Defects Table Sample:' as Info;
SELECT * FROM Defects LIMIT 5;

SELECT 'Sales Table Sample:' as Info;
SELECT * FROM Sales LIMIT 5;

