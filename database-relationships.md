```markdown
# Database Schema and Relationships Documentation

## Overview

This document outlines the database schema and relationships for the educational platform. The system uses Firestore, a NoSQL database, with collections representing different entities and their relationships.

## Collections and Schemas

### 1. Users Collection

**Path:** `users/{userId}`

**Description:** Stores all user information including students, members, tutors, and admins.

**Schema:**
```javascript
{
  uid: string,               // Firebase Authentication UID
  displayName: string,         // User's display name
  email: string,              // User's email address
  role: string,              // User role: 'viewer', 'member', 'tutor', 'admin'
  subscriptionStatus: string,  // 'active' or 'inactive'
  subscriptionEnd: timestamp,  // Date when subscription expires
  createdAt: timestamp,       // When the user account was created
  updatedAt: timestamp        // Last update timestamp
}
```

### 2. Admins Collection

**Path:** `admins/{adminId}`

**Description:** Stores admin-specific information for users with admin privileges.

**Schema:**
```javascript
{
  uid: string,               // Firebase Authentication UID (same as Users collection)
  role: string,              // Always 'admin'
  createdAt: timestamp,       // When admin status was granted
}
```

**Relationship:** 
- One-to-one with Users collection (via `uid`)
- A user can be an admin, but not all users are admins

### 3. Tutors Collection

**Path:** `tutors/{tutorId}`

**Description:** Stores tutor-specific information for users with tutor privileges.

**Schema:**
```javascript
{
  uid: string,               // Firebase Authentication UID (same as Users collection)
  email: string,              // Tutor's email address
  displayName: string,         // Tutor's display name
  role: string,              // Always 'tutor'
  assignedCourses: array,     // Array of course IDs assigned to this tutor
  createdAt: timestamp,       // When tutor status was granted
}
```

**Relationship:** 
- One-to-one with Users collection (via `uid`)
- A user can be a tutor, but not all users are tutors
- Many-to-many with Courses collection (via `assignedCourses`)

### 4. Courses Collection

**Path:** `courses/{courseId}`

**Description:** Stores course information including details, modules, and metadata.

**Schema:**
```javascript
{
  title: string,              // Course title
  description: string,        // Course description
  targetPrograms: array,      // Array of target programs (e.g., ['Computer Science', 'Mathematics'])
  targetYears: array,        // Array of target years (e.g., ['1st Year', '2nd Year'])
  modules: array,             // Array of modules in the course
  createdAt: timestamp,       // When the course was created
  updatedAt: timestamp        // Last update timestamp
}
```

**Relationship:** 
- Many-to-many with Tutors collection (via `assignedCourses` in Tutors)
- One-to-many with Assessments collection (via `courseId` or `courseName`)

### 5. Modules (Subcollection of Courses)

**Path:** `courses/{courseId}/modules/{moduleId}`

**Description:** Stores module information within each course.

**Schema:**
```javascript
{
  id: string,                // Module ID
  title: string,              // Module title
  order: number,              // Order of module within course
  content: array,             // Array of content items in the module
  createdAt: timestamp,       // When the module was created
}
```

**Relationship:** 
- Belongs to one Course (parent document)
- One-to-many with Content items (via `content` array)

### 6. Content (Subcollection of Modules)

**Path:** `courses/{courseId}/modules/{moduleId}/content/{contentId}`

**Description:** Stores content items within each module, including documents, videos, images, etc.

**Schema:**
```javascript
{
  id: string,                // Content item ID
  title: string,              // Content title
  description: string,        // Content description
  type: string,              // Content type: 'document', 'video', 'image', 'quiz', 'assignment'
  url: string,                // URL to the content
  createdAt: timestamp,       // When the content was created
}
```

**Relationship:** 
- Belongs to one Module (parent document)

### 7. Assessments Collection

**Path:** `Assessments/{assessmentId}`

**Description:** Stores assessment information related to courses.

**Schema:**
```javascript
{
  title: string,              // Assessment title
  courseId: string,           // ID of the related course
  courseName: string,         // Name of the related course
  program: string,             // Program(s) the course belongs to
  targetAudience: string,     // Target audience for the assessment
  url: string,                // URL to the assessment
  createdBy: string,           // UID of the user who created the assessment
  createdAt: timestamp,       // When the assessment was created
}
```

**Relationship:** 
- Many-to-one with Courses collection (via `courseId` or `courseName`)
- Many-to-one with Users collection (via `createdBy`)

### 8. Treasury Collection

**Path:** `treasury/main`

**Description:** Stores treasury information including balance and role amounts.

**Schema:**
```javascript
{
  balance: number,            // Current treasury balance
  currency: string,            // Currency code (e.g., 'K' for Kwacha)
  roleAmounts: object,          // Amounts for each role elevation
  totalTransactions: number,   // Total number of transactions
  totalIncome: number,         // Total income from all transactions
  totalExpenses: number,       // Total expenses from all transactions
  createdAt: timestamp,       // When the treasury was created
  updatedAt: timestamp        // Last update timestamp
  createdBy: string,           // UID of admin who created the treasury
  lastUpdatedBy: string,       // UID of admin who last updated the treasury
  status: string              // Treasury status: 'active', 'frozen', etc.
}
```

**Relationship:** 
- Single document (singleton collection)

### 9. Transactions Collection

**Path:** `transactions/{transactionId}`

**Description:** Records all financial transactions in the system, including user elevations.

**Schema:**
```javascript
{
  userId: string,             // UID of the user involved in the transaction
  userEmail: string,          // Email of the user involved in the transaction
  type: string,               // Transaction type: 'elevation', 'deactivation', etc.
  role: string,               // Role involved in the transaction
  amount: number,             // Transaction amount
  currency: string,            // Currency code (e.g., 'K' for Kwacha)
  date: timestamp,             // When the transaction occurred
  month: number,              // Month when transaction occurred (0-11)
  year: number,               // Year when transaction occurred
  description: string,         // Description of the transaction
  category: string,            // Transaction category: 'elevation', 'deactivation', etc.
  referenceId: string,         // Reference to related document (e.g., user ID)
  createdBy: string,           // UID of admin who created the transaction
  status: string,              // Transaction status: 'completed', 'pending', etc.
  notes: string               // Additional notes about the transaction
}
```

**Relationship:** 
- Many-to-one with Treasury collection (transactions affect treasury balance)
- Many-to-one with Users collection (via `userId`)

### 10. Settings Collection

**Path:** `settings/courseOptions`

**Description:** Stores system settings including available course options.

**Schema:**
```javascript
{
  programs: array,            // Available program options
  years: array,              // Available year options
  createdAt: timestamp,       // When settings were created
  updatedAt: timestamp        // Last update timestamp
}
```

**Relationship:** 
- Single document (singleton collection)

### 11. Live Sessions Collection

**Path:** `liveSessions/{sessionId}`

**Description:** Stores information about live tutoring sessions.

**Schema:**
```javascript
{
  title: string,              // Session title
  description: string,        // Session description
  link: string,               // Link to the live session (e.g., Google Meet)
  timestamp: number,           // When the session is scheduled
  status: string,             // Session status: 'active', 'ended', etc.
  createdBy: string,           // UID of the user who created the session
  active: boolean,             // Whether the session is currently active
}
```

**Relationship:** 
- Many-to-one with Users collection (via `createdBy`)

### 12. Queries Collection

**Path:** `Queries/{queryId}`

**Description:** Stores user queries or questions.

**Schema:**
```javascript
{
  title: string,              // Query title
  description: string,        // Query description
  userId: string,             // UID of the user who created the query
  userEmail: string,          // Email of the user who created the query
  createdAt: timestamp,       // When the query was created
  status: string,             // Query status: 'open', 'answered', etc.
}
```

**Relationship:** 
- Many-to-one with Users collection (via `userId`)

### 13. Notifications Collection

**Path:** `notifications/{notificationId}`

**Description:** Stores system notifications for users.

**Schema:**
```javascript
{
  title: string,              // Notification title
  message: string,            // Notification message
  userId: string,             // UID of the user who should receive the notification
  type: string,               // Notification type: 'info', 'warning', 'error', etc.
  read: boolean,              // Whether the notification has been read
  createdAt: timestamp,       // When the notification was created
}
```

**Relationship:** 
- Many-to-one with Users collection (via `userId`)

## Entity Relationship Diagrams

### 1. User-Role Relationships

```
┌─────────────────┐       ┌───────────────┐       ┌────────────────────┐
│     Users       │       │     Admins    │       │     Tutors         │
├─────────────────┤       ├───────────────┤       ├────────────────────┤
│ uid: string     │       │ uid: string   │       │ uid: string        │
│ displayName:    │       │ role: 'admin' │       │ role: 'tutor'      │
│ email:          │       │ createdAt:    │       │ assignedCourses:   │
│ role:           │       │               │       │ array              │
│ ...             │       └───────────────┘       │ email:             │
└─────────────────┘                               │ displayName:       │
                                                  │ createdAt:         │
                                                  └────────────────────┘
