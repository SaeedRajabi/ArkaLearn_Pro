export default {
  /** Get course enrollments (students enrolled in courses). CourseId=0 means all. */
  GetCourseEnrollments: `/Student/GetCourseEnrollments`,
  /** Get seminar registrations (students registered in seminars). SeminarId=0 means all. */
  GetSeminarRegistrations: `/Seminar/GetRegistrations`,
  /** Get all seminar registrations with seminar info (new endpoint) */
  GetAllSeminarRegistrations: `/Seminar/GetAllRegistrations`,
};
