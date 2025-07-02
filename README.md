# SaaS POS System

A comprehensive multi-tenant SaaS Point of Sale system for restaurants and bars, built with React, Supabase, and modern web technologies.

## 🚀 Features

### Core POS Functionality
- **Multi-Tenant Architecture**: Support for multiple restaurant brands and locations
- **Table Management**: Predefined and ad-hoc table creation with visual floor plans
- **Real-time Order Processing**: Live order updates across kitchen and service staff
- **Split Bills**: Advanced bill splitting with item-level granularity
- **Payment Processing**: Integrated payment handling with multiple payment methods

### Advanced Features
- **Kitchen Display System**: Real-time order management for kitchen staff
- **Analytics Dashboard**: Comprehensive reporting and insights
- **Staff Management**: Role-based access control and permissions
- **Customer Management**: Customer profiles and loyalty tracking
- **Inventory Management**: Stock tracking with low-stock alerts
- **AI-Powered Upselling**: Smart product recommendations

### Technical Features
- **Real-time Sync**: WebSocket-based real-time updates
- **Offline Support**: PWA capabilities for offline operation
- **Multi-Device Support**: Responsive design for tablets, phones, and desktops
- **Row-Level Security**: Tenant isolation at the database level

## 🛠 Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Real-time, Storage)
- **State Management**: Zustand
- **Charts**: ECharts
- **Icons**: React Icons
- **Routing**: React Router DOM
- **Notifications**: React Hot Toast

## 🏗 Database Schema

### Core Tables
- `tenants` - Restaurant brands/companies
- `locations` - Physical restaurant locations
- `tables` - Restaurant tables (predefined + ad-hoc)
- `orders` - Customer orders
- `order_items` - Individual items in orders
- `menu_items` - Restaurant menu items
- `inventory` - Stock management
- `customers` - Customer profiles
- `staff` - Staff members and permissions

### Security
- Row-Level Security (RLS) policies for tenant isolation
- JWT-based authentication
- Role-based access control

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd saas-pos-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Database Setup**
   
   Run the following SQL in your Supabase SQL editor:
   
   ```sql
   -- Create tenants table
   CREATE TABLE tenants (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name TEXT NOT NULL,
     plan TEXT CHECK (plan IN ('basic', 'pro', 'enterprise')),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Create locations table
   CREATE TABLE locations (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     address JSONB,
     tables JSONB[],
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Create tables table
   CREATE TABLE tables (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     status TEXT CHECK (status IN ('ready', 'occupied', 'reserved')) DEFAULT 'ready',
     capacity INT DEFAULT 2,
     is_ad_hoc BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Create orders table
   CREATE TABLE orders (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
     table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
     order_type TEXT CHECK (order_type IN ('dine-in', 'takeaway', 'delivery')) DEFAULT 'dine-in',
     status TEXT CHECK (status IN ('pending', 'active', 'completed', 'refunded')) DEFAULT 'pending',
     subtotal DECIMAL(10,2) DEFAULT 0,
     tax DECIMAL(10,2) DEFAULT 0,
     tip DECIMAL(10,2) DEFAULT 0,
     split_from UUID REFERENCES orders(id),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Create menu_items table
   CREATE TABLE menu_items (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     description TEXT,
     base_price DECIMAL(10,2) NOT NULL,
     category TEXT,
     modifiers JSONB[],
     inventory_alert INT DEFAULT 10,
     is_available BOOLEAN DEFAULT TRUE,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Create staff table
   CREATE TABLE staff (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     role TEXT CHECK (role IN ('admin', 'manager', 'waiter', 'chef')) DEFAULT 'waiter',
     permissions TEXT[],
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
   ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
   ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
   ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
   ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
   ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

   -- Create RLS Policies
   CREATE POLICY "Staff can access their tenant's data" ON tenants
     FOR ALL USING (
       id IN (
         SELECT tenant_id FROM staff WHERE user_id = auth.uid()
       )
     );

   CREATE POLICY "Staff can access their tenant's locations" ON locations
     FOR ALL USING (
       tenant_id IN (
         SELECT tenant_id FROM staff WHERE user_id = auth.uid()
       )
     );

   -- Add similar policies for other tables...
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 📱 Usage

### Demo Credentials
- **Email**: admin@restaurant.com
- **Password**: password123

### Key Features

1. **Multi-Tenant Login**: Select your restaurant brand and location
2. **Table Management**: Create and manage tables with real-time status updates
3. **Order Taking**: Add items to orders with modifiers and special instructions
4. **Kitchen Display**: Real-time order management for kitchen staff
5. **Analytics**: View sales trends and popular menu items
6. **Split Bills**: Split orders between multiple tables or customers

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Run the database schema SQL
3. Configure authentication providers
4. Set up real-time subscriptions
5. Configure storage buckets for images

### Environment Variables
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-key
```

## 🚀 Deployment

### Netlify Deployment
1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify
3. Configure environment variables in Netlify dashboard
4. Set up continuous deployment from your Git repository

### Supabase Edge Functions
Deploy serverless functions for:
- Payment processing
- Order notifications
- Inventory updates
- Analytics calculations

## 🔐 Security

- **Row-Level Security**: All data is isolated by tenant
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Different permissions for admin, manager, waiter, chef
- **HTTPS Only**: All communications encrypted
- **Input Validation**: All user inputs validated and sanitized

## 📊 Analytics & Reporting

- **Real-time Dashboard**: Live sales and order metrics
- **Sales Trends**: Historical sales data with charts
- **Popular Items**: Menu item performance analytics
- **Staff Performance**: Order processing metrics
- **Inventory Reports**: Stock levels and usage patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Email: support@saas-pos.com
- Documentation: https://docs.saas-pos.com

## 🗺 Roadmap

- [ ] Mobile apps (iOS/Android)
- [ ] Advanced inventory management
- [ ] Multi-language support
- [ ] Integration with delivery platforms
- [ ] Advanced analytics and ML insights
- [ ] Voice ordering capabilities
- [ ] IoT device integration