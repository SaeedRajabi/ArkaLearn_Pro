# ArkaSoftware - Technical Documentation

## System Architecture

### Overview

ArkaSoftware follows a Domain-Driven Design approach with a Clean Architecture pattern. The system is divided into distinct layers, each with specific responsibilities:

1. **Domain Layer** - Core business logic and entities
2. **Application Layer** - Use case implementations and application services
3. **Contracts Layer** - Interfaces and contracts between layers
4. **DTOs Layer** - Data Transfer Objects for communication
5. **Infrastructure Layer** - Data access, external services, and implementations
6. **Presentation Layer** - API endpoints and user interfaces

### Architectural Patterns

#### Domain-Driven Design (DDD)

The system implements key DDD concepts:

- **Aggregates**: Consistent boundaries for related entities
- **Entities**: Objects with identity and lifecycle
- **Value Objects**: Objects without identity, defined by their attributes
- **Repositories**: Data access abstractions
- **Domain Events**: Event-driven communication between aggregates
- **Services**: Operations that don't belong to entities or value objects

#### CQRS (Command Query Responsibility Segregation)

The application separates read and write operations:

- **Commands**: Represent actions that change system state
- **Queries**: Represent requests for data without changing state
- **Command Handlers**: Process commands and update the system
- **Query Handlers**: Process queries and return data

### Layered Architecture Details

#### 1. Domain Layer

Located at: `SRC/01.Core/ArkaSoftwarePro.Src.Core.Domain`

This layer contains the core business logic and is independent of any infrastructure concerns. It includes:

- **Aggregates**: Grouped entities that maintain consistency boundaries
- **Entities**: Business objects with identity
- **Value Objects**: Objects defined by their attributes
- **Domain Events**: Events that occur within the domain
- **Repositories Interfaces**: Contracts for data access

Key Aggregates:
- UserAggregate
- StudentAggregate
- TeacherAggregate
- CourseAggregate
- RoomAggregate
- OrderAggregate
- BasketAggregate
- ArticleAggregate
- CategoryAggregate
- TagAggregate
- EducationPlanAggregate
- EnrollmentAggregate
- ClassScheduleAggregate

#### 2. Application Layer

Located at: `SRC/01.Core/ArkaSoftwarePro.Src.Core.ApplicationService`

This layer contains application services that orchestrate the domain layer to fulfill use cases:

- **Command Handlers**: Process commands and update the system
- **Query Handlers**: Process queries and return data
- **Event Handlers**: Process domain events
- **Application Services**: Coordinate complex operations

Services include:
- UserService
- StudentService
- TeacherService
- CourseService
- RoomService
- OrderService
- BasketService
- CategoryService
- TagService
- EducationPlanService

#### 3. Contracts Layer

Located at: `SRC/01.Core/ArkaSoftwarePro.Src.Core.Contracts`

This layer defines interfaces that decouple the application from infrastructure:

- **Repository Interfaces**: Contracts for data access operations
- **External Service Interfaces**: Contracts for external dependencies
- **Security Interfaces**: Authentication and authorization contracts

#### 4. DTOs/Request-Response Layer

Located at: `SRC/01.Core/ArkaSoftwarePro.Src.Core.RequestResponse`

This layer contains data transfer objects used for communication between layers:

- **Commands**: Requests to change system state
- **Queries**: Requests for data
- **Command Results**: Responses from command operations
- **Query Results**: Responses from query operations

#### 5. Infrastructure Layer

Located at: `SRC/02.Infrastructure`

This layer provides implementations for the contracts defined in the upper layers:

- **Data Access**: Implementation of repositories using Entity Framework Core
- **Security**: Authentication and authorization implementations
- **External Services**: Integration with external systems

#### 6. Presentation Layer

Located at: `SRC/03.Endpoints/ArkaSoftwarePro.Src.Endpoints.API`

This layer exposes the functionality through RESTful APIs:

