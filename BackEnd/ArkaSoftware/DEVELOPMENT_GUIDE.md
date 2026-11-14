# ArkaSoftware - Development Guide

## Getting Started

This guide will help you set up your development environment and understand the development workflow for the ArkaSoftware project.

### Prerequisites

Before you begin, ensure you have the following installed:

1. **.NET 9.0 SDK** - Download from [Microsoft's official website](https://dotnet.microsoft.com/download/dotnet/9.0)
2. **Visual Studio 2022** or **Visual Studio Code** with C# extensions
3. **Microsoft SQL Server** (Express edition is sufficient for development)
4. **Redis Server** - For caching functionality
5. **Git** - For version control
6. **Postman** or similar API testing tool (optional but recommended)

### Environment Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd ArkaSoftware
   ```

2. **Restore NuGet Packages**
   ```bash
   dotnet restore
   ```

3. **Database Setup**
   - Update the connection string in `appsettings.Development.json`
   - Run database migrations (if any exist)

4. **Redis Setup**
   - Install Redis server locally
   - Ensure Redis is running on the default port (6379)

5. **Configure Application Settings**
   - Review and update `appsettings.Development.json` as needed
   - Pay special attention to connection strings and authentication settings

## Project Structure Understanding

### Solution Overview

The solution is organized into three main folders:

1. **01.Core** - Contains the domain, application, contracts, and DTO layers
2. **02.Infrastructure** - Contains data access and security implementations
3. **03.Endpoints** - Contains the API presentation layer

### Core Projects

#### ArkaSoftwarePro.Src.Core.Domain
This project contains all domain entities, aggregates, and business logic. Key concepts:

- **Aggregates** are organized in folders (e.g., UserAggregate, CourseAggregate)
- Each aggregate contains its entities and value objects
- Domain events are defined within aggregates

#### ArkaSoftwarePro.Src.Core.ApplicationService
This project contains application services and handlers:

- **Command Handlers** process commands that change system state
- **Query Handlers** process queries that retrieve data
- **Event Handlers** process domain events

#### ArkaSoftwarePro.Src.Core.Contracts
This project defines interfaces for repositories and external services:

- **Repository Interfaces** define data access contracts
- **Service Interfaces** define contracts for external dependencies

#### ArkaSoftwarePro.Src.Core.RequestResponse
This project contains DTOs for communication:

- **Commands** represent requests to change system state
- **Queries** represent requests for data
- **Validators** ensure data integrity

### Infrastructure Projects

#### Data Projects
- **MSSQL.Commands** - Implementation of command repositories
- **MSSQL.Queries** - Implementation of query repositories
- **Redis.Commands** - Redis-based command implementations
- **Redis.Queries** - Redis-based query implementations

#### Security Projects
- **ArkaSoftwarePro.Src.Infrastructure.Security.IMP** - Security implementations

### Endpoints Project

#### ArkaSoftwarePro.Src.Endpoints.API
This project contains the API controllers and startup configuration:

- **Controllers** handle HTTP requests
- **Hubs** handle real-time communication
- **Extensions** configure services and middleware

## Development Workflow

### Adding a New Feature

1. **Define the Domain Model**
   - Identify the aggregate this feature belongs to
   - Create entities and value objects in the Domain project
   - Define domain events if needed

2. **Create DTOs**
   - Define commands for state-changing operations
   - Define queries for data retrieval
   - Create validators for input validation

3. **Define Contracts**
   - Add repository interfaces in the Contracts project
   - Add service interfaces if needed

4. **Implement Application Services**
   - Create command handlers for state-changing operations
   - Create query handlers for data retrieval
   - Implement event handlers if needed

5. **Implement Infrastructure**
   - Implement repository interfaces in the data projects
   - Implement service interfaces in appropriate projects

6. **Expose via API**
   - Add controller methods in the appropriate controller
   - Configure routing and authorization as needed

### Example: Adding a New Course Feature

1. **Domain Layer**
   ```csharp
   // In ArkaSoftwarePro.Src.Core.Domain/CoursesAggregate/Entities/Course.cs
   public class Course : AggregateRoot
   {
       public string Title { get; private set; }
       public string Description { get; private set; }
       public decimal Price { get; private set; }
       
       // Constructor and methods...
   }
   ```

2. **DTOs**
   ```csharp
   // In ArkaSoftwarePro.Src.Core.RequestResponse/Courses/Commands/CreateCourse/CreateCourseCommand.cs
   public class CreateCourseCommand : ICommand<long>
   {
       public string Title { get; set; }
       public string Description { get; set; }
       public decimal Price { get; set; }
   }
   ```

3. **Contracts**
   ```csharp
   // In ArkaSoftwarePro.Src.Core.Contracts/Courses/CourseRepositoryContracts/ICommandRepository.cs
   public interface ICourseCommandRepository : ICommandRepository<Course, long>
   {
   }
   ```

4. **Application Service**
   ```csharp
   // In ArkaSoftwarePro.Src.Core.ApplicationService/CoursesServices/Commands/CreateCourseCommandHandler.cs
   public class CreateCourseCommandHandler : CommandHandler<CreateCourseCommand, long>
   {
       private readonly ICourseCommandRepository _courseRepository;
       
       public override async Task<CommandResult<long>> Handle(CreateCourseCommand command)
       {
           // Implementation...
       }
   }
   ```

5. **Infrastructure**
   ```csharp
   // In ArkaSoftwarePro.Src.Infrastructure.Data.MSSQL.Commands/CourseCommandRepository.cs
   public class CourseCommandRepository : BaseCommandRepository<Course>, ICourseCommandRepository
   {
       // Implementation...
   }
   ```

6. **API Endpoint**
   ```csharp
   // In ArkaSoftwarePro.Src.Endpoints.API/Controllers/CourseController.cs
   [HttpPost("Create")]
   public async Task<IActionResult> CreateCourse(CreateCourseCommand command)
   {
       return await Create<CreateCourseCommand, long>(command);
   }
   ```

## Code Standards and Best Practices

### Naming Conventions

- **Classes**: PascalCase (e.g., `UserService`)
- **Methods**: PascalCase (e.g., `GetUserById`)
- **Variables**: camelCase (e.g., `userName`)
- **Constants**: PascalCase (e.g., `MaxRetryAttempts`)
- **Interfaces**: Prefix with `I` (e.g., `IUserRepository`)

### Coding Practices

1. **SOLID Principles**
   - Single Responsibility Principle: Each class should have one reason to change
   - Open/Closed Principle: Classes should be open for extension but closed for modification
   - Liskov Substitution Principle: Subtypes must be substitutable for their base types
   - Interface Segregation Principle: Clients should not be forced to depend on interfaces they don't use
   - Dependency Inversion Principle: Depend on abstractions, not concretions

2. **Domain-Driven Design Patterns**
   - Use aggregates to maintain consistency boundaries
   - Favor domain events for cross-aggregate communication
   - Keep entities focused on identity and lifecycle
   - Use value objects for attributes without identity

3. **Error Handling**
   - Use Result pattern for expected errors
   - Throw exceptions only for unexpected errors
   - Log errors appropriately with context
   - Provide meaningful error messages to clients

4. **Security**
   - Validate all input data
   - Sanitize user input to prevent injection attacks
   - Use parameterized queries to prevent SQL injection
   - Implement proper authentication and authorization
   - Hash passwords securely

### Testing Guidelines

1. **Unit Tests**
   - Test domain entities and value objects
   - Test application service handlers
   - Mock external dependencies
   - Focus on behavior, not implementation details

2. **Integration Tests**
   - Test database interactions
   - Test API endpoints
   - Test security and authorization
   - Test caching behavior

3. **Test Structure**
   - Arrange: Set up test data and dependencies
   - Act: Execute the method under test
   - Assert: Verify the expected outcome

## Debugging and Troubleshooting

### Common Development Issues

1. **Dependency Injection Issues**
   - Ensure all interfaces are registered in `Startup.cs`
   - Check for circular dependencies
   - Verify service lifetimes (Scoped, Transient, Singleton)

2. **Database Connection Problems**
   - Verify connection strings in `appsettings.Development.json`
   - Check SQL Server is running
   - Ensure user has appropriate permissions

3. **Authentication Issues**
   - Verify JWT settings in configuration
   - Check cookie configuration
   - Ensure authentication middleware is properly configured

4. **Caching Issues**
   - Verify Redis server is running
   - Check Redis connection string
   - Ensure cache keys are properly formatted

### Debugging Tools

1. **Visual Studio Debugger**
   - Set breakpoints in code
   - Inspect variables and objects
   - Step through code execution

2. **Logging**
   - Use Serilog for structured logging
   - Enable verbose logging for debugging
   - Check log files in the Logs directory

3. **API Testing**
   - Use Postman to test API endpoints
   - Verify request/response formats
   - Test authentication and authorization

## Building and Deployment

### Local Development

1. **Running the Application**
   ```bash
   cd SRC/03.Endpoints/ArkaSoftwarePro.Src.Endpoints.API
   dotnet run
   ```

2. **Running Tests**
   ```bash
   dotnet test
   ```

3. **Building for Production**
   ```bash
   dotnet publish -c Release
   ```

### Deployment Considerations

1. **Environment Configuration**
   - Use `appsettings.Production.json` for production settings
   - Set environment variables for sensitive configuration
   - Configure SSL/TLS certificates

2. **Performance Optimization**
   - Enable response compression
   - Configure appropriate caching strategies
   - Optimize database queries
   - Use connection pooling

3. **Monitoring and Logging**
   - Configure centralized logging (Elasticsearch)
   - Set up health checks
   - Monitor performance metrics
   - Configure alerting for critical issues

## Contributing Guidelines

### Git Workflow

1. **Branching Strategy**
   - Use feature branches for new development
   - Branch from `develop` for new features
   - Merge back to `develop` via pull requests

2. **Commit Messages**
   - Use clear, descriptive commit messages
   - Follow conventional commit format when possible
   - Reference issue numbers when applicable

3. **Pull Requests**
   - Ensure code compiles and tests pass
   - Include appropriate documentation updates
   - Have code reviewed by team members
   - Squash commits when merging

### Code Review Process

1. **Review Checklist**
   - Does the code follow established patterns?
   - Are there appropriate unit tests?
   - Is error handling implemented correctly?
   - Is the code secure?
   - Is documentation updated?

2. **Review Guidelines**
   - Be constructive and helpful
   - Focus on the code, not the developer
   - Ask questions to understand intent
   - Suggest improvements rather than just pointing out issues

## Tools and Extensions

### Recommended Visual Studio Extensions

1. **Productivity**
   - ReSharper or Visual Assist for code analysis
   - EditorConfig Language Service for consistent formatting
   - File Icons for better file type recognition

2. **Debugging**
   - OzCode for enhanced debugging capabilities
   - CodeMaid for code cleanup and organization

3. **Git Integration**
   - Git Extensions for visual Git operations
   - GitHub Extension for Visual Studio

### Recommended VS Code Extensions

1. **C# Development**
   - C# (powered by OmniSharp)
   - C# Extensions
   - .NET Core Test Explorer

2. **Productivity**
   - EditorConfig for VS Code
   - GitLens for enhanced Git capabilities
   - Bracket Pair Colorizer

3. **Documentation**
   - Markdown All in One
   - Markdown Preview Enhanced

## Frequently Asked Questions

### How do I add a new domain entity?

1. Create a new folder in the appropriate aggregate in the Domain project
2. Create your entity class inheriting from `Entity` or `AggregateRoot`
3. Add properties and methods that represent the entity's behavior
4. Create corresponding DTOs in the RequestResponse project
5. Define repository interfaces in the Contracts project
6. Implement the repository in the Infrastructure project

### How do I expose a new API endpoint?

1. Create command/query DTOs in the RequestResponse project
2. Create command/query handlers in the ApplicationService project
3. Add a method to the appropriate controller in the API project
4. Ensure proper routing and authorization attributes
5. Test the endpoint with Postman or similar tools

### How do I configure a new database table?

1. Add the entity to the appropriate DbContext in the Infrastructure project
2. Create any necessary Fluent API configurations
3. Add any required indexes or constraints
4. Run migrations to update the database schema

### How do I add caching for a new feature?

1. Determine what data needs to be cached
2. Choose appropriate cache expiration policies
3. Implement caching in the repository or service layer
4. Use the existing Redis or in-memory caching infrastructure
5. Test cache hit/miss scenarios

### How do I handle errors in the application?

1. Use the CommandResult/QueryResult pattern for expected errors
2. Return appropriate HTTP status codes from API endpoints
3. Log errors with sufficient context for debugging
4. Provide user-friendly error messages without exposing sensitive information
5. Implement global exception handling middleware for unexpected errors

This guide should help you get started with development on the ArkaSoftware project. As you work with the codebase, you'll become more familiar with its patterns and conventions. Don't hesitate to ask questions or seek help from other team members when needed.