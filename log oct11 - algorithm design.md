log oct 11: algorithm design



# **Tutor Assessment Management System - Algorithm Design Documentation**

## **System Overview**
A two-part system that allows tutors to manage assessments for their assigned courses and students to view relevant assessments based on their enrollment.

---

## **1. Tutor Assessment Management Algorithm**

### **1.1 Course Assignment Relationship Algorithm**

**Purpose:** Establish relationship between tutors and their assessments through course matching

**Input:**
- Tutor document with `assignedCourses[]` (array of course UIDs)
- Courses collection with course documents
- Assessments collection with assessment documents

**Algorithm Steps:**

```
ALGORITHM: BuildCourseRelationship
INPUT: tutorUID
OUTPUT: List of assessments related to tutor's courses

1. FETCH tutor document from "tutors" collection using tutorUID
2. EXTRACT assignedCourses[] array from tutor document
3. FOR EACH courseUID IN assignedCourses[]:
   3.1 FETCH course document from "courses" collection
   3.2 EXTRACT course.title (courseName)
   3.3 STORE {courseUID, courseTitle, courseData} in assignedCoursesData[]
4. PASS assignedCoursesData[] to FetchRelatedAssessments()
```

### **1.2 Assessment Filtering Algorithm (Case-Insensitive)**

**Purpose:** Retrieve assessments related to tutor's assigned courses regardless of case variations

**Algorithm Steps:**

```
ALGORITHM: FetchRelatedAssessments
INPUT: assignedCoursesData[]
OUTPUT: Filtered list of assessments

1. FETCH all documents from "Assessments" collection
2. CREATE assignedCourseTitles[] = EMPTY ARRAY
3. FOR EACH course IN assignedCoursesData[]:
   3.1 ADD course.title.toLowerCase() to assignedCourseTitles[]
4. CREATE filteredAssessments[] = EMPTY ARRAY
5. FOR EACH assessment IN allAssessments:
   5.1 SET assessmentCourseNameLower = assessment.courseName.toLowerCase()
   5.2 IF assessmentCourseNameLower IN assignedCourseTitles[]:
       5.2.1 ADD assessment to filteredAssessments[]
6. RETURN filteredAssessments[]
```

**Key Features:**
- Case-insensitive comparison prevents mismatches (e.g., "Computer Programming" vs "computer programming")
- Matching based on courseName field
- No direct UID relationships stored in assessments

---

### **1.3 Target Audience Selection Algorithm**

**Purpose:** Prevent duplicate year entries by providing standardized dropdown options

**Algorithm Steps:**

```
ALGORITHM: ExtractTargetYears
INPUT: assignedCoursesData[]
OUTPUT: Unique sorted list of target years

1. CREATE uniqueYears = EMPTY SET
2. FOR EACH course IN assignedCoursesData[]:
   2.1 IF course.targetYears EXISTS AND IS_ARRAY:
       2.1.1 FOR EACH year IN course.targetYears:
             2.1.1.1 ADD year to uniqueYears SET
3. CONVERT uniqueYears SET to ARRAY
4. SORT array in ascending order
5. RETURN sorted array
```

**Benefits:**
- Eliminates variations: "4th year", "4th Year", "FOURTH YEAR", "fourth year"
- Ensures data consistency across all assessments
- Admin-controlled standardization

---

### **1.4 Assessment Creation Algorithm**

**Purpose:** Create new assessment with proper field structure

**Input:**
- Assessment title
- Selected course (from dropdown)
- Course code (manually entered, e.g., "CSC 2000")
- Target audience (from dropdown)
- Assessment URL

**Algorithm Steps:**

```
ALGORITHM: CreateAssessment
INPUT: formData{title, courseId, courseName, program, targetAudience, url}
OUTPUT: New assessment document in Firestore

1. VALIDATE user has tutor privileges
2. VERIFY courseName IN tutor's assignedCourses (case-insensitive)
3. IF validation FAILS:
   3.1 RETURN error message
4. CREATE assessmentData = {
     assessmentTitle: formData.title,
     courseId: formData.courseId,        // Course code (e.g., "CSC 2000")
     courseName: formData.courseName,    // Exact case from database
     program: formData.program,
     targetAudience: formData.targetAudience,
     url: formData.url,
     createdBy: currentUserUID,
     createdAt: CURRENT_TIMESTAMP
   }
5. ADD document to "Assessments" collection -> GET documentReference
6. UPDATE document with field: id = documentReference.id
7. RETURN success message
```

**Document Structure:**
```javascript
{
  assessmentTitle: "2020 Final Exam",
  courseId: "CSC 2000",              // Course code (NOT course UID)
  courseName: "Computer Programming", // Exact case preserved
  id: "sxGVYAh6eRmX8mqCXidH",        // Matches Firestore document ID
  program: "Computer Science",
  targetAudience: "2nd year",        // Standardized from dropdown
  url: "https://...",
  createdBy: "tutorUID",
  createdAt: timestamp
}
```

---

## **2. Student Assessment Display Algorithm**

### **2.1 Assessment Fetching Algorithm**

**Purpose:** Fetch all assessments for premium users without backend filtering

**Algorithm Steps:**

