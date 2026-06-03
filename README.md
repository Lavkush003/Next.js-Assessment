# AasaMedChem | Inventory & Order Management System

A high-performance, responsive inventory and quotation system designed for the chemical industry, built with **Next.js**, **Neon PostgreSQL**, and **Vercel**. 

This application supports high-precision decimal measurements (essential for compounds/reagents), real-time unit conversions, secure role-based access control (Admin & Seller), and an interactive glassmorphic dashboard.

---

## 🚀 Key Features

*   **Secure Authentication & RBAC**: Custom stateless session manager (JWT) with secure HTTP-only cookies protecting `/admin` and `/dashboard` panels.
*   **Dual Portal Interfaces**:
    *   **Seller Dashboard**: Searchable/filterable catalog, slide-out active order cart with **live unit conversion preview**, and collapsible order history records.
    *   **Admin Console**: Real-time sales statistics widgets, full Product CRUD modals (with type-constrained units), and an incoming Quotation pipeline to approve/reject requests with automatic inventory re-balancing.
*   **High Precision Math**: Complete floating-point accuracy using PostgreSQL `NUMERIC` types to support micro-quantities and fine-grained pricing (e.g., price per gram).
*   **Unit Conversion Auditor**: Visually demonstrates conversion math in both the seller order history and the admin quotation review pipelines.
*   **Seeded Demo Data**: Seeds default accounts and common chemicals automatically on first run for immediate evaluation.

---

## 🛠️ Tech Stack & System Architecture

```
                 +---------------------------------------------+
                 |                 Vercel Edge                 |
                 |      Middleware Route Protection (JWT)      |
                 +---------------------+-----------------------+
                                       |
                                       v
                 +---------------------------------------------+
                 |            Next.js App Router               |
                 |  [Client Components]   [Server Actions / SC]|
                 +----------+--------------------+-------------+
                            |                    ^
              (Real-time    |                    | (DB Query /
              Conversions)  v                    | Transactions)
                 +------------------+  +---------+-------------+
                 |   Zod/Custom     |  |    @neondatabase      |
                 |  Client State    |  |     /serverless       |
                 +------------------+  +---------+-------------+
                                                 |
                                                 v
                                       +-----------------------+
                                       |      Neon Cloud       |
                                       |   PostgreSQL Engine   |
                                       +-----------------------+
```

1.  **Frontend**: Next.js (App Router, React 19, TypeScript) styled with pure **Vanilla CSS Modules** (adhering to strict non-Tailwind specifications) for a premium dark-themed glassmorphism UI.
2.  **State & Operations**: React Transition hooks (`useTransition`) and native **Next.js Server Actions** for secure database mutations.
3.  **Database**: Neon Serverless PostgreSQL with transactions for inventory writes and stock allocation locks.
4.  **Session Security**: Signed JWT cookies verified via Next.js Middleware in Edge Runtime.

---

## 🗄️ Database Schema

All database tables are initialized and seeded automatically on first connection.

### 1. `users`
Stores user records and credentials.
*   `id` (`UUID`, PK, Default: `gen_random_uuid()`): Unique identifier.
*   `email` (`VARCHAR(255)`, UNIQUE): Email address.
*   `password_hash` (`VARCHAR(255)`): Hashed credentials (using `bcryptjs`).
*   `name` (`VARCHAR(255)`): User's profile display name.
*   `role` (`VARCHAR(50)`, Check Constraint: `admin`, `seller`): Role-based access level.
*   `created_at` (`TIMESTAMP WITH TIME ZONE`): Account creation log.