- **Controllers**: Handle HTTP requests and responses
- **Middleware**: Cross-cutting concerns like authentication, logging
- **SignalR Hubs**: Real-time communication endpoints

## Domain Model Details

### Core Entities

#### User
Represents a system user with authentication and profile information.

Properties:
- Id (long)
- UserName (string)
- Email (string)
- FullName (string)
- PasswordHash (string)
- CreatedDate (DateTime)
- IsActive (bool)

#### Student
Represents a student enrolled in courses.

Properties:
- Id (long)
- UserId (long) - Reference to User
- StudentNumber (string)
- EnrollmentDate (DateTime)
- Status (StudentStatus)

#### Teacher
Represents an instructor teaching courses.

Properties:
- Id (long)
- UserId (long) - Reference to User
- EmployeeNumber (string)
- HireDate (DateTime)
- Specialization (string)
- Qualifications (string)

#### Course
Represents an educational course offered.

Properties:
- Id (long)
- Title (string)
- Description (string)
- CategoryId (long) - Reference to Category
- TeacherId (long) - Reference to Teacher
- Duration (int) - In hours
- Price (decimal)
- CreatedDate (DateTime)
- IsActive (bool)

#### Room
Represents a virtual or physical room for classes.

Properties:
- Id (long)
- Title (string)
- Description (string)
- Capacity (int)
- RoomType (RoomType) - Virtual or Physical
- CreatedDate (DateTime)
- IsActive (bool)

#### Order
Represents a purchase order for courses.

Properties:
- Id (long)
- UserId (long) - Reference to User
- OrderDate (DateTime)
- TotalAmount (decimal)
- Status (OrderStatus)
- OrderItems (List<OrderItem>)

#### Basket
Represents a shopping basket for courses.

Properties:
- Id (long)
- UserId (long) - Reference to User
- CreatedDate (DateTime)
- BasketItems (List<BasketItem>)

#### Article
Represents educational articles and content.

Properties:
- Id (long)
- Title (string)
- Content (string)
- AuthorId (long) - Reference to User
- PublishedDate (DateTime)
- Categories (List<Category>)
- Tags (List<Tag>)
- Comments (List<ArticleComment>)

#### Category
Represents categorization for courses and content.

Properties:
- Id (long)
- Name (string)
- Description (string)
- ParentId (long?) - For hierarchical categories
- CreatedDate (DateTime)
- IsActive (bool)

#### Tag
Represents tags for content organization.

Properties:
- Id (long)
- Name (string)
- CreatedDate (DateTime)
- IsActive (bool)

#### EducationPlan
Represents educational plans and curricula.

Properties:
- Id (long)
- Title (string)
- Description (string)
- Duration (int) - In months
- Price (decimal)
- Courses (List<Course>)
- CreatedDate (DateTime)
- IsActive (bool)

## API Endpoints

### Authentication & User Management

#### User Registration
```
POST /api/Service/User/Create
```
Creates a new user account.

#### User Login
```
POST /api/Service/Account/Login
```
Authenticates a user and returns authentication tokens.

#### Get Current User
```
GET /api/Service/User/GetUser
```
Retrieves information about the currently authenticated user.

#### Update User Profile
```
POST /api/Service/User/UpdateUserFN
```
Updates the full name of the current user.

### Course Management

#### Get Course by ID
```
GET /api/Service/Course/GetById
```
Retrieves a course by its ID.

#### Search Courses
```
GET /api/Service/Course/Search
```
Searches for courses based on criteria.

#### Create Course
```
POST /api/Service/Course/Create
```
Creates a new course.

#### Update Course
```
POST /api/Service/Course/Update
```
Updates an existing course.

### Student Management

#### Create Student
```
POST /api/Service/Student/Create
```
Registers a user as a student.

#### Get Student by ID
```
GET /api/Service/Student/GetById
```
Retrieves a student by ID.

### Teacher Management

#### Add Teacher
```
POST /api/Service/Teacher/Add
```
Registers a user as a teacher.

#### Get Teacher by ID
```
GET /api/Service/Teacher/GetById
```
Retrieves a teacher by ID.

