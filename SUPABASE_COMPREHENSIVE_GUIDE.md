# Supabase: Complete Guide & Overview

## Table of Contents
1. [Introduction to Supabase](#introduction-to-supabase)
2. [Core Features & Services](#core-features--services)
3. [Authentication & RBAC](#authentication--rbac)
4. [Advantages & Disadvantages](#advantages--disadvantages)
5. [Implementation Guide](#implementation-guide)
6. [Pricing: Free vs Pro Plans](#pricing-free-vs-pro-plans)
7. [Settings & Configuration](#settings--configuration)
8. [Comparison with Other Services](#comparison-with-other-services)
9. [Best Practices](#best-practices)
10. [Use Cases & When to Choose Supabase](#use-cases--when-to-choose-supabase)

---

## Introduction to Supabase

Supabase is an open-source Backend-as-a-Service (BaaS) platform that provides developers with a complete backend solution including database, authentication, real-time subscriptions, storage, and edge functions. Often described as "Firebase for PostgreSQL," Supabase aims to provide a developer-friendly alternative to Firebase with SQL database capabilities.

### What Makes Supabase Different?
- **Open Source**: Full transparency and self-hosting capabilities
- **PostgreSQL Foundation**: Powerful relational database with ACID compliance
- **SQL-First**: Native SQL support with advanced querying capabilities
- **Real-time Everything**: Built-in real-time subscriptions for all database changes
- **Developer Experience**: Intuitive dashboard and excellent documentation

---

## Core Features & Services

### 1. **Database (PostgreSQL)**
- **Managed PostgreSQL**: Fully managed PostgreSQL instances
- **Auto-scaling**: Automatic scaling based on usage
- **Row Level Security (RLS)**: Built-in security at the database level
- **Extensions**: Support for PostgreSQL extensions (PostGIS, pg_vector, etc.)
- **Backups**: Automated daily backups with point-in-time recovery

### 2. **Authentication**
- **Multiple Providers**: Email/password, OAuth (Google, GitHub, Discord, etc.)
- **Magic Links**: Passwordless authentication
- **Phone Authentication**: SMS-based login
- **JWT Tokens**: Industry-standard token-based authentication
- **User Management**: Built-in user management dashboard

### 3. **Real-time Subscriptions**
- **Database Changes**: Listen to INSERT, UPDATE, DELETE operations
- **Channel-based**: Custom channels for real-time messaging
- **Presence**: Track online users and their state
- **Low Latency**: WebSocket-based for minimal delay

### 4. **Storage**
- **File Management**: Upload, download, and manage files
- **CDN Integration**: Global content delivery network
- **Image Transformations**: On-the-fly image resizing and optimization
- **Bucket Policies**: Fine-grained access control

### 5. **Edge Functions**
- **Serverless Functions**: Deploy JavaScript/TypeScript functions globally
- **Deno Runtime**: Secure and fast runtime environment
- **Global Distribution**: Run functions close to users worldwide

### 6. **API Auto-generation**
- **REST API**: Automatically generated from database schema
- **GraphQL**: Optional GraphQL endpoint
- **OpenAPI Spec**: Auto-generated API documentation

---

## Authentication & RBAC

### Authentication Methods

#### **1. Email/Password Authentication**
- Traditional email and password login
- Email verification support
- Password reset functionality
- Customizable email templates

#### **2. OAuth Providers**
Supported providers include:
- Google
- GitHub
- Facebook
- Twitter/X
- Discord
- Apple
- Azure
- Slack
- And many more...

#### **3. Magic Links**
- Passwordless authentication via email
- Secure token-based login
- Customizable redirect URLs

#### **4. Phone Authentication**
- SMS-based verification
- International phone number support
- Configurable SMS templates

### Role-Based Access Control (RBAC) Implementation

#### **Database-Level Security (RLS)**
Supabase leverages PostgreSQL's Row Level Security for fine-grained access control:

```sql
-- Enable RLS on a table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );
```

#### **Application-Level RBAC**
- **Custom User Metadata**: Store roles in user metadata
- **JWT Claims**: Include roles in JWT tokens
- **Middleware Integration**: Verify roles in application middleware
- **API-Level Protection**: Secure API endpoints based on roles

#### **RBAC Best Practices**
1. **Principle of Least Privilege**: Grant minimum necessary permissions
2. **Role Hierarchy**: Implement hierarchical role systems
3. **Resource-Based Permissions**: Control access to specific resources
4. **Audit Logging**: Track role changes and access patterns

---

## Advantages & Disadvantages

### ✅ **Advantages**

#### **Developer Experience**
- **Intuitive Dashboard**: User-friendly web interface
- **Excellent Documentation**: Comprehensive guides and tutorials
- **Auto-generated APIs**: Instant REST and GraphQL APIs
- **Local Development**: Run Supabase locally with Docker
- **CLI Tools**: Powerful command-line interface

#### **Technical Benefits**
- **PostgreSQL Power**: Full SQL capabilities with ACID compliance
- **Real-time Built-in**: Native real-time subscriptions
- **Open Source**: Full transparency and community contributions
- **Self-hosting Option**: Deploy on your own infrastructure
- **Scalability**: Handles growth from startup to enterprise

#### **Security**
- **Row Level Security**: Database-level access control
- **JWT Standards**: Industry-standard authentication
- **SSL/TLS**: Encrypted connections by default
- **SOC 2 Compliance**: Enterprise-grade security standards

#### **Cost-Effective**
- **Generous Free Tier**: Suitable for development and small projects
- **Transparent Pricing**: Clear, usage-based pricing model
- **No Vendor Lock-in**: Open source with migration capabilities

### ❌ **Disadvantages**

#### **Limitations**
- **Newer Ecosystem**: Smaller community compared to Firebase
- **PostgreSQL Only**: Limited to PostgreSQL database
- **Learning Curve**: SQL knowledge required for advanced features
- **Feature Gaps**: Some advanced Firebase features not yet available

#### **Enterprise Concerns**
- **Maturity**: Newer platform with evolving features
- **Support Options**: Limited enterprise support compared to AWS/GCP
- **Regional Availability**: Fewer regions than major cloud providers

#### **Technical Constraints**
- **Database Size Limits**: Free tier has storage limitations
- **Function Runtime**: Edge functions have execution time limits
- **Real-time Connections**: Limited concurrent connections on free tier

---

## Implementation Guide

### 1. **Project Setup**

#### **Create Supabase Project**
1. Sign up at [supabase.com](https://supabase.com)
2. Create new project
3. Choose region and database password
4. Wait for project initialization

#### **Get Project Credentials**
- **Project URL**: `https://your-project.supabase.co`
- **API Keys**:
  - `anon` key for client-side operations
  - `service_role` key for server-side operations

### 2. **Database Setup**

#### **Design Your Schema**
```sql
-- Users table (handled by Supabase Auth)
-- Custom profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    username TEXT UNIQUE,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

#### **Create Policies**
```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);
```

### 3. **Authentication Configuration**

#### **Enable Auth Providers**
1. Go to Authentication > Providers
2. Configure desired providers (Google, GitHub, etc.)
3. Add redirect URLs
4. Save provider credentials

#### **Customize Email Templates**
1. Navigate to Authentication > Email Templates
2. Customize templates for:
   - Email confirmation
   - Password reset
   - Magic link
   - Email change

### 4. **Client Integration**

#### **Install Client Library**
```bash
npm install @supabase/supabase-js
```

#### **Initialize Client**
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### 5. **Implement RBAC**

#### **User Registration with Roles**
```javascript
// Register user
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})

// Create profile with role
const { error: profileError } = await supabase
  .from('profiles')
  .insert({
    id: data.user.id,
    username: 'johndoe',
    role: 'user'
  })
```

#### **Role-based Access**
```javascript
// Check user role
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

// Protect routes based on role
if (profile.role !== 'admin') {
  return { error: 'Insufficient permissions' }
}
```

### 6. **Real-time Implementation**

#### **Subscribe to Changes**
```javascript
// Listen to profile changes
const subscription = supabase
  .channel('profiles')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'profiles' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

---

## Pricing: Free vs Pro Plans

### 🆓 **Free Tier**
Perfect for development, prototyping, and small projects.

#### **Database**
- **Storage**: 500MB included
- **Bandwidth**: 1GB included
- **Concurrent connections**: Up to 60

#### **Authentication**
- **Monthly Active Users (MAU)**: 50,000 included
- **All auth providers**: Unlimited
- **Custom SMTP**: Not included

#### **Storage**
- **File storage**: 1GB included
- **Bandwidth**: 2GB included

#### **Edge Functions**
- **Invocations**: 500K per month
- **Execution time**: 1M CPU seconds

#### **Support**
- **Community support**: Forum and Discord
- **Response time**: Best effort

### 💰 **Pro Plan ($25/month)**
Suitable for production applications and growing teams.

#### **Database**
- **Storage**: 8GB included, then $0.125/GB
- **Bandwidth**: 250GB included, then $0.09/GB
- **Concurrent connections**: Up to 200

#### **Authentication**
- **MAU**: 100,000 included, then $0.00325/MAU
- **Custom SMTP**: Included
- **Advanced auth features**: Priority support

#### **Storage**
- **File storage**: 100GB included, then $0.021/GB
- **Bandwidth**: 200GB included, then $0.09/GB

#### **Edge Functions**
- **Invocations**: 2M per month, then $0.50 per 1M
- **Execution time**: 2M CPU seconds, then $0.50 per 1M

#### **Support**
- **Email support**: 2 business day response
- **Priority support**: Faster resolution

### 🏢 **Enterprise**
Custom pricing for large-scale applications.

#### **Features**
- **Dedicated infrastructure**: Isolated environments
- **Custom contracts**: Tailored agreements
- **SLA guarantees**: Uptime commitments
- **24/7 support**: Phone and email support
- **Custom integrations**: Bespoke solutions

---

## Settings & Configuration

### 1. **General Settings**

#### **Project Settings**
- **Project Name**: Customizable project identifier
- **Organization**: Manage team access and billing
- **Pause Project**: Temporarily disable project
- **Delete Project**: Permanent project removal

#### **API Settings**
- **Project URL**: Immutable project endpoint
- **API Keys**: Regenerate keys if compromised
- **JWT Secret**: Used for token verification

### 2. **Database Configuration**

#### **Connection Settings**
- **Database URL**: Direct PostgreSQL connection
- **Connection Pooling**: Manage connection limits
- **SSL Configuration**: Security settings

#### **Extensions**
Enable PostgreSQL extensions:
- **PostGIS**: Geospatial data support
- **pg_vector**: Vector similarity search
- **uuid-ossp**: UUID generation
- **pgcrypto**: Cryptographic functions

#### **Backups**
- **Automatic Backups**: Daily backups retention
- **Point-in-time Recovery**: Restore to specific timestamp
- **Manual Backups**: On-demand backup creation

### 3. **Authentication Configuration**

#### **General Auth Settings**
- **Site URL**: Primary application URL
- **Redirect URLs**: Allowed redirect destinations
- **JWT Expiry**: Token expiration time
- **Refresh Token Rotation**: Security enhancement

#### **Email Auth**
- **Enable Email Confirmations**: Require email verification
- **Double Confirm Email Changes**: Security for email updates
- **Enable Signups**: Allow new user registration

#### **Provider Configuration**
Each OAuth provider requires:
- **Client ID**: Provider application identifier
- **Client Secret**: Provider application secret
- **Redirect URLs**: OAuth callback endpoints
- **Scopes**: Permissions requested from provider

#### **SMTP Settings**
Custom email provider configuration:
- **SMTP Host**: Email server address
- **SMTP Port**: Server port (usually 587 or 465)
- **SMTP User**: Authentication username
- **SMTP Pass**: Authentication password
- **Sender Name**: Email sender identity
- **Sender Email**: Reply-to address

### 4. **Storage Configuration**

#### **Bucket Settings**
- **Public Buckets**: Publicly accessible files
- **Private Buckets**: Authenticated access only
- **File Size Limits**: Maximum upload size
- **MIME Type Restrictions**: Allowed file types

#### **Policies**
```sql
-- Example storage policy
CREATE POLICY "Users can upload their own avatars" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
```

### 5. **Edge Functions Settings**

#### **Function Configuration**
- **Runtime**: Deno version
- **Environment Variables**: Function secrets and config
- **Memory Limits**: Resource allocation
- **Timeout Settings**: Maximum execution time

#### **Deployment**
- **Git Integration**: Deploy from repositories
- **Manual Upload**: Direct function deployment
- **Rollback**: Previous version restoration

### 6. **Real-time Configuration**

#### **Connection Limits**
- **Max Connections**: Concurrent WebSocket connections
- **Rate Limiting**: Prevent abuse
- **Heartbeat Interval**: Connection health checks

#### **Channel Settings**
- **Presence**: User tracking configuration
- **Broadcast**: Message broadcasting settings
- **Postgres Changes**: Database change subscriptions

---

## Comparison with Other Services

### Supabase vs Firebase

| Feature | Supabase | Firebase |
|---------|----------|----------|
| **Database** | PostgreSQL (Relational) | Firestore (NoSQL) |
| **Open Source** | ✅ Yes | ❌ No |
| **Self-hosting** | ✅ Yes | ❌ No |
| **SQL Support** | ✅ Native | ❌ Limited |
| **Real-time** | ✅ Built-in | ✅ Built-in |
| **Authentication** | ✅ Comprehensive | ✅ Comprehensive |
| **File Storage** | ✅ Yes | ✅ Yes |
| **Functions** | ✅ Edge Functions | ✅ Cloud Functions |
| **Pricing** | 💰 Competitive | 💰 Can be expensive |
| **Vendor Lock-in** | ✅ Low | ❌ High |
| **Ecosystem** | 🔄 Growing | ✅ Mature |
| **Learning Curve** | 📈 SQL knowledge helpful | 📈 NoSQL concepts |

### Supabase vs Auth0

| Feature | Supabase | Auth0 |
|---------|----------|-------|
| **Focus** | Full Backend Platform | Authentication Only |
| **Database** | ✅ Included | ❌ Separate service |
| **Pricing** | 💰 Lower cost | 💰 Higher cost |
| **Customization** | ✅ High | ✅ Very High |
| **Enterprise Features** | 🔄 Growing | ✅ Comprehensive |
| **Developer Experience** | ✅ Excellent | ✅ Good |
| **Real-time** | ✅ Built-in | ❌ Not included |
| **Open Source** | ✅ Yes | ❌ No |

### Supabase vs AWS Cognito

| Feature | Supabase | AWS Cognito |
|---------|----------|-------------|
| **Ease of Use** | ✅ Very Easy | ⚠️ Complex |
| **Integration** | ✅ Seamless | ⚠️ Requires setup |
| **Pricing** | 💰 Transparent | 💰 Complex structure |
| **Scalability** | ✅ Good | ✅ Excellent |
| **AWS Ecosystem** | ❌ Limited | ✅ Full integration |
| **Documentation** | ✅ Excellent | ⚠️ Dense |
| **Real-time** | ✅ Built-in | ❌ Separate service |

### Supabase vs Keycloak

| Feature | Supabase | Keycloak |
|---------|----------|----------|
| **Hosting** | ☁️ Managed | 🏗️ Self-hosted |
| **Setup Complexity** | ✅ Simple | ⚠️ Complex |
| **Enterprise Features** | 🔄 Growing | ✅ Comprehensive |
| **Protocol Support** | 📱 OAuth, JWT | 🔒 SAML, OpenID, OAuth |
| **Cost** | 💰 Subscription | 🆓 Open source |
| **Maintenance** | ✅ Managed | ❌ Self-managed |
| **Customization** | ✅ Good | ✅ Extensive |
| **Learning Curve** | 📈 Moderate | 📈 Steep |

---

## Best Practices

### 1. **Security Best Practices**

#### **Row Level Security (RLS)**
```sql
-- Always enable RLS on user-facing tables
ALTER TABLE sensitive_data ENABLE ROW LEVEL SECURITY;

-- Create specific policies for each operation
CREATE POLICY "read_own_data" ON sensitive_data
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "insert_own_data" ON sensitive_data
    FOR INSERT WITH CHECK (user_id = auth.uid());
```

#### **API Key Management**
- **Never expose service_role key** in client-side code
- **Rotate keys regularly** in production
- **Use environment variables** for sensitive data
- **Implement rate limiting** to prevent abuse

#### **Authentication Security**
- **Enable email confirmations** for production
- **Use strong password policies**
- **Implement session timeout** for sensitive applications
- **Monitor authentication logs** for suspicious activity

### 2. **Performance Optimization**

#### **Database Optimization**
- **Use indexes** on frequently queried columns
- **Implement pagination** for large datasets
- **Use select()** to limit returned columns
- **Leverage PostgreSQL query optimization**

#### **Real-time Optimization**
- **Limit real-time subscriptions** to necessary data
- **Use filters** to reduce unnecessary updates
- **Implement connection pooling** for high-traffic apps
- **Monitor connection usage**

#### **Storage Optimization**
- **Implement image optimization** for web delivery
- **Use CDN** for global file distribution
- **Set appropriate file size limits**
- **Clean up unused files** regularly

### 3. **Development Workflow**

#### **Environment Management**
- **Use separate projects** for development, staging, production
- **Implement proper CI/CD** pipelines
- **Use migrations** for schema changes
- **Version control** your database schema

#### **Testing Strategies**
- **Unit test** your database functions
- **Integration test** authentication flows
- **Load test** real-time subscriptions
- **Security test** RLS policies

### 4. **Monitoring & Observability**

#### **Metrics to Monitor**
- **Database performance**: Query execution time, connection count
- **Authentication metrics**: Login success rate, failed attempts
- **Real-time metrics**: Connection count, message throughput
- **Storage metrics**: File upload success, bandwidth usage

#### **Logging Best Practices**
- **Enable audit logging** for sensitive operations
- **Log authentication events**
- **Monitor error rates**
- **Set up alerts** for critical issues

---

## Use Cases & When to Choose Supabase

### 🎯 **Ideal Use Cases**

#### **1. Full-Stack Web Applications**
- **React, Vue, Angular** applications
- **Next.js, Nuxt.js** frameworks
- **Real-time dashboards** and admin panels
- **Social media platforms**

#### **2. Mobile Applications**
- **React Native** apps
- **Flutter** applications
- **Ionic** hybrid apps
- **Real-time chat** applications

#### **3. SaaS Applications**
- **Multi-tenant** applications
- **User management** systems
- **Subscription-based** services
- **Analytics dashboards**

#### **4. E-commerce Platforms**
- **Product catalogs**
- **User authentication**
- **Real-time inventory**
- **Order management**

#### **5. Content Management**
- **Blog platforms**
- **Documentation sites**
- **Media libraries**
- **User-generated content**

### ✅ **Choose Supabase When You Need:**

#### **Technical Requirements**
- **PostgreSQL features**: ACID compliance, complex queries, JSON support
- **Real-time functionality**: Live updates, collaborative features
- **Open source solution**: Transparency, self-hosting option
- **Rapid development**: Quick MVP development, auto-generated APIs

#### **Business Requirements**
- **Cost-effective solution**: Transparent pricing, generous free tier
- **Vendor independence**: Avoid lock-in, migration flexibility
- **Developer productivity**: Focus on features, not infrastructure
- **Scalability**: Growth from prototype to production

### ❌ **Consider Alternatives When:**

#### **Technical Constraints**
- **Need NoSQL database**: Firebase, MongoDB Atlas
- **Require complex auth flows**: Auth0, Keycloak
- **Heavy enterprise integrations**: AWS Cognito, Azure AD
- **Specific database requirements**: Other database types

#### **Business Constraints**
- **Enterprise compliance needs**: Established enterprise solutions
- **Existing infrastructure**: Deep AWS, GCP, Azure integration
- **Large development teams**: Need extensive enterprise support
- **Complex legacy systems**: Require extensive customization

### 🚀 **Success Stories & Examples**

#### **Startups Using Supabase**
- **Chatbots and AI applications**
- **Social networking platforms**
- **E-learning platforms**
- **Fintech applications**

#### **Enterprise Adoptions**
- **Internal tools and dashboards**
- **Customer portals**
- **Employee management systems**
- **Analytics platforms**

---

## Migration Strategies

### 1. **From Firebase**

#### **Data Migration**
- **Export Firestore data** to JSON
- **Transform data structure** for PostgreSQL
- **Import using Supabase client** or direct SQL
- **Verify data integrity** after migration

#### **Authentication Migration**
- **Export user data** from Firebase Auth
- **Create users in Supabase** with same UIDs
- **Migrate custom claims** to user metadata
- **Update client authentication** code

### 2. **From Traditional Auth Systems**

#### **User Data Migration**
- **Extract user credentials** and profiles
- **Hash passwords** using compatible algorithm
- **Import users** via Supabase admin API
- **Migrate user roles** and permissions

#### **Application Updates**
- **Replace auth SDK** with Supabase client
- **Update authentication flows**
- **Implement new RBAC** system
- **Test all auth scenarios**

### 3. **Gradual Migration Approach**

#### **Phase 1: Setup**
- **Create Supabase project**
- **Design database schema**
- **Configure authentication providers**
- **Set up development environment**

#### **Phase 2: Parallel Implementation**
- **Implement new features** with Supabase
- **Maintain existing system** for current users
- **Test thoroughly** in staging environment
- **Train development team**

#### **Phase 3: Migration**
- **Migrate user data** in batches
- **Update application endpoints**
- **Monitor system performance**
- **Provide user communication**

#### **Phase 4: Optimization**
- **Remove legacy code**
- **Optimize database performance**
- **Implement advanced features**
- **Monitor and improve**

---

## Conclusion

Supabase represents a paradigm shift in backend development, offering developers a powerful, open-source alternative to traditional BaaS solutions. Its PostgreSQL foundation, combined with modern developer experience and comprehensive feature set, makes it an attractive choice for a wide range of applications.

### **Key Takeaways**

#### **Strengths**
- **Developer-friendly**: Intuitive interface and excellent documentation
- **Open source**: Transparency and flexibility
- **PostgreSQL power**: Full SQL capabilities with modern features
- **Comprehensive platform**: Database, auth, storage, and functions
- **Cost-effective**: Competitive pricing with generous free tier

#### **Considerations**
- **Newer ecosystem**: Smaller community compared to Firebase
- **SQL knowledge**: Benefits from PostgreSQL familiarity
- **Enterprise features**: Still evolving for large-scale deployments

### **Final Recommendation**

Supabase is an excellent choice for:
- **Modern web applications** requiring real-time features
- **Teams comfortable with SQL** and relational databases
- **Projects valuing open source** and vendor independence
- **Startups and scale-ups** needing rapid development
- **Applications requiring complex queries** and data relationships

Consider alternatives if you need:
- **NoSQL document storage** (Firebase/MongoDB)
- **Extensive enterprise features** (Auth0/AWS)
- **Specific compliance requirements** (Enterprise solutions)
- **Heavy legacy system integration** (Traditional solutions)

Supabase continues to evolve rapidly, with regular feature updates and improvements. Its combination of developer experience, technical capabilities, and business value makes it a compelling choice for modern application development.

---

*This guide provides a comprehensive overview of Supabase as of 2024. For the most current information, refer to the official Supabase documentation and community resources.*