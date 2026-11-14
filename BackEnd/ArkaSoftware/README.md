# ArkaSoftware - Educational Management System

## Overview

ArkaSoftware is a comprehensive educational management system built with .NET and following Domain-Driven Design (DDD) principles. This application provides a robust platform for managing educational institutions, including features for students, teachers, courses, rooms, and more.

The system is designed with a clean architecture that separates concerns into distinct layers, making it maintainable, testable, and scalable.

## Documentation Files

This repository contains several documentation files to help you understand and work with the system:

- [README.md](README.md) - This file, providing a high-level overview of the system
- [DOCUMENTATION.md](DOCUMENTATION.md) - Detailed technical documentation covering architecture, domain model, and implementation details
- [ARCHITECTURE.md](ARCHITECTURE.md) - Visual diagrams showing the system architecture and data flow
- [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) - Guide for developers working with the codebase

Each file provides different perspectives on the system, from high-level overviews to detailed implementation guidance.

## Table of Contents

- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Domain Model](#domain-model)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Authentication & Authorization](#authentication--authorization)
- [Database](#database)
- [Caching](#caching)
- [Logging](#logging)
- [Deployment](#deployment)
- [License](#license)

## Architecture

The application follows a layered architecture based on Domain-Driven Design principles:

1. **Domain Layer** (`01.Core/ArkaSoftwarePro.Src.Core.Domain`)
   - Contains the core business logic and domain entities
   - Implements aggregates, entities, value objects, and domain events
   - Independent of any infrastructure concerns

2. **Application Layer** (`01.Core/ArkaSoftwarePro.Src.Core.ApplicationService`)
   - Contains application services and use case implementations
   - Coordinates between domain layer and infrastructure
   - Handles cross-cutting concerns like validation and security

3. **Contracts Layer** (`01.Core/ArkaSoftwarePro.Src.Core.Contracts`)
   - Defines interfaces for repositories and external services
   - Acts as a contract between layers

4. **DTOs/Request-Response Layer** (`01.Core/ArkaSoftwarePro.Src.Core.RequestResponse`)
   - Contains data transfer objects for communication between layers
   - Defines command and query models

5. **Infrastructure Layer** (`02.Infrastructure`)
   - Implements data access (MSSQL, Redis)
   - Provides security implementations
   - Handles external service integrations

6. **Presentation Layer** (`03.Endpoints`)
   - Exposes the API endpoints
   - Handles HTTP requests and responses
   - Implements authentication and authorization

## Technology Stack

- **Framework**: .NET 9.0
- **Architecture**: Domain-Driven Design (DDD), Clean Architecture
- **Database**: Microsoft SQL Server
- **Caching**: Redis, In-Memory
- **Authentication**: JWT, Cookie-based, Google OAuth
- **API Documentation**: Swagger/OpenAPI
- **Logging**: Serilog with Elasticsearch integration
- **ORM**: Entity Framework Core
- **Mapping**: AutoMapper
- **Validation**: FluentValidation
- **Real-time Communication**: SignalR
- **Dependency Injection**: Built-in .NET DI container

## Domain Model

The domain model consists of several aggregates:

- **User**: Represents system users with authentication and profile information
- **Student**: Represents students enrolled in courses
- **Teacher**: Represents instructors teaching courses
- **Course**: Represents educational courses offered
- **Category**: Categorization for courses and content
- **EducationPlan**: Educational plans and curricula
- **Room**: Virtual or physical rooms for classes and meetings
- **Order**: Purchase orders for courses
- **Basket**: Shopping basket functionality
- **Article**: Educational articles and content
- **Tag**: Tagging system for content organization
- **Enrollment**: Student enrollment in courses
- **ClassSchedule**: Scheduling for classes and meetings

## Key Features

- **User Management**: Registration, authentication, and profile management
- **Course Management**: Create, update, and manage educational courses
- **Student Enrollment**: Enroll students in courses and track progress
- **Teacher Management**: Manage instructors and their assignments
- **Room Management**: Virtual classrooms and meeting rooms
- **Educational Plans**: Curriculum and learning path management
- **Content Management**: Articles, categories, and tagging system
- **Shopping System**: Basket and order processing
- **Real-time Communication**: Chat and meeting functionality with SignalR
- **Multi-language Support**: Persian and English localization
- **Caching**: Distributed and in-memory caching for performance
- **Security**: JWT, cookie authentication, and Google OAuth
- **Logging**: Comprehensive logging with Serilog and Elasticsearch

## Project Structure

```
ArkaSoftware/
├── SRC/
│   ├── 01.Core/
│   │   ├── ArkaSoftwarePro.Src.Core.ApplicationService/
│   │   ├── ArkaSoftwarePro.Src.Core.Contracts/
│   │   ├── ArkaSoftwarePro.Src.Core.Domain/
│   │   └── ArkaSoftwarePro.Src.Core.RequestResponse/
│   ├── 02.Infrastructure/
│   │   ├── Data/
│   │   │   ├── MSSQL/
│   │   │   └── Redis/
│   │   └── Security/
│   └── 03.Endpoints/
│       └── ArkaSoftwarePro.Src.Endpoints.API/
├── LICENSE.txt
└── README.md
```

## Getting Started

### Prerequisites

- .NET 9.0 SDK
- Microsoft SQL Server
- Redis Server
- Visual Studio or Visual Studio Code

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```bash
   cd ArkaSoftware
   ```

3. Restore NuGet packages:
   ```bash
   dotnet restore
   ```

4. Update the connection strings in `appsettings.Development.json`:
   ```json
   "ConnectionStrings": {
     "LocalDB": "Data source = .; initial catalog= ArkaSoftwareCMP_MNG_Db_V1 ; User = sa ; password=your_password; TrustServerCertificate=True ; MultipleActiveResultSets=true"
   }
   ```

5. Run the application:
   ```bash
   cd SRC/03.Endpoints/ArkaSoftwarePro.Src.Endpoints.API
   dotnet run
   ```

## Configuration

The application uses `appsettings.json` files for configuration:

- `appsettings.json`: Base configuration
- `appsettings.Development.json`: Development environment settings
- `appsettings.Production.json`: Production environment settings

Key configuration sections include:

- Connection strings for database and Redis
- JWT and cookie authentication settings
- Swagger documentation settings
- Serilog logging configuration
- Google OAuth credentials
- Caching options
- Translation settings

## API Documentation

The API is documented using Swagger/OpenAPI. Once the application is running, you can access the documentation at:

```
https://localhost:5001/swagger
```

The API follows RESTful principles and uses standard HTTP methods:

- `GET` for retrieving resources
- `POST` for creating resources
- `PUT` for updating resources
- `DELETE` for removing resources

## Authentication & Authorization

The application supports multiple authentication methods:

1. **JWT Token Authentication**: For API clients
2. **Cookie Authentication**: For web clients
3. **Google OAuth**: For social login

### JWT Configuration

JWT tokens are configured with:
- Issuer: `https://localhost:5001`
- Audience: `https://localhost:5001`
- Signing Key: `ArkaSoftwareCMP_MNG_ThisBiGShopingCourseAndPortfolio_Nice`
- Lifetime: 120 minutes

### Authorization Policies

The application defines several authorization policies:
- `CookiePolicy`: For cookie-based authentication
- `JwtPolicy`: For JWT token authentication
- `SmartPolicy`: Automatically selects between cookie and JWT
- `AdminOnly`: Requires ADMIN role

## Database

The application uses Microsoft SQL Server as its primary data store with Entity Framework Core as the ORM.

### Connection String

The default connection string is configured in `appsettings.Development.json`:

```json
"ConnectionStrings": {
  "LocalDB": "Data source = .; initial catalog= ArkaSoftwareCMP_MNG_Db_V1 ; User = sa ; password=$@deeasRA2731(2^2); TrustServerCertificate=True ; MultipleActiveResultSets=true"
}
```

### Database Contexts

The application uses separate contexts for commands and queries:
- `ArkaSoftwareCommandDbContext`: For write operations
- `ArkaSoftwareQueryDbContext`: For read operations

## Caching

The application implements both in-memory and distributed caching:

1. **In-Memory Caching**: For frequently accessed data with short lifetimes
2. **Redis Caching**: For distributed caching across multiple instances

Cache configuration in `appsettings.Development.json`:

```json
"DistributedRedisCacheOptions": {
  "Configuration": "127.0.0.1:6379",
  "InstanceName": "ArkaSoftware.MSG."
}
```

## Logging

The application uses Serilog for structured logging with multiple sinks:

- Console output
- File logging
- Elasticsearch integration

Logging configuration includes:
- Different log levels for various namespaces
- Structured logging for better searchability
- Performance monitoring capabilities

## Deployment

### Environment-Specific Configuration

The application supports different environments through configuration files:
- Development
- Production

Each environment has its own `appsettings.{Environment}.json` file.

### Production Considerations

For production deployment, ensure:
1. Secure connection strings
2. Proper JWT signing keys
3. Configured Redis server
4. SSL/TLS certificates
5. Proper logging and monitoring
6. Backup and disaster recovery procedures

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE.txt](LICENSE.txt) file for details.

## Support

For support, please contact the development team or create an issue in the repository.