### 2. `products`
Stores inventory assets, prices, and stock counts.
*   `id` (`UUID`, PK, Default: `gen_random_uuid()`): Unique identifier.
*   `sku` (`VARCHAR(100)`, UNIQUE): Stock Keeping Unit (e.g., `CHEM-ETH-002`).
*   `name` (`VARCHAR(255)`): Chemical display name.
*   `description` (`TEXT`): Specifications, purity levels, or warnings.
*   `category` (`VARCHAR(100)`): Product group (e.g., *Solvents*, *Reagents*).
*   `unit_type` (`VARCHAR(50)`, Check: `weight`, `volume`, `count`): Dimension type.
*   `base_unit` (`VARCHAR(20)`, Check: `g`, `kg`, `L`, `mL`, `items`): Standard warehouse unit.
*   `base_price` (`NUMERIC(20, 4)`): Base price in INR per `base_unit`.
*   `quantity_in_stock` (`NUMERIC(20, 8)`): Stock availability represented in `base_unit`.

### 3. `orders`
Stores order records/quotations.
*   `id` (`UUID`, PK, Default: `gen_random_uuid()`): Unique identifier.
*   `user_id` (`UUID`, FK): Links to creator.
*   `status` (`VARCHAR(50)`, Default: `pending`, Check: `pending`, `approved`, `rejected`, `cancelled`): Order workflow state.
*   `total_price` (`NUMERIC(20, 4)`): Total order amount in INR.
*   `created_at`, `updated_at` (`TIMESTAMP WITH TIME ZONE`): Logs.

### 4. `order_items`
Stores itemized orders, capturing pricing configuration and conversions at the time of purchase.
*   `id` (`UUID`, PK, Default: `gen_random_uuid()`): Unique identifier.
*   `order_id` (`UUID`, FK): Associated order.
*   `product_id` (`UUID`, FK): Associated product.
*   `ordered_quantity` (`NUMERIC(20, 8)`): Quantity specified in the seller's selected unit.
*   `ordered_unit` (`VARCHAR(20)`): Unit selected by the seller (e.g., `g`).
*   `base_quantity` (`NUMERIC(20, 8)`): Converted quantity in standard product `base_unit`.
*   `base_unit` (`VARCHAR(20)`): Reference product `base_unit` at purchase.
*   `unit_price` (`NUMERIC(20, 4)`): Calculated price per `ordered_unit` in INR.
*   `total_price` (`NUMERIC(20, 4)`): Total item cost (`ordered_quantity * unit_price`).

---

## 🧮 Unit Conversion & Storage Strategy

Chemical inventory demands precision. Standard floating-point values in databases can lead to rounding errors.

### Numeric Type Selections
*   **Quantities**: Stored as `NUMERIC(20, 8)`. This supports up to 8 decimal places (ideal for high-value APIs measured in micro-grams or milliliters, e.g., `0.0005 g`).
*   **Prices**: Stored as `NUMERIC(20, 4)`. This supports sub-rupee pricing per fine unit (e.g., ₹0.2500 per gram) and prevents cumulative rounding errors in grand totals.

### Conversion Factors
Conversions are dimension-specific. The application checks `unit_type` compatibility before calculations:
*   **Weight** (`g` $\leftrightarrow$ `kg`): $1\text{ kg} = 1000\text{ g}$.
*   **Volume** (`mL` $\leftrightarrow$ `L`): $1\text{ L} = 1000\text{ mL}$.
*   **Count** (`items`): Factor = 1 (fixed).

Let $U_{base}$ be the standard database unit, and $U_{order}$ be the seller's selected ordering unit. The conversion factor $F$ converts the order configuration to standard base units:
$$Quantity_{base} = Quantity_{order} \times F$$
$$Price_{order} = Price_{base} \times F$$

#### Conversion Matrix ($F$)
*   If $U_{base} == U_{order}$: $F = 1$
*   If $U_{base} = \text{kg}$ and $U_{order} = \text{g}$: $F = 0.001$
*   If $U_{base} = \text{g}$ and $U_{order} = \text{kg}$: $F = 1000$
*   If $U_{base} = \text{L}$ and $U_{order} = \text{mL}$: $F = 0.001$
*   If $U_{base} = \text{mL}$ and $U_{order} = \text{L}$: $F = 1000$