```

### 2. Course-Tutor-Assignment Relationships

```
┌────────────────────┐       ┌─────────────────┐
│     Tutors         │       │     Courses     │
├────────────────────┤       ├─────────────────┤
│ uid: string        │       │ id: string      │
│ email:             │       │ title: string   │
│ displayName:       │       │ description:    │
│ assignedCourses:   │◄────┘ │ targetPrograms: │
│ array              │       │ targetYears:    │
│ ...                │       │ modules: array  │
└────────────────────┘       └─────────────────┘
```

### 3. Course-Assessment Relationships

```
┌──────────────┐       ┌──────────────────────┐
│   Courses    │       │   Assessments        │
├──────────────┤       ├──────────────────────┤
│ id: string   │       │ id: string           │
│ title: string│       │ title: string        │
│ description: │       │ courseId: string     │◄┐
│ ...          │       │ courseName:          │ │
│              │       │ program: string      │ │
│              │       │ targetAudience:      │ │
└──────────────┘       │ url: string          │ |
                       │ createdBy: string    │◄┘
                       │ createdAt: timestamp │
                       └──────────────────────┘
```

### 4. Course-Module-Content Relationships

```
┌───────────────┐       ┌─────────────────┐       ┌────────────────┐
│   Courses     │       │     Modules     │       │     Content    │
├───────────────┤       ├─────────────────┤       ├────────────────┤
│ id: string    │       │ id: string      │       │ id: string     │
│ title: string │       │ title: string   │       │ title: string  │
│ ...           │       │ order: number   │       │ description:   │
│               │       │ content: array  │◄┐     │ type: string   │
│               │       │                 │ └─----│ url: string    │
└───────────────┘       └─---------------─┘       └────────────────┘
```

### 5. Treasury-Transaction Relationships

```
┌─────────────────┐       ┌─────────────────┐
│   Treasury      │       │  Transactions   │
├─────────────────┤       ├─────────────────┤
│ balance: num    │       │ userId: string  │◄┐
│ currency: str   │       │ userEmail: str  │  │
│ ...             │       │ type: string    │  │
│                 │       │ role: string    │  │
│                 │       │ amount: number  │  │
│                 │       │ date: timestamp │  │
│                 │       │ ...             │  │
└─────────────────┘       └─────────────────┘ 
```

## Data Flow Examples

### User Elevation Process

1. Admin elevates a User to Member role:
   - Update User document with new role
   - Create transaction in Transactions collection
   - Update Treasury balance

```javascript
// 1. Update User document
await updateDoc(doc(db, "users", userId), {
  role: "member",
  subscriptionStatus: "active",
  subscriptionEnd: new Date()
});

