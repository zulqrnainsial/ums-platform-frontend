export const useApi = () => {
  const config = useRuntimeConfig()

  const getToken = () => {
    if (!process.client) {
      return null
    }

    const path = window.location.pathname

    const adminToken =
      localStorage.getItem('auth_token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token')

    const applicantToken = localStorage.getItem('applicant_token')

    if (
      path.startsWith('/applicant/dashboard') ||
      path.startsWith('/applicant/profile') ||
      path.startsWith('/applicant/applications')
    ) {
      return applicantToken
    }

    return adminToken || applicantToken
  }

  const apiFetch = async <T>(url: string, options: any = {}) => {
    const token = getToken()

    return await $fetch<T>(url, {
      baseURL: config.public.apiBaseUrl,
      ...options,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    })
  }
const generateAdmissionOfferVoucher = (payload: any) => {
  return apiFetch('/admission/offer-vouchers/generate', {
    method: 'POST',
    body: payload,
  })
}

const markAdmissionOfferVoucherPaid = (voucherId: number, payload: any = {}) => {
  return apiFetch(`/admission/offer-vouchers/${voucherId}/mark-paid`, {
    method: 'POST',
    body: payload,
  })
}

const confirmAdmission = (payload: any) => {
  return apiFetch('/admission/confirmations/confirm', {
    method: 'POST',
    body: payload,
  })
}
const verifyAdmissionOfferVoucherPayment = (voucherId: number) => {
  return apiFetch(`/admission/offer-vouchers/${voucherId}/verify-payment`, {
    method: 'POST',
  })
}
const getAdmittedCandidates = (params: any = {}) => {
  return apiFetch('/admission/closure-reports/admitted-candidates', {
    method: 'GET',
    params,
  })
}

const getAdmissionSeatSummary = (params: any = {}) => {
  return apiFetch('/admission/closure-reports/seat-summary', {
    method: 'GET',
    params,
  })
}

const generateWaitingList = (meritListId: number) => {
  return apiFetch(`/admission/waiting-lists/merit-lists/${meritListId}/generate`, {
    method: 'POST',
  })
}

const promoteNextWaitingCandidate = (meritListId: number, payload: any = {}) => {
  return apiFetch(`/admission/waiting-lists/merit-lists/${meritListId}/promote-next`, {
    method: 'POST',
    body: payload,
  })
}

const getWaitingListMovements = (meritListId: number, params: any = {}) => {
  return apiFetch(`/admission/waiting-lists/merit-lists/${meritListId}/movements`, {
    method: 'GET',
    params,
  })
}

const getAdminAssessmentAttemptActivityLogs = (attemptId: number) => {
  return apiFetch(`/assessment/admin/attempts/${attemptId}/activity-logs`, {
    method: 'GET',
  })
}
const getStudentManagementStudents = (params: any = {}) => {
  return apiFetch('/student-management/students', {
    method: 'GET',
    params,
  })
}

const getStudentManagementStudent = (studentId: number) => {
  return apiFetch(`/student-management/students/${studentId}`, {
    method: 'GET',
  })
}

const getStudentManagementEnrollments = (params: any = {}) => {
  return apiFetch('/student-management/enrollments', {
    method: 'GET',
    params,
  })
}
const updateStudentAcademicStatus = (studentId: number, payload: any) => {
  return apiFetch(`/student-management/students/${studentId}/status`, {
    method: 'PATCH',
    body: payload,
  })
}

const updateStudentEnrollment = (enrollmentId: number, payload: any) => {
  return apiFetch(`/student-management/enrollments/${enrollmentId}`, {
    method: 'PATCH',
    body: payload,
  })
}
const getStudentCourseRegistrationContext = (studentId: number) => {
  return apiFetch(`/student-management/students/${studentId}/course-registration/context`, {
    method: 'GET',
  })
}

const getStudentAvailableCourses = (studentId: number, params: any = {}) => {
  return apiFetch(`/student-management/students/${studentId}/course-registration/available-courses`, {
    method: 'GET',
    params,
  })
}

const getStudentRegisteredCourses = (studentId: number) => {
  return apiFetch(`/student-management/students/${studentId}/course-registration/registered-courses`, {
    method: 'GET',
  })
}

const registerStudentCourses = (studentId: number, payload: any) => {
  return apiFetch(`/student-management/students/${studentId}/course-registration/register`, {
    method: 'POST',
    body: payload,
  })
}

const unregisterStudentCourse = (registrationId: number) => {
  return apiFetch(`/student-management/course-registration/${registrationId}`, {
    method: 'DELETE',
  })
}
const getStudentSectionBatchAllocationContext = (params: any = {}) => {
  return apiFetch('/student-management/section-batch-allocation/context', {
    method: 'GET',
    params,
  })
}

const bulkAllocateStudentSectionBatch = (payload: any) => {
  return apiFetch('/student-management/section-batch-allocation/bulk-allocate', {
    method: 'POST',
    body: payload,
  })
}

const updateStudentEnrollmentAllocation = (enrollmentId: number, payload: any) => {
  return apiFetch(`/student-management/enrollments/${enrollmentId}/allocation`, {
    method: 'PATCH',
    body: payload,
  })
}
const updateStudentProfile = (studentId: number, payload: any) => {
  return apiFetch(`/student-management/students/${studentId}/profile`, {
    method: 'PATCH',
    body: payload,
  })
}

const getStudentProfileCompletion = (studentId: number) => {
  return apiFetch(`/student-management/students/${studentId}/profile-completion`, {
    method: 'GET',
  })
}

const saveStudentGuardian = (studentId: number, payload: any) => {
  return apiFetch(`/student-management/students/${studentId}/guardians`, {
    method: 'POST',
    body: payload,
  })
}

const deleteStudentGuardian = (studentGuardianId: number) => {
  return apiFetch(`/student-management/student-guardians/${studentGuardianId}`, {
    method: 'DELETE',
  })
}

const saveStudentPreviousEducation = (studentId: number, payload: any) => {
  return apiFetch(`/student-management/students/${studentId}/previous-educations`, {
    method: 'POST',
    body: payload,
  })
}

const deleteStudentPreviousEducation = (previousEducationId: number) => {
  return apiFetch(`/student-management/previous-educations/${previousEducationId}`, {
    method: 'DELETE',
  })
}

const verifyStudentDocument = (documentId: number, payload: any) => {
  return apiFetch(`/student-management/student-documents/${documentId}/verify`, {
    method: 'PATCH',
    body: payload,
  })
}
const getStudentLifecycleContext = (params: any = {}) => {
  return apiFetch('/student-management/lifecycle/context', {
    method: 'GET',
    params,
  })
}

const applyStudentLifecycleAction = (studentId: number, payload: any) => {
  return apiFetch(`/student-management/students/${studentId}/lifecycle-action`, {
    method: 'POST',
    body: payload,
  })
}
const getStudentRequests = (params: any = {}) => {
  return apiFetch('/student-management/student-requests', {
    method: 'GET',
    params,
  })
}

const getStudentRequest = (requestId: number) => {
  return apiFetch(`/student-management/student-requests/${requestId}`, {
    method: 'GET',
  })
}

const decideStudentRequest = (requestId: number, payload: any) => {
  return apiFetch(`/student-management/student-requests/${requestId}/decision`, {
    method: 'POST',
    body: payload,
  })
}
const getStudentAcademicPlacementOptions = (params: any = {}) => {
  return apiFetch('/student-management/academic-placement-options', {
    method: 'GET',
    params,
  })
}
const getBulkCourseRegistrationContext = (params: any = {}) => {
  return apiFetch('/student-management/bulk-course-registration/context', {
    method: 'GET',
    params,
  })
}

const previewBulkCourseRegistration = (params: any = {}) => {
  return apiFetch('/student-management/bulk-course-registration/preview', {
    method: 'GET',
    params,
  })
}

const registerBulkCourses = (payload: any) => {
  return apiFetch('/student-management/bulk-course-registration/register', {
    method: 'POST',
    body: payload,
  })
}

const getCourseRegistrationSettings = (params: any = {}) => {
  return apiFetch('/student-management/course-registration-settings', {
    method: 'GET',
    params,
  })
}

const saveCourseRegistrationSettings = (payload: any) => {
  return apiFetch('/student-management/course-registration-settings', {
    method: 'POST',
    body: payload,
  })
}
const getAttendanceMarkingContext = (params: any = {}) => {
  return apiFetch('/attendance/marking/context', {
    method: 'GET',
    params,
  })
}

const getAttendanceMarkingStudents = (params: any = {}) => {
  return apiFetch('/attendance/marking/students', {
    method: 'GET',
    params,
  })
}

const saveAttendanceMarking = (payload: any) => {
  return apiFetch('/attendance/marking/save', {
    method: 'POST',
    body: payload,
  })
}

const getAttendanceSessions = (params: any = {}) => {
  return apiFetch('/attendance/sessions', {
    method: 'GET',
    params,
  })
}

const getAttendanceSession = (sessionId: number | string) => {
  return apiFetch(`/attendance/sessions/${sessionId}`, {
    method: 'GET',
  })
}

const lockAttendanceSession = (sessionId: number | string) => {
  return apiFetch(`/attendance/sessions/${sessionId}/lock`, {
    method: 'POST',
  })
}
const getAttendanceReportSummary = (params: any = {}) => {
  return apiFetch('/attendance/reports/summary', {
    method: 'GET',
    params,
  })
}

const getAttendanceStudentCoursePercentages = (params: any = {}) => {
  return apiFetch('/attendance/reports/student-course-percentages', {
    method: 'GET',
    params,
  })
}

const getAttendanceDefaulters = (params: any = {}) => {
  return apiFetch('/attendance/reports/defaulters', {
    method: 'GET',
    params,
  })
}
  return {
    apiFetch,
    getToken,
    generateAdmissionOfferVoucher,
    markAdmissionOfferVoucherPaid,
    confirmAdmission,
    verifyAdmissionOfferVoucherPayment,
    getAdmittedCandidates,
    getAdmissionSeatSummary,
    generateWaitingList,
    promoteNextWaitingCandidate,
    getWaitingListMovements,
    getAdminAssessmentAttemptActivityLogs,
    getStudentManagementStudents,
    getStudentManagementStudent,
    getStudentManagementEnrollments,
    updateStudentAcademicStatus,
    updateStudentEnrollment,
    getStudentCourseRegistrationContext,
    getStudentAvailableCourses,
    getStudentRegisteredCourses,
    registerStudentCourses,
    unregisterStudentCourse,
    getStudentSectionBatchAllocationContext,
    bulkAllocateStudentSectionBatch,
    updateStudentEnrollmentAllocation,
    updateStudentProfile,
    getStudentProfileCompletion,
    saveStudentGuardian,
    deleteStudentGuardian,
    saveStudentPreviousEducation,
    deleteStudentPreviousEducation,
    verifyStudentDocument,
    getStudentLifecycleContext,
    applyStudentLifecycleAction,
    getStudentRequests,
    getStudentRequest,
    decideStudentRequest,
    getStudentAcademicPlacementOptions,
    getBulkCourseRegistrationContext,
    previewBulkCourseRegistration,
    registerBulkCourses,
    getCourseRegistrationSettings,
    saveCourseRegistrationSettings,
    getAttendanceMarkingContext,
    getAttendanceMarkingStudents,
    saveAttendanceMarking,
    getAttendanceSessions,
    getAttendanceSession,
    lockAttendanceSession,
    getAttendanceReportSummary,
    getAttendanceStudentCoursePercentages,
    getAttendanceDefaulters,
  }
}
