// My Programs - Instructor View - Vanilla JavaScript

const API_BASE = "/api/lesson-programs";

// Check authentication and role
function checkAuth() {
  if (!requireAuth()) {
    return false;
  }
  const user = getCurrentUser();
  if (!user || user.role !== "INSTRUCTOR") {
    window.location.href = "/unauthorized.html";
    return false;
  }
  return true;
}

// Initialize page
document.addEventListener("DOMContentLoaded", function() {
  if (!checkAuth()) return;
  
  if (typeof initHeader === "function") {
    initHeader();
  }

  loadEducationTerms();
  loadPrograms();
  
  // Filter change event
  const termFilter = document.getElementById("termFilter");
  if (termFilter) {
    termFilter.addEventListener("change", loadPrograms);
  }

  // Refresh button
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadPrograms);
  }
});

// Load education terms for filter
async function loadEducationTerms() {
  try {
    const res = await fetch("/api/terms", {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      console.error("Failed to load education terms");
      return;
    }

    const terms = await res.json();
    const termFilter = document.getElementById("termFilter");
    if (!termFilter) return;

    // Clear existing options except "All Terms"
    termFilter.innerHTML = '<option value="">All Terms</option>';

    // Sort terms by start_date (newest first)
    const sortedTerms = [...terms].sort((a, b) => {
      const dateA = new Date(a.start_date || 0);
      const dateB = new Date(b.start_date || 0);
      return dateB - dateA; // Descending order (newest first)
    });

    sortedTerms.forEach((term) => {
      const option = document.createElement("option");
      option.value = term.term_id || term.id;
      option.textContent = term.term_name || term.termName;
      termFilter.appendChild(option);
    });
  } catch (error) {
    console.error("Error loading education terms:", error);
  }
}

// Load programs
async function loadPrograms() {
  try {
    const termFilter = document.getElementById("termFilter");
    const selectedTermId = termFilter ? termFilter.value : "";
    
    let url = API_BASE;
    if (selectedTermId) {
      url += `?term_id=${selectedTermId}`;
    }

    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: "Failed to load programs" }));
      throw new Error(errorData.message || `HTTP ${res.status}: Failed to load programs`);
    }

    const data = await res.json();
    const programs = Array.isArray(data) ? data : [];
    
    console.log("Loaded programs:", programs);
    console.log("Program count:", programs.length);
    if (programs.length > 0) {
      console.log("First program sample:", programs[0]);
      console.log("First program keys:", Object.keys(programs[0]));
      console.log("First program course_name:", programs[0].course_name);
      console.log("First program course_id:", programs[0].course_id);
    }
    
    displayPrograms(programs);
    
    // Clear any previous error messages on success
    const messageEl = document.getElementById("programMessage");
    if (messageEl && programs.length > 0) {
      messageEl.textContent = "";
      messageEl.className = "message";
    }
  } catch (error) {
    console.error("Error loading programs:", error);
    showMessage(
      document.getElementById("programMessage"),
      "Error loading programs: " + error.message,
      "error"
    );
  }
}