### Room Management

#### Create Room
```
POST /api/Service/Room/Create
```
Creates a new room.

#### Get Room by ID
```
GET /api/Service/Room/GetById
```
Retrieves a room by ID.

#### Get All Rooms
```
GET /api/Service/Room/GetAll
```
Retrieves all rooms.

### Category Management

#### Create Category
```
POST /api/Service/Category/Create
```
Creates a new category.

#### Get Category by ID
```
GET /api/Service/Category/GetById
```
Retrieves a category by ID.

#### Get All Categories
```
GET /api/Service/Category/GetAll
```
Retrieves all categories.

### Order Management

#### Create Order
```
POST /api/Service/Order/Create
```
Creates a new order from the current basket.

#### Get Order by ID
```
GET /api/Service/Order/GetById
```
Retrieves an order by ID.

### Basket Management

#### Add to Basket
```
POST /api/Service/Basket/Add
```
Adds an item to the basket.

#### Remove from Basket
```
POST /api/Service/Basket/Remove
```
Removes an item from the basket.

#### Get Basket
```
GET /api/Service/Basket/Get
```
Retrieves the current user's basket.

### Real-time Communication

#### Chat Hub
```
/hubs/chat
```
SignalR hub for real-time chat functionality.

#### Meeting Hub
```
/meetingHub
```
SignalR hub for real-time meeting functionality.

## Security Implementation

### Authentication Methods

1. **JWT Token Authentication**
   - Stateless authentication using JSON Web Tokens
   - Tokens are signed with a secret key
   - Tokens expire after 120 minutes

2. **Cookie Authentication**
   - Session-based authentication using HTTP cookies
   - Secure cookies with HttpOnly and SameSite settings
   - Cookies expire after 60 minutes

3. **Google OAuth**
   - Social login using Google accounts
   - Integration with Google Identity Platform
   - Secure token exchange

### Authorization Policies

The application implements role-based access control with the following policies:

- **AdminOnly**: Requires ADMIN role
- **CookiePolicy**: Authenticated users with cookie authentication
- **JwtPolicy**: Authenticated users with JWT token authentication
- **SmartPolicy**: Automatically selects between cookie and JWT

### Security Features

- Password hashing using secure algorithms
- Protection against CSRF attacks
- Secure cookie settings (HttpOnly, SameSite, Secure)
- Input validation and sanitization
- Rate limiting for API endpoints
- CORS configuration for allowed origins

## Data Access Layer

### Entity Framework Core Implementation

The application uses Entity Framework Core as the ORM with:

- Separate DbContexts for commands and queries
- Repository pattern implementation
- Unit of Work pattern for transaction management
- Interceptors for audit data and Persian character normalization

### Database Schema

The database schema includes tables for all domain entities with appropriate relationships:

- Users table with authentication information
- Students and Teachers tables with profile data
- Courses table with educational content
- Rooms table for virtual/physical spaces
- Orders and Baskets for commerce functionality
- Articles, Categories, and Tags for content management
- Education Plans for curriculum management

### Caching Strategy

The application implements a multi-level caching strategy:

1. **In-Memory Caching**
   - Fast access for frequently requested data
   - Suitable for single-instance deployments
   - Automatic expiration policies

2. **Redis Distributed Caching**
   - Shared cache across multiple instances
   - Persistent storage with expiration
   - Support for cache invalidation

## Real-time Communication

### SignalR Implementation

The application uses SignalR for real-time communication:

- **Chat Hub**: For messaging between users
- **Meeting Hub**: For real-time meeting functionality
- Connection management and user tracking
- Message broadcasting and private messaging

### WebSocket Configuration

SignalR is configured with:

- Maximum parallel invocations per client
- Message size limits
- Keep-alive intervals
- Client timeout settings
- Detailed error reporting

## Logging and Monitoring

### Serilog Implementation

The application uses Serilog for structured logging with:

