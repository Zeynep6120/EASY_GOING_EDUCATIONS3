import { config } from "./config.js";

// API Routes - Matching Next.js project structure
export const API_BASE = config.apiURL;

// Contact
export const CONTACT_GET_ALL_BY_PAGE_API = `${API_BASE}/contactMessages/getAll`;
export const CONTACT_CREATE_API = `${API_BASE}/contactMessages/save`;

// Auth
export const LOGIN_API = `${API_BASE}/auth/login`;
export const REGISTER_API = `${API_BASE}/auth/register`;

// Admin
export const ADMIN_GET_ALL_BY_PAGE_API = `${API_BASE}/admin/getAll`;
export const ADMIN_DELETE_API = `${API_BASE}/admin/delete`;
export const ADMIN_CREATE_API = `${API_BASE}/admin/save`;

// Manager
export const MANAGER_GET_ALL_BY_PAGE_API = `${API_BASE}/dean/search`;
export const MANAGER_GET_BY_ID_API = `${API_BASE}/dean/getManagerById`;
export const MANAGER_DELETE_API = `${API_BASE}/dean/delete`;
export const MANAGER_CREATE_API = `${API_BASE}/dean/save`;
export const MANAGER_UPDATE_API = `${API_BASE}/dean/update`;

// Assistant Manager
export const ASSISTANT_GET_ALL_BY_PAGE_API = `${API_BASE}/vicedean/search`;
export const ASSISTANT_GET_BY_ID_API = `${API_BASE}/vicedean/getViceDeanById`;
export const ASSISTANT_DELETE_API = `${API_BASE}/vicedean/delete`;
export const ASSISTANT_CREATE_API = `${API_BASE}/vicedean/save`;
export const ASSISTANT_UPDATE_API = `${API_BASE}/vicedean/update`;

// Education Term
export const TERM_GET_ALL_BY_PAGE_API = `${API_BASE}/educationTerms/search`;
export const TERM_GET_ALL_API = `${API_BASE}/educationTerms/getAll`;
export const TERM_DELETE_API = `${API_BASE}/educationTerms`;
export const TERM_CREATE_API = `${API_BASE}/educationTerms`;

// Lesson
export const LESSON_GET_ALL_BY_PAGE_API = `${API_BASE}/lessons/search`;
export const LESSON_GET_ALL_API = `${API_BASE}/lessons/getAll`;
export const LESSON_DELETE_API = `${API_BASE}/lessons/delete`;
export const LESSON_CREATE_API = `${API_BASE}/lessons/save`;

// Lesson Program
export const PROGRAM_GET_ALL_BY_PAGE_API = `${API_BASE}/lessonPrograms/search`;
export const PROGRAM_GET_ALL_API = `${API_BASE}/lessonPrograms/getAll`;
export const PROGRAM_GET_BY_ID_API = `${API_BASE}/lessonPrograms/getById`;
export const PROGRAM_GET_ASSIGNED_API = `${API_BASE}/lessonPrograms/getAllAssigned`;
export const PROGRAM_GET_UNASSIGNED_API = `${API_BASE}/lessonPrograms/getAllUnassigned`;
export const PROGRAM_GET_TEACHER_API = `${API_BASE}/lessonPrograms/getAllLessonProgramByTeacher`;
export const PROGRAM_GET_STUDENT_API = `${API_BASE}/lessonPrograms/getAllLessonProgramByStudent`;
export const PROGRAM_DELETE_API = `${API_BASE}/lessonPrograms/delete`;
export const PROGRAM_CREATE_API = `${API_BASE}/lessonPrograms/save`;

// Teacher
export const TEACHER_GET_ALL_BY_PAGE_API = `${API_BASE}/teachers/search`;
export const TEACHER_GET_ALL_API = `${API_BASE}/teachers/getAll`;
export const TEACHER_GET_BY_ID_API = `${API_BASE}/teachers/getSavedTeacherById`;
export const TEACHER_CREATE_API = `${API_BASE}/teachers/save`;
export const TEACHER_DELETE_API = `${API_BASE}/teachers/delete`;
export const TEACHER_UPDATE_API = `${API_BASE}/teachers/update`;
export const TEACHER_ASSIGN_PROGRAM_API = `${API_BASE}/teachers/chooseLesson`;
export const ADVISOR_GET_ALL_API = `${API_BASE}/advisorTeacher/getAll`;

// Student
export const STUDENT_GET_ALL_BY_PAGE_API = `${API_BASE}/students/search`;
export const STUDENT_GET_ALL_API = `${API_BASE}/students/getAll`;
export const STUDENT_GET_ALL_BY_ADVISOR_API = `${API_BASE}/students/getAllByAdvisor`;
export const STUDENT_GET_BY_ID_API = `${API_BASE}/students/getStudentById`;
export const STUDENT_CREATE_API = `${API_BASE}/students/save`;
export const STUDENT_DELETE_API = `${API_BASE}/students/delete`;
export const STUDENT_UPDATE_API = `${API_BASE}/students/update`;
export const STUDENT_ASSIGN_PROGRAM_API = `${API_BASE}/students/chooseLesson`;

// Student Info
export const STUDENTINFO_GET_BY_TEACHER_API = `${API_BASE}/studentInfo/getAllForTeacher`;
export const STUDENTINFO_GET_BY_STUDENT_API = `${API_BASE}/studentInfo/getAllByStudent`;
export const STUDENTINFO_GET_BY_ID_API = `${API_BASE}/studentInfo/get`;
export const STUDENTINFO_CREATE_API = `${API_BASE}/studentInfo/save`;
export const STUDENTINFO_UPDATE_API = `${API_BASE}/studentInfo/update`;
export const STUDENTINFO_DELETE_API = `${API_BASE}/studentInfo/delete`;

// Meet
export const MEET_GET_BY_TEACHER_API = `${API_BASE}/meet/getAllMeetByAdvisorAsPage`;
export const MEET_GET_BY_STUDENT_API = `${API_BASE}/meet/getAllMeetByStudent`;
export const MEET_GET_BY_ID_API = `${API_BASE}/meet/getMeetById`;
export const MEET_CREATE_API = `${API_BASE}/meet/save`;
export const MEET_UPDATE_API = `${API_BASE}/meet/update`;
export const MEET_DELETE_API = `${API_BASE}/meet/delete`;

// Content (Public)
export const COURSES_API = `${API_BASE}/content/courses`;
export const COURSES_FEATURED_API = `${API_BASE}/content/courses/featured`;
export const COURSE_API = (id) => `${API_BASE}/content/courses/${id}`;
export const INSTRUCTORS_API = `${API_BASE}/content/instructors`;
export const INSTRUCTOR_API = (id) => `${API_BASE}/content/instructors/${id}`;
export const EVENTS_API = `${API_BASE}/content/events`;
export const EVENT_API = (id) => `${API_BASE}/content/events/${id}`;
export const SLIDES_API = `${API_BASE}/content/slides`;
export const SLIDE_API = (id) => `${API_BASE}/content/slides/${id}`;

// Auth helpers
export const PROFILE_API = `${API_BASE}/auth/profile`;
export const TEACHERS_API = `${API_BASE}/auth/teachers`;
export const STUDENTS_API = `${API_BASE}/auth/students`;
export const CONTACT_API = `${API_BASE}/contact`;