```
ALGORITHM: FetchAllAssessments
INPUT: userUID, userEmail
OUTPUT: Complete list of assessments

1. VERIFY user authentication
2. CHECK premium membership status
3. IF NOT premium:
   3.1 RETURN error: "Premium membership required"
4. FETCH all documents from "Assessments" collection (no filters)
5. CREATE assessmentsList[] = EMPTY ARRAY
6. FOR EACH document IN snapshot:
   6.1 ADD {id: doc.id, ...doc.data()} to assessmentsList[]
7. EXTRACT unique courseIds for filter dropdown
8. RETURN assessmentsList[]
```

**Reasoning:**
- Backend filtering caused issues with case sensitivity
- UI-side filtering is more flexible
- All assessments available for dynamic filtering

---

### **2.2 Client-Side Filtering Algorithm (Case-Insensitive)**

**Purpose:** Filter assessments by year, course code, and search term

**Algorithm Steps:**

```
ALGORITHM: FilterAssessments
INPUT: allAssessments[], selectedYear, selectedCourse, searchTerm
OUTPUT: Filtered assessments list

1. CREATE filtered[] = COPY of allAssessments[]

2. // Filter by Year Level (case-insensitive)
   IF selectedYear != "all":
      2.1 filtered = FILTER filtered WHERE:
          assessment.targetAudience.toLowerCase() == selectedYear.toLowerCase()

3. // Filter by Course Code (PRIMARY FILTER - case-insensitive)
   IF selectedCourse != "all":
      3.1 filtered = FILTER filtered WHERE:
          assessment.courseId.toLowerCase() == selectedCourse.toLowerCase()

4. // Filter by Search Term (case-insensitive)
   IF searchTerm != "":
      4.1 SET term = searchTerm.toLowerCase()
      4.2 filtered = FILTER filtered WHERE:
          assessment.assessmentTitle.toLowerCase() CONTAINS term OR
          assessment.courseName.toLowerCase() CONTAINS term OR
          assessment.courseId.toLowerCase() CONTAINS term

5. RETURN filtered[]
```

**Key Design Decision:**
- **Primary filtering by `courseId` (course code)** rather than `courseName`
- **Reason:** courseName can vary ("Computer Programming" vs "Introduction to Programming") but courseId remains consistent ("CSC 2000")
- All comparisons are case-insensitive to handle data inconsistencies

---

## **3. Data Flow Diagram**

```
┌─────────────────┐
│  Tutor Login    │
└────────┬────────┘
         │
         v
┌─────────────────────────────────┐
│ Fetch Tutor Document            │
│ - assignedCourses[] (UIDs)      │
└────────┬────────────────────────┘
         │
         v
┌─────────────────────────────────┐
│ For Each Course UID:            │
│ - Fetch course document         │
│ - Extract course.title          │
│ - Extract course.targetYears    │
└────────┬────────────────────────┘
         │
         v
┌─────────────────────────────────┐
│ Fetch All Assessments           │
│ Filter by courseName (lowercase)│
└────────┬────────────────────────┘
         │
         v
┌─────────────────────────────────┐
│ Display Assessments             │
│ - CRUD Operations Available     │
└─────────────────────────────────┘


┌─────────────────┐
│ Student Login   │
└────────┬────────┘
         │
         v
┌─────────────────────────────────┐
│ Verify Premium Membership       │
└────────┬────────────────────────┘
         │
         v
┌─────────────────────────────────┐
│ Fetch ALL Assessments           │
│ (No backend filtering)          │
└────────┬────────────────────────┘
         │
         v
┌─────────────────────────────────┐
│ UI Filtering:                   │
│ - By courseId (course code)     │
│ - By targetAudience (year)      │
│ - By search term                │
│ (All case-insensitive)          │
└────────┬────────────────────────┘
         │
         v
┌─────────────────────────────────┐
│ Display Filtered Assessments    │
└─────────────────────────────────┘
```

---

## **4. Key Design Principles**

### **4.1 Case-Insensitive Comparison**
- **Problem:** Database contains mixed case entries ("2nd year" vs "2nd Year")
- **Solution:** All comparisons use `.toLowerCase()` on frontend
- **Benefit:** Database remains unchanged, no data migration needed

### **4.2 CourseId-Based Filtering**
- **Problem:** courseName can vary between assessments for same course
- **Solution:** Filter by courseId (course code) which is consistent
- **Example:** "CSC 2000" always matches regardless of whether courseName is "Computer Programming" or "Introduction to Programming"

### **4.3 Separation of Concerns**
- **Tutor Side:** Creates/manages assessments for assigned courses
- **Student Side:** Views all assessments, UI handles filtering
- **Benefit:** Independent updates, easier maintenance

### **4.4 Data Consistency**
- **Target Audience:** Dropdown prevents variations
- **Course Code:** Manual entry with validation
- **ID Field:** Auto-generated matching Firestore document ID

---

## **5. Complexity Analysis**

### **Time Complexity:**
- **Tutor Assessment Fetch:** O(n × m) where n = assigned courses, m = total assessments
- **Student Assessment Fetch:** O(n) where n = total assessments
- **Filtering:** O(n) where n = assessments to filter

### **Space Complexity:**
- **O(n)** for storing assessment lists
- **O(k)** for unique course IDs where k = unique courses

---

## **6. Error Handling**

```
1. User Authentication Errors
   - Missing credentials
   - Invalid user document
   
2. Permission Errors
   - Non-tutor trying to create assessments
   - Tutor creating assessment for unassigned course
   
3. Data Validation Errors
   - Missing required fields
   - Invalid URL format
   
4. Firestore Errors
   - Network issues
   - Permission denied
   - Document not found
```

---

This documentation provides a complete overview of the algorithm design for your assessment management system!