### Code Execution
1.  **Frontend (Real-Time Preview)**: In the active shopping cart, as the seller adjusts the quantity or unit, a helper computes $F$ client-side. The UI dynamically shows:
    *   The converted quantity in base unit.
    *   The unit price in the selected unit.
    *   The calculated item total.
2.  **Backend (Validation & Mutation)**: When the order is placed, the Server Action:
    *   Locks the product row for update (`FOR UPDATE`) to prevent race conditions.
    *   Recalculates $F$ serverside based on the product's database record.
    *   Verifies that `base_quantity` does not exceed available stock.
    *   Deducts the stock and inserts the order record.

---

## ⚙️ Local Setup Instructions

### 1. Prerequisites
*   Node.js (v18.x or later; v24.x recommended)
*   A Neon Cloud database instance (or any PostgreSQL database)

### 2. Installation
Clone this repository, navigate to the project directory, and install dependencies:
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:
```env
# Database Connection
DATABASE_URL="postgres://username:password@ep-host.region.neon.tech/neondb?sslmode=require"

# JWT Secret (for session signing)
JWT_SECRET="your-high-security-jwt-secret-string"
```

### 4. Running the App
Start the Next.js development server:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser. On the first page load, the database schema will be automatically created and seeded with test credentials and sample chemicals.

---

## 🚢 Deployment on Vercel

1.  **Push to GitHub**: Initialize a remote repository, add your files, and push your commits.
2.  **Import to Vercel**: Create a new project in Vercel and connect your repository.
3.  **Environment Variables**: In the Vercel dashboard, add the following variables:
    *   `DATABASE_URL` (your Neon connection string)
    *   `JWT_SECRET` (a secure secret string)
4.  **Deploy**: Click Deploy. Vercel builds the server actions and edge middleware automatically.

---

## 🧪 Testing Guide (Demo Walkthrough)

Use these seeded credentials to evaluate the platform:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@aasamedchem.com` | `admin123` |
| **Seller** | `seller@aasamedchem.com` | `seller123` |

### 1. Verification of Login & RBAC
1.  Open the portal. Click **Quick Evaluation Autofill: Admin** or **Seller**.
2.  Click **Sign In**.
3.  Attempting to manually enter `/admin` while logged in as a Seller will trigger a redirect back to `/dashboard` via Middleware.

### 2. Seller Workflow (Ordering & Live Conversion)
1.  Log in as **Seller**.
2.  You will see sample products like *Acetaminophen (Paracetamol) USP* (Base unit: `kg`, Stock: `120.5 kg`, Price: `₹450/kg`).
3.  Click **Add to Order**. The right-hand *Active Quotation* sidebar opens.
4.  In the cart, change the unit from `kilograms` to `grams`.
    *   Verify the rate changes from `₹450.00 / kg` to `₹0.45 / g` (calculated as $450 \times 0.001$).
5.  Type `500` in the Quantity input.
    *   Verify the *Internal conversion* readout displays: `500 g = 0.500000 kg`.
    *   Verify the subtotal shows `₹225.00`.
6.  Click **Submit Quotation / Place Order**. You will see a confetti animation on success.
7.  Switch to the **Order History** tab. Expand the order card to verify the audit table showing both original ordered and converted quantities.

### 3. Admin Workflow (Approvals & Inventory CRUD)
1.  Log in as **Admin**.
2.  Review the **Approved Revenue** card (calculated dynamically from approved quotations).
3.  Go to the **Incoming Quotations** tab. The order placed by the seller is displayed as `pending`.
4.  Click the **Approve** button (green checkmark).
    *   This updates the order status to `approved`.
5.  Switch to the **Chemical Inventory** tab.
    *   Verify that *Acetaminophen (Paracetamol) USP* stock has decreased from `120.5000 kg` to `120.0000 kg` (deducting exactly $0.5\text{ kg}$).
6.  Click **Add Product**. Create a new compound, select its dimension type (e.g. *Volume*), standard base unit (e.g. *mL*), price, and opening stock.
7.  Verify the new product appears in the table. You can edit its price or delete it.
