export const useStudentPortalApi = () => {
  const { apiFetch } = useApi()

  const getStudentPortalDashboard = () => {
    return apiFetch('/student-portal/dashboard', {
      method: 'GET',
    })
  }

  const getStudentPortalProfile = () => {
    return apiFetch('/student-portal/profile', {
      method: 'GET',
    })
  }

  const getStudentPortalEnrollment = () => {
    return apiFetch('/student-portal/enrollment', {
      method: 'GET',
    })
  }

  const getStudentPortalCourses = () => {
    return apiFetch('/student-portal/courses', {
      method: 'GET',
    })
  }

  const getStudentPortalDocuments = () => {
    return apiFetch('/student-portal/documents', {
      method: 'GET',
    })
  }
const getStudentPortalRequests = () => {
  return apiFetch('/student-portal/requests', {
    method: 'GET',
  })
}

const submitProfileCorrectionRequest = (payload: any) => {
  return apiFetch('/student-portal/requests/profile-correction', {
    method: 'POST',
    body: payload,
  })
}

const submitDocumentResubmissionRequest = (payload: any) => {
  return apiFetch('/student-portal/requests/document-resubmission', {
    method: 'POST',
    body: payload,
  })
}

const submitCourseAddDropRequest = (payload: any) => {
  return apiFetch('/student-portal/requests/course-add-drop', {
    method: 'POST',
    body: payload,
  })
}
const getStudentPortalAvailableCourses = () => {
  return apiFetch('/student-portal/available-courses', {
    method: 'GET',
  })
}
const uploadStudentProfilePicture = (formData: FormData) => {
  return apiFetch('/student-portal/profile-picture', {
    method: 'POST',
    body: formData,
  })
}

const getStudentPortalFeeStatus = () => {
  return apiFetch('/student-portal/fee-status', {
    method: 'GET',
  })
}

const uploadStudentDocument = (formData: FormData) => {
  return apiFetch('/student-portal/documents/upload', {
    method: 'POST',
    body: formData,
  })
}

const getStudentResearchPublications = () => {
  return apiFetch('/student-portal/research-publications', {
    method: 'GET',
  })
}

const submitStudentResearchPublication = (formData: FormData) => {
  return apiFetch('/student-portal/research-publications', {
    method: 'POST',
    body: formData,
  })
}

const deleteStudentResearchPublication = (publicationId: number) => {
  return apiFetch(`/student-portal/research-publications/${publicationId}`, {
    method: 'DELETE',
  })
}

  return {
    getStudentPortalDashboard,
    getStudentPortalProfile,
    getStudentPortalEnrollment,
    getStudentPortalCourses,
    getStudentPortalDocuments,
    getStudentPortalRequests,
    submitProfileCorrectionRequest,
    submitDocumentResubmissionRequest,
    submitCourseAddDropRequest,
    getStudentPortalAvailableCourses,
    uploadStudentProfilePicture,
    getStudentPortalFeeStatus,
    uploadStudentDocument,
    getStudentResearchPublications,
    submitStudentResearchPublication,
    deleteStudentResearchPublication,
  }
}