// Display programs in table
async function displayPrograms(programs) {
  const tbody = document.getElementById("programTableBody");
  if (!tbody) return;

  if (programs.length === 0) {
    tbody.innerHTML = "<tr><td colspan='5'>No programs found. You are not assigned to any programs yet.</td></tr>";
    return;
  }

  // Load courses/lessons and students for each program
  const programsWithDetails = await Promise.all(
    programs.map(async (program) => {
      // Try multiple possible field names for program ID
      const programId = program.course_program_id || program.lesson_program_id || program.id || program.program_id;
      let courses = [];
      let students = [];

      if (!programId) {
        console.warn("Program ID not found for program:", program);
        return {
          ...program,
          courses: [],
          students: [],
        };
      }

      // First, check if course information is already in the program object (from instructor_programs table)
      if (program.course_id && program.course_name) {
        courses = [{
          course_id: program.course_id,
          course_name: program.course_name,
          title: program.course_name
        }];
        console.log(`✓ Using course from program object for program ${programId}:`, courses);
      }
      
      // Also try to fetch from API to get additional courses if any (merge with existing)
      try {
        // Get courses/lessons - try /courses first, then /lessons as fallback
        let coursesRes = await fetch(`${API_BASE}/${programId}/courses`, {
          headers: getAuthHeaders(),
        });
        
        if (!coursesRes.ok) {
          const errorText = await coursesRes.text();
          console.warn(`Courses endpoint failed for program ${programId}, status: ${coursesRes.status}, response:`, errorText);
          
          // Fallback to /lessons endpoint
          coursesRes = await fetch(`${API_BASE}/${programId}/lessons`, {
            headers: getAuthHeaders(),
          });
        }
        
        if (coursesRes.ok) {
          const apiCourses = await coursesRes.json();
          // Merge API courses with program object course (avoid duplicates)
          if (apiCourses && apiCourses.length > 0) {
            const existingCourseIds = courses.map(c => c.course_id);
            const newCourses = apiCourses.filter(c => !existingCourseIds.includes(c.course_id));
            courses = [...courses, ...newCourses];
            console.log(`✓ Merged API courses for program ${programId}. Total: ${courses.length}`);
          } else if (courses.length === 0) {
            // If no courses from program object and API returns empty, keep empty
            console.log(`No courses found from API for program ${programId}`);
          }
        } else {
          const errorText = await coursesRes.text();
          console.warn(`Failed to load courses from API for program ${programId}, status: ${coursesRes.status}, response:`, errorText);
        }
      } catch (error) {
        console.error(`Error loading courses from API for program ${programId}:`, error);
      }

      try {
        // Get students
        const studentsRes = await fetch(`${API_BASE}/${programId}/students`, {
          headers: getAuthHeaders(),
        });
        if (studentsRes.ok) {
          students = await studentsRes.json();
          console.log(`✓ Loaded ${students.length} students for program ${programId}:`, students);
        } else {
          const errorText = await studentsRes.text();
          console.warn(`Failed to load students for program ${programId}, status: ${studentsRes.status}, response:`, errorText);
        }
      } catch (error) {
        console.error(`Error loading students for program ${programId}:`, error);
      }

      // Build result object, ensuring course_name is always preserved
      const result = {
        ...program, // This includes course_name and course_id from backend
        courses: courses,
        students: students,
      };
      
      // Ensure course_name is preserved (highest priority from program object)
      if (program.course_name) {
        result.course_name = program.course_name;
        result.course_id = program.course_id;
        console.log(`✓ Program ${programId} - course_name preserved: ${result.course_name}`);
      } else if (courses.length > 0) {
        result.course_name = courses[0].course_name || courses[0].title;
        result.course_id = courses[0].course_id;
        console.log(`✓ Program ${programId} - course_name from courses array: ${result.course_name}`);
      } else {
        console.warn(`⚠ Program ${programId} - No course_name found in program object or courses array`);
      }
      
      console.log(`Program ${programId} final result:`, {
        course_name: result.course_name,
        course_id: result.course_id,
        courses_length: result.courses.length,
        has_course_name: !!result.course_name
      });
      
      return result;
    })
  );

  // Sort programs by day of week and start time
  const dayOrder = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 7,
  };

  programsWithDetails.sort((a, b) => {
    const dayA = dayOrder[(a.day_of_week || a.day || "").toUpperCase()] || 8;
    const dayB = dayOrder[(b.day_of_week || b.day || "").toUpperCase()] || 8;
    if (dayA !== dayB) return dayA - dayB;
    
    const timeA = a.start_time || "";
    const timeB = b.start_time || "";
    return timeA.localeCompare(timeB);
  });

  // Format and display programs (async to handle course fetching)
  const programRows = await Promise.all(
    programsWithDetails.map(async (program) => {
      const programId = program.course_program_id || program.lesson_program_id || program.id || program.program_id;
      const day = program.day || program.day_of_week || "";
      const startTime = formatTime(program.start_time) || "";
      const stopTime = formatTime(program.stop_time) || "";
      const timeRange = startTime && stopTime ? `${startTime} - ${stopTime}` : startTime || stopTime || "";
      const termName = program.term_name || program.education_term_name || "";
      
      // Format courses/lessons
      let coursesText = "No courses assigned";
      
      console.log(`[Display] Processing program ${programId}`);
      console.log(`[Display] Full program object:`, program);
      console.log(`[Display] program.course_name:`, program.course_name);
      console.log(`[Display] program.courses:`, program.courses);
      console.log(`[Display] program.courses type:`, typeof program.courses, "isArray:", Array.isArray(program.courses));
      console.log(`[Display] program.courses length:`, program.courses ? program.courses.length : 0);
      
      // Priority 1: Check if course info is in the program object itself (from instructor_programs table)
      if (program.course_name) {
        coursesText = program.course_name;
        console.log(`✓✓✓ [Display] Using course_name from program object: "${program.course_name}"`);
      } 
      // Priority 2: Check courses array (from API call)
      else if (program.courses && Array.isArray(program.courses) && program.courses.length > 0) {
        coursesText = program.courses
          .map(c => {
            const courseName = c.course_name || c.title || c.lesson_name || c.lessonName || "Unknown";
            console.log(`[Display] Course from array:`, c, "-> name:", courseName);
            return courseName;
          })
          .filter(Boolean)
          .join(", ");
        console.log(`✓✓✓ [Display] Using courses from array: "${coursesText}"`);
      } 
      // Priority 3: Check if course_id exists, try to get name from courses table
      else if (program.course_id) {
        // Try to fetch course name by course_id
        try {
          const courseRes = await fetch(`/api/content/courses/${program.course_id}`);
          if (courseRes.ok) {
            const course = await courseRes.json();
            coursesText = course.title || course.course_name || "Unknown Course";
            console.log(`✓ Fetched course name by course_id: ${coursesText}`);
          }
        } catch (error) {
          console.warn(`Could not fetch course name for course_id ${program.course_id}:`, error);
        }
      }
      else {
        console.warn(`⚠ No courses found for program ${programId}. Program object:`, program);
        console.warn("Available fields:", Object.keys(program));
      }
      
      // Format students
      let studentsText = "No students enrolled";
      console.log(`[Display] Program ${programId} students:`, program.students);
      if (program.students && Array.isArray(program.students) && program.students.length > 0) {
        studentsText = program.students
          .map(s => {
            // Try multiple possible field names
            const name = s.name || s.student_name || s.first_name || "";
            const surname = s.surname || s.student_surname || s.last_name || "";
            const fullName = s.full_name || s.student_name || "";
            
            if (fullName) {
              return fullName;
            } else if (name && surname) {
              return `${name} ${surname}`;
            } else if (name) {
              return name;
            } else if (surname) {
              return surname;
            } else {
              return s.username || s.email || "Unknown Student";
            }
          })
          .filter(Boolean)
          .join(", ");
        console.log(`✓ [Display] Formatted students text: "${studentsText}"`);
      } else {
        console.warn(`⚠ [Display] No students found for program ${programId}. students array:`, program.students);
      }

      return `
    <tr>
      <td>${day}</td>
      <td>${timeRange}</td>
      <td>${termName}</td>
      <td>${coursesText}</td>
      <td>${studentsText}</td>
    </tr>
  `;
    })
  );
  
  tbody.innerHTML = programRows.join("");
}