// 2. Create transaction
await addDoc(collection(db, "transactions"), {
  userId: userId,
  userEmail: user.email,
  type: "elevation",
  role: "member",
  amount: 50,
  currency: "K",
  date: new Date(),
  month: new Date().getMonth(),
  year: new Date().getFullYear(),
  description: "Elevated to member"
});

// 3. Update Treasury
await updateDoc(doc(db, "treasury", "main"), {
  balance: currentBalance + 50,
  totalTransactions: totalTransactions + 1,
  totalIncome: totalIncome + 50
});
```

### Course Assignment to Tutor

1. Admin assigns a Course to a Tutor:
   - Add course ID to tutor's `assignedCourses` array
   - Create relationship between Course and Tutor

```javascript
// 1. Update Tutor document
await updateDoc(doc(db, "tutors", tutorId), {
  assignedCourses: [...assignedCourses, courseId]
});

// 2. Now tutor can access this course
// 3. Tutor can create assessments for this course
```

### Assessment Creation by Tutor

1. Tutor creates an Assessment for a Course:
   - Assessment is linked to Course via `courseId` or `courseName`
   - System can find all assessments for a course

```javascript
// 1. Create assessment
await addDoc(collection(db, "Assessments"), {
  title: "Midterm Exam",
  courseId: courseId,
  courseName: course.title,
  program: course.targetPrograms.join(", "),
  targetAudience: "1st Year Students",
  url: "https://example.com/exam",
  createdBy: tutorId
});

