You are a senior full-stack architect, system designer, and UI/UX expert.

Your task is to design and generate a COMPLETE production-ready system for:

SYSTEM NAME:
Rayn Motorparts and Accessories

SYSTEM TYPE:
Web-based Inventory Management + Point of Sale (POS) System

DATABASE:
Use the provided MySQL schema exactly as the single source of truth.
Do NOT redesign tables unless absolutely necessary. Adapt logic to it.

==================================================
🎯 CORE OBJECTIVE
==================================================

Build a scalable, modular, enterprise-grade system that includes:

1. Inventory Management
2. POS System (real-time stock deduction)
3. Supplier & Procurement Management
4. Customer Management
5. Sales & Invoice System
6. Reporting & Analytics Dashboard
7. Role-Based Access Control
8. Audit Logging System

The system must strictly follow the database relationships, constraints, and logic.

==================================================
🏗️ SYSTEM ARCHITECTURE
==================================================

Design the system using:

Frontend:
- React (Next.js preferred)
- TailwindCSS (clean, modern UI)
- POS must be fast, keyboard-friendly, and offline-tolerant

Backend:
- Node.js (Express or NestJS preferred)
- RESTful API OR GraphQL (your choice, justify it)

Database:
- MySQL (use given schema)
- Use transactions for all financial & stock operations

Other:
- JWT Authentication
- Role-Based Access Control (RBAC)
- API validation layer
- Error handling middleware

==================================================
📦 CORE MODULES (STRICT IMPLEMENTATION)
==================================================

1. AUTH & USERS
- Login / Logout
- Roles (Admin, Manager, Cashier, Inventory Staff)
- Permissions per module
- Session handling

2. PRODUCT MANAGEMENT
- CRUD Products
- Product Variants
- Barcode support
- Vehicle Compatibility (make/model/year)
- Category hierarchy (tree structure)

3. INVENTORY SYSTEM
- Multi-warehouse support
- Real-time stock tracking (inventory_stock)
- Stock movements ledger (immutable)
- Stock adjustments
- Low stock alerts
- Transfer between warehouses

IMPORTANT:
Inventory MUST be updated ONLY through stock_movements logic.

4. SUPPLIER & PROCUREMENT
- Suppliers CRUD
- Supplier product pricing
- Purchase Orders
- Receiving items (updates stock)
- Partial receiving support

5. POS SYSTEM (CRITICAL)
- Fast product search (barcode/SKU/name)
- Add to cart (variants)
- Apply discounts
- Multiple payment methods
- Print receipt
- Open/close cash sessions

CRITICAL RULE:
Every completed sale MUST:
- Insert into sales_transactions
- Insert into sales_transaction_items
- Automatically create stock_movements (deduction)
- Update inventory_stock

6. SALES & RETURNS
- Sales history
- Returns & refunds
- Partial returns
- Stock reversal on returns

7. CUSTOMER MANAGEMENT
- Customer profiles
- Credit tracking (if applicable)
- Purchase history

8. INVOICE SYSTEM
- Auto-generate invoices from sales
- Invoice items snapshot (immutable)
- Payment tracking

9. REPORTS & ANALYTICS
- Daily sales report
- Inventory valuation
- Low stock report
- Top-selling products
- Profit margin analysis
- Stock movement history

10. AUDIT SYSTEM
- Log all critical actions:
  - Sales
  - Stock changes
  - User actions
- Must be tamper-proof

==================================================
🔁 BUSINESS LOGIC RULES (MANDATORY)
==================================================

1. STOCK LOGIC
- Never directly update inventory_stock without stock_movements
- Always calculate:
  qty_after = qty_before + qty_change

2. SALES FLOW
- Validate stock availability before sale
- Deduct stock AFTER transaction is confirmed
- Use DB transactions (ACID compliance)

3. RETURNS FLOW
- Reverse stock via stock_movements
- Link to original transaction

4. PURCHASE FLOW
- Receiving increases stock
- Update avg_cost (weighted)

5. PRICING
- Use variant price if available
- Otherwise fallback to product price

==================================================
🧠 UI/UX REQUIREMENTS
==================================================

Dashboard:
- Sales summary (today, week, month)
- Low stock alerts
- Quick actions

POS UI:
- Large buttons
- Barcode-first workflow
- Minimal clicks
- Keyboard shortcuts

Inventory UI:
- Table + filters
- Bulk actions
- Stock alerts

Design Style:
- Clean
- Fast
- Minimalist
- Mobile-responsive (POS tablet-friendly)

==================================================
⚡ PERFORMANCE REQUIREMENTS
==================================================

- Optimized queries (use indexes from schema)
- Pagination for all tables
- Debounced search
- Lazy loading where needed

==================================================
🔐 SECURITY
==================================================

- JWT authentication
- Role-based access enforcement
- Input validation (prevent SQL injection)
- Secure API endpoints

==================================================
📤 OUTPUT FORMAT
==================================================

Generate the system in this order:

1. System Architecture Overview
2. Backend Structure (folders, modules)
3. API Endpoints (complete list)
4. Frontend Structure (pages/components)
5. POS Flow Logic (step-by-step)
6. Inventory + Stock Movement Logic
7. Key Code Implementations (critical parts only)
8. UI Layout Descriptions
9. Deployment Guide

==================================================
⚠️ IMPORTANT INSTRUCTIONS
==================================================

- Follow the provided database strictly
- Do NOT oversimplify logic
- Ensure real-world POS accuracy
- Make the system scalable and production-ready
- Prioritize correctness over shortcuts

==================================================

Now begin building the complete system.