- Console output for development
- File logging for persistent storage
- Elasticsearch integration for centralized logging
- Different log levels for various components

### Log Structure

Logs include structured data for:

- Request tracking
- Performance monitoring
- Error diagnostics
- Security auditing
- Business event tracking

## Configuration Management

### Environment-Specific Settings

The application supports multiple environments:

- Development: For local development and testing
- Production: For live deployments

Each environment has its own configuration file with appropriate settings for:

- Database connections
- External service endpoints
- Security settings
- Feature flags
- Performance tuning parameters

### Configuration Sections

Key configuration sections include:

- ConnectionStrings: Database and Redis connections
- Jwt: JWT token settings
- Cookie: Cookie authentication settings
- OAuth: External authentication providers
- Serilog: Logging configuration
- AutoMapper: Object mapping settings
- Swagger: API documentation settings
- DistributedRedisCacheOptions: Redis caching configuration

## Performance Considerations

### Caching Strategy

The application implements caching at multiple levels:

- In-memory caching for frequently accessed data
- Redis distributed caching for shared data
- Cache invalidation strategies
- Cache warming techniques

### Database Optimization

- Indexing strategies for common queries
- Query optimization for performance
- Connection pooling
- Asynchronous database operations

### API Performance

- Response compression
- Efficient serialization
- Pagination for large datasets
- Caching of expensive operations

## Testing Strategy

### Unit Testing

- Test domain entities and value objects
- Test application services and handlers
- Mock external dependencies
- Test edge cases and error conditions

### Integration Testing

- Test database interactions
- Test API endpoints
- Test security and authorization
- Test caching behavior

### Performance Testing

- Load testing for concurrent users
- Stress testing for system limits
- Performance monitoring and profiling

## Deployment Guidelines

### Prerequisites

- .NET 9.0 Runtime
- Microsoft SQL Server
- Redis Server
- SSL/TLS certificates for production
- Reverse proxy (nginx, IIS) for production

### Deployment Steps

1. Build the application:
   ```bash
   dotnet publish -c Release
   ```

2. Configure environment variables:
   - Connection strings
   - Security settings
   - External service credentials

3. Deploy database migrations:
   ```bash
   dotnet ef database update
   ```

4. Start the application:
   ```bash
   dotnet ArkaSoftwarePro.Src.Endpoints.API.dll
   ```

### Scaling Considerations

- Horizontal scaling with load balancers
- Database read replicas for queries
- Redis clustering for distributed caching
- CDN for static content
- Microservices decomposition for large-scale deployments

## Maintenance and Operations

### Monitoring

- Health checks for system components
- Performance metrics collection
- Error rate monitoring
- Resource utilization tracking

### Backup and Recovery

- Regular database backups
- Redis data persistence
- Disaster recovery procedures
- Data retention policies

### Updates and Upgrades

- Versioning strategy
- Database migration procedures
- Zero-downtime deployment techniques
- Rollback procedures

## Troubleshooting Guide

### Common Issues

1. **Database Connection Problems**
   - Check connection strings
   - Verify database server availability
   - Confirm firewall settings

2. **Authentication Failures**
   - Validate JWT token settings
   - Check cookie configuration
   - Verify user credentials

3. **Performance Issues**
   - Review database indexes
   - Check caching configuration
   - Analyze logs for bottlenecks

4. **Real-time Communication Problems**
   - Verify SignalR configuration
   - Check WebSocket support
   - Review connection limits

### Diagnostic Tools

- Application logs
- Database query analysis
- Performance profiling
- Network monitoring
- Memory and CPU usage tracking

## Future Enhancements

### Planned Features

- Mobile application development
- Advanced analytics and reporting
- Machine learning integration for recommendations
- Multi-tenancy support
- Advanced scheduling algorithms
- Video conferencing integration
- Assessment and grading system
- Certificate generation and management

### Architecture Improvements

- Event sourcing implementation
- Microservices decomposition
- GraphQL API endpoints
- Advanced caching strategies
- Improved security measures
- Enhanced monitoring and alerting