// 2. Fetch assessments for a course
const assessmentsQuery = query(
  collection(db, "Assessments"),
  where("courseId", "==", courseId)
);
```

## Indexing Strategy

### Firestore Indexes

For optimal performance, the following indexes should be created:

1. **Users Collection**
   - `role` index: To quickly filter users by role
   - `subscriptionStatus` index: To find active/inactive users

2. **Tutors Collection**
   - `assignedCourses` index: To find tutors assigned to specific courses

3. **Courses Collection**
   - `targetPrograms` index: To find courses for specific programs
   - `targetYears` index: To find courses for specific years

4. **Assessments Collection**
   - `courseId` index: To find assessments for specific courses
   - `courseName` index: Alternative way to find assessments for courses
   - `createdBy` index: To find assessments created by specific tutors

5. **Transactions Collection**
   - `userId` index: To find transactions for specific users
   - `type` index: To find transactions by type
   - `date` index: For time-based queries

## Security Rules

### User Access Control

```
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

match /admins/{adminId} {
  allow read: if request.auth != null;
  allow create, delete: if isAdmin();
}

match /tutors/{tutorId} {
  allow read: if request.auth != null;
  allow create, update, delete: if isAdmin();
  allow read: if request.auth != null && request.auth.uid == tutorId;
}

match /courses/{courseId} {
  allow read: if request.auth != null;
  allow create, update, delete: if isAdmin() || isTutor();
}

match /Assessments/{assessmentId} {
  allow read: if request.auth != null;
  allow create, update, delete: if isAdmin() || isTutor();
}
```

### Data Validation

1. **User Roles**: Ensure only admins can elevate users to certain roles
2. **Course Access**: Ensure tutors can only access courses assigned to them
3. **Assessment Creation**: Ensure assessments are only created for assigned courses
4. **Financial Transactions**: Ensure only admins can create treasury transactions

## Scalability Considerations

1. **Document Size Limits**: Firestore has a 1MB limit per document. For courses with many modules, consider:
   - Splitting large courses into multiple documents
   - Using subcollections for modules and content

2. **Query Optimization**:
   - Use compound queries for complex filtering
   - Implement pagination for large result sets
   - Cache frequently accessed data

3. **Data Distribution**:
   - Consider sharding collections by region or institution if the system grows very large
   - Use batch operations for bulk data updates
```

This documentation provides a comprehensive overview of the database schema and relationships in the system, with text-based ERD diagrams to visualize the relationships between different entities.
