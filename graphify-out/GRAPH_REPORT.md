# Graph Report - savvi-backed  (2026-09-19)

## Corpus Check
- 143 files · ~58,714 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 4, .db 1)

## Summary
- 1255 nodes · 2425 edges · 78 communities (47 shown, 31 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 86 edges (avg confidence: 0.81)
- Token cost: 51,475 input · 11,577 output

## Community Hubs (Navigation)
- Database Seeding System
- Categories Module
- Accounts Module
- Transactions Controller
- Transfer Template DTOs
- Budgets Controller
- AI Register Module
- Payment Planner Entities
- Frontend API Contract Docs
- Project Manifest & Imports
- Waiting List Module
- Transfer Template Entity & Cron
- Dev Dependencies
- NestJS Module Wiring
- Auth Service & JWT Setup
- TypeScript Compiler Config
- Runtime Dependencies
- Reminder Entity & Status
- Auth DTOs
- NPM Scripts
- Core TypeORM Migrations
- Reminders Controller
- Payment Registration DTOs
- Auth Controller
- App Bootstrap & Guards
- File Upload Validation Config
- App Root Controller
- Create Debt DTO
- S3 Service Operations
- AWS S3 Client Config
- Confirm Upload DTO
- Budget Module Wiring
- Create Budget DTO
- Jest Test Config
- Budget Detail DTO
- Presigned URL Request DTO
- Presigned Upload Endpoint
- Document Entity
- Update Transaction DTO
- ESLint Configuration
- Transaction Entity
- NestJS CLI Config
- S3 Controller Base
- Presigned URL Query Endpoint
- Upload Files DTO
- Module Path Registration
- Build TSConfig
- Migration: Add Category Type
- Migration: Payment Planner Tables
- Migration: Init 1759400932828
- Migration: Init 1759485537622
- Migration: Init 1764824271452
- Migration: Init 1765858404352
- Migration: Init 1765859774198
- Migration: Init 1765967328751
- Migration: Finance Schema & Accounts
- Migration: Create Users Table
- Migration: Init 1773624575759
- Migration: Init 1773626704216
- Migration: Init 1773626958485
- Migration: Add Recurring To Debts
- Migration: Init 1773745696294
- Migration: Create Budgets Table
- Migration: Add Balance To Accounts
- Migration: Add isCredit To Accounts
- Migration: Transfer Templates Table
- Migration: Create Reminders Table
- Migration: Custom Interval Templates
- Migration: Add userId To Core Tables
- Migration: Add userId To Debts
- Migration: Budget Details Table
- Migration: Amount Auto Calculated
- Migration: Waiting List Table
- Migration: AI Register Jobs Table
- S3 Scaffold DTOs
- Health Check Endpoint
- Waiting List Endpoints Doc
- Test Suites Doc

## God Nodes (most connected - your core abstractions)
1. `typeorm` - 59 edges
2. `@nestjs/common` - 43 edges
3. `@nestjs/swagger` - 42 edges
4. `TransactionsService` - 27 edges
5. `User` - 23 edges
6. `Debt` - 23 edges
7. `S3Service` - 23 edges
8. `TransferTemplate` - 23 edges
9. `compilerOptions` - 23 edges
10. `@nestjs/typeorm` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Swagger / OpenAPI Documentation` --semantically_similar_to--> `Savvi API Endpoint Guide (FRONT.md)`  [INFERRED] [semantically similar]
  README.md → FRONT.md
- `Feature-Module Source Structure` --conceptually_related_to--> `Savvi API Endpoint Guide (FRONT.md)`  [INFERRED]
  README.md → FRONT.md
- `Transactions UI Demo Page` --conceptually_related_to--> `Single-PATCH Transaction Edit with Attachments`  [AMBIGUOUS]
  front/main.html → FRONT.md
- `Transactions UI Demo Page` --conceptually_related_to--> `Savvi API Endpoint Guide (FRONT.md)`  [INFERRED]
  front/main.html → FRONT.md
- `Savvi Backend (README)` --conceptually_related_to--> `Savvi API Endpoint Guide (FRONT.md)`  [INFERRED]
  README.md → FRONT.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **File Attachment Flow (presign, upload, link, limits)** — front_s3_endpoints, front_presigned_upload_flow, front_single_patch_transaction_edit, front_file_limits_and_types, front_transactions_endpoints, readme_aws_s3_storage [EXTRACTED 1.00]
- **Modules That Create Transactions as a Side Effect** — front_payment_planner_endpoints, front_transfer_templates_endpoints, front_ai_register_endpoints, front_transactions_endpoints [INFERRED 0.85]
- **Savvi Backend Technology Stack** — readme_savvi_backend, readme_nestjs_framework, readme_typeorm_postgresql, readme_jwt_passport_auth, readme_aws_s3_storage, readme_swagger_openapi_docs [EXTRACTED 1.00]

## Communities (78 total, 31 thin omitted)

### Community 0 - "Database Seeding System"
Cohesion: 0.07
Nodes (74): ref_dotenv, AppDataSource, dataSourceOptions, ACCOUNT_CATALOG, AccountSeed, AI_JOB_ERRORS, AI_JOB_SAMPLES, CATEGORY_CATALOG (+66 more)

### Community 1 - "Categories Module"
Cohesion: 0.05
Nodes (52): IsHexColor, CategoriesController, ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse (+44 more)

### Community 2 - "Accounts Module"
Cohesion: 0.05
Nodes (47): Matches, @nestjs/testing, ref_transactions_controller, AccountsController, ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse (+39 more)

### Community 3 - "Transactions Controller"
Cohesion: 0.08
Nodes (38): ApiBody, ApiConsumes, ApiExtraModels, TransactionsController, ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse (+30 more)

### Community 4 - "Transfer Template DTOs"
Cohesion: 0.05
Nodes (49): CreateTransferTemplateDto, RecurrenceType, TRANSFER_FREQUENCY_VALUES, TRANSFER_RECURRENCE_VALUES, TransferFrequency, ApiProperty, ApiPropertyOptional, IsIn (+41 more)

### Community 5 - "Budgets Controller"
Cohesion: 0.07
Nodes (40): BudgetsController, ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation (+32 more)

### Community 6 - "AI Register Module"
Cohesion: 0.05
Nodes (38): AiRegisterController, ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags, ApiUnauthorizedResponse, Body (+30 more)

### Community 7 - "Payment Planner Entities"
Cohesion: 0.07
Nodes (40): Debt, DebtStatus, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany (+32 more)

### Community 8 - "Frontend API Contract Docs"
Cohesion: 0.07
Nodes (41): Accounts Endpoints, Asynchronous AI Job Polling, AI Register Jobs Endpoints, Auth Endpoints (register / login), amountAutoCalculated Budget Mode, Budget Upsert by Category + Year + Month, Budgets Endpoints and Details, Categories Endpoints (+33 more)

### Community 9 - "Project Manifest & Imports"
Cohesion: 0.05
Nodes (37): author, description, license, name, private, version, bcrypt, eslint (+29 more)

### Community 10 - "Waiting List Module"
Cohesion: 0.08
Nodes (29): CreateWaitingListDto, ApiProperty, ApiPropertyOptional, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength (+21 more)

### Community 11 - "Transfer Template Entity & Cron"
Cohesion: 0.10
Nodes (14): Cron, TransferTemplate, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn (+6 more)

### Community 12 - "Dev Dependencies"
Cohesion: 0.07
Nodes (28): devDependencies, eslint, eslint-config-prettier, @eslint/eslintrc, @eslint/js, eslint-plugin-prettier, globals, jest (+20 more)

### Community 13 - "NestJS Module Wiring"
Cohesion: 0.16
Nodes (17): @nestjs/typeorm, AccountsModule, Module, AiRegisterModule, Module, BudgetsModule, Module, CategoriesModule (+9 more)

### Community 14 - "Auth Service & JWT Setup"
Cohesion: 0.12
Nodes (16): @nestjs/jwt, @nestjs/passport, AuthModule, Module, AuthService, Injectable, InjectRepository, Column (+8 more)

### Community 15 - "TypeScript Compiler Config"
Cohesion: 0.08
Nodes (24): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames (+16 more)

### Community 16 - "Runtime Dependencies"
Cohesion: 0.09
Nodes (22): dependencies, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, bcrypt, class-transformer, class-validator, @nestjs/common, @nestjs/core (+14 more)

### Community 17 - "Reminder Entity & Status"
Cohesion: 0.17
Nodes (13): Reminder, ReminderStatus, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, TransferTemplateFrequency (+5 more)

### Community 18 - "Auth DTOs"
Cohesion: 0.13
Nodes (15): MinLength, AuthResponseDto, AuthUserDto, ApiProperty, LoginDto, ApiProperty, IsEmail, IsNotEmpty (+7 more)

### Community 19 - "NPM Scripts"
Cohesion: 0.11
Nodes (18): scripts, build, format, lint, migration:generate, migration:revert, migration:run, seed (+10 more)

### Community 20 - "Core TypeORM Migrations"
Cohesion: 0.11
Nodes (5): typeorm, InitMigration1759125617618, InitMigration1765859575559, AddCreditCardFieldsToAccounts1773830000000, AddAccountIdToDebts1773840000000

### Community 21 - "Reminders Controller"
Cohesion: 0.13
Nodes (14): RemindersController, ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags, ApiUnauthorizedResponse (+6 more)

### Community 22 - "Payment Registration DTOs"
Cohesion: 0.18
Nodes (12): DEBT_RECURRENCE_VALUES, DebtRecurrenceType, RegisterPaymentDto, ApiProperty, ApiPropertyOptional, IsDateString, IsNumber, IsOptional (+4 more)

### Community 23 - "Auth Controller"
Cohesion: 0.16
Nodes (12): HttpCode, AuthController, ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags (+4 more)

### Community 24 - "App Bootstrap & Guards"
Cohesion: 0.20
Nodes (7): @nestjs/common, @nestjs/core, AppModule, Module, JwtAuthGuard, Injectable, AuthenticatedUser

### Community 25 - "File Upload Validation Config"
Cohesion: 0.25
Nodes (7): class-transformer, class-validator, ref_express, ref_multer, @nestjs/platform-express, multerConfig, ALLOWED_CONTENT_TYPES

### Community 26 - "App Root Controller"
Cohesion: 0.21
Nodes (8): AppController, ApiOkResponse, ApiOperation, ApiTags, Controller, Get, AppService, Injectable

### Community 27 - "Create Debt DTO"
Cohesion: 0.15
Nodes (13): CreateDebtDto, ApiProperty, ApiPropertyOptional, IsBoolean, IsDateString, IsIn, IsInt, IsNumber (+5 more)

### Community 28 - "S3 Service Operations"
Cohesion: 0.23
Nodes (3): PresignedUrlResponseDto, S3Service, Injectable

### Community 29 - "AWS S3 Client Config"
Cohesion: 0.23
Nodes (8): @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, ref_fs, ref_mime_types, ref_stream, bucket, s3Client, UploadS3Response

### Community 30 - "Confirm Upload DTO"
Cohesion: 0.22
Nodes (11): ArrayMinSize, ConfirmUploadDto, ApiProperty, IsArray, IsInt, IsNotEmpty, IsString, Min (+3 more)

### Community 31 - "Budget Module Wiring"
Cohesion: 0.44
Nodes (5): @nestjs/swagger, BUDGET_PERIOD_VALUES, BudgetPeriod, UpdateBudgetDetailDto, UpdateBudgetDto

### Community 32 - "Create Budget DTO"
Cohesion: 0.18
Nodes (11): CreateBudgetDto, ApiProperty, ApiPropertyOptional, IsBoolean, IsIn, IsInt, IsNumber, IsOptional (+3 more)

### Community 33 - "Jest Test Config"
Cohesion: 0.22
Nodes (9): jest, collectCoverageFrom, coverageDirectory, moduleFileExtensions, rootDir, testEnvironment, testRegex, transform (+1 more)

### Community 34 - "Budget Detail DTO"
Cohesion: 0.22
Nodes (9): CreateBudgetDetailDto, ApiProperty, ApiPropertyOptional, IsInt, IsNumber, IsOptional, IsString, MaxLength (+1 more)

### Community 35 - "Presigned URL Request DTO"
Cohesion: 0.22
Nodes (9): CreatePresignedUrlDto, ApiProperty, ApiPropertyOptional, IsInt, IsNotEmpty, IsOptional, IsString, Max (+1 more)

### Community 36 - "Presigned Upload Endpoint"
Cohesion: 0.22
Nodes (6): CreatePresignedUploadResponseDto, ApiProperty, ApiBadRequestResponse, ApiCreatedResponse, Body, Post

### Community 37 - "Document Entity"
Cohesion: 0.22
Nodes (7): Document, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, InjectRepository

### Community 38 - "Update Transaction DTO"
Cohesion: 0.25
Nodes (8): ArrayMaxSize, ApiPropertyOptional, IsArray, IsOptional, IsUUID, Type, ValidateNested, UpdateTransactionDto

### Community 39 - "ESLint Configuration"
Cohesion: 0.25
Nodes (6): @eslint/js, eslint-plugin-prettier, globals, ref_node_path, ref_node_url, typescript-eslint

### Community 40 - "Transaction Entity"
Cohesion: 0.25
Nodes (7): Transaction, TransactionFile, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn

### Community 41 - "NestJS CLI Config"
Cohesion: 0.29
Nodes (6): collection, compilerOptions, deleteOutDir, plugins, $schema, sourceRoot

### Community 42 - "S3 Controller Base"
Cohesion: 0.29
Nodes (6): S3Controller, ApiBearerAuth, ApiTags, ApiUnauthorizedResponse, Controller, UseGuards

### Community 43 - "Presigned URL Query Endpoint"
Cohesion: 0.33
Nodes (5): ApiQuery, Query, ApiOkResponse, ApiOperation, Get

### Community 44 - "Upload Files DTO"
Cohesion: 0.40
Nodes (4): ApiProperty, IsNotEmpty, IsString, UploadTransactionFilesDto

### Community 45 - "Module Path Registration"
Cohesion: 0.50
Nodes (3): ref_path, distDir, path

### Community 46 - "Build TSConfig"
Cohesion: 0.50
Nodes (3): ./tsconfig.json, exclude, extends

## Ambiguous Edges - Review These
- `Single-PATCH Transaction Edit with Attachments` → `Transactions UI Demo Page`  [AMBIGUOUS]
  front/main.html · relation: conceptually_related_to

## Knowledge Gaps
- **179 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `plugins` (+174 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 632 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Single-PATCH Transaction Edit with Attachments` and `Transactions UI Demo Page`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `typeorm` connect `Core TypeORM Migrations` to `Database Seeding System`, `Categories Module`, `Accounts Module`, `Budgets Controller`, `AI Register Module`, `Payment Planner Entities`, `Project Manifest & Imports`, `Waiting List Module`, `NestJS Module Wiring`, `Auth Service & JWT Setup`, `Reminder Entity & Status`, `Payment Registration DTOs`, `File Upload Validation Config`, `Budget Module Wiring`, `Document Entity`, `Transaction Entity`, `Migration: Add Category Type`, `Migration: Payment Planner Tables`, `Migration: Init 1759400932828`, `Migration: Init 1759485537622`, `Migration: Init 1764824271452`, `Migration: Init 1765858404352`, `Migration: Init 1765859774198`, `Migration: Init 1765967328751`, `Migration: Finance Schema & Accounts`, `Migration: Create Users Table`, `Migration: Init 1773624575759`, `Migration: Init 1773626704216`, `Migration: Init 1773626958485`, `Migration: Add Recurring To Debts`, `Migration: Init 1773745696294`, `Migration: Create Budgets Table`, `Migration: Add Balance To Accounts`, `Migration: Add isCredit To Accounts`, `Migration: Transfer Templates Table`, `Migration: Create Reminders Table`, `Migration: Custom Interval Templates`, `Migration: Add userId To Core Tables`, `Migration: Add userId To Debts`, `Migration: Budget Details Table`, `Migration: Amount Auto Calculated`, `Migration: Waiting List Table`, `Migration: AI Register Jobs Table`?**
  _High betweenness centrality (0.244) - this node is a cross-community bridge._
- **Why does `@nestjs/common` connect `App Bootstrap & Guards` to `Categories Module`, `Accounts Module`, `Transfer Template DTOs`, `AI Register Module`, `Project Manifest & Imports`, `Waiting List Module`, `NestJS Module Wiring`, `Auth Service & JWT Setup`, `Reminder Entity & Status`, `Auth DTOs`, `Payment Registration DTOs`, `File Upload Validation Config`, `App Root Controller`, `AWS S3 Client Config`, `Budget Module Wiring`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Why does `@nestjs/swagger` connect `Budget Module Wiring` to `Categories Module`, `Accounts Module`, `Presigned Upload Endpoint`, `Transfer Template DTOs`, `AI Register Module`, `Project Manifest & Imports`, `S3 Scaffold DTOs`, `Waiting List Module`, `Upload Files DTO`, `Auth DTOs`, `Payment Registration DTOs`, `App Bootstrap & Guards`, `File Upload Validation Config`, `App Root Controller`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _179 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Database Seeding System` be split into smaller, more focused modules?**
  _Cohesion score 0.06815968841285297 - nodes in this community are weakly interconnected._
- **Should `Categories Module` be split into smaller, more focused modules?**
  _Cohesion score 0.053208137715179966 - nodes in this community are weakly interconnected._