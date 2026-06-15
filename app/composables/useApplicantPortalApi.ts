export const useApplicantPortalApi = () => {
  const config = useRuntimeConfig()

  const baseUrl =
    config.public?.apiBase ||
    config.public?.apiBaseUrl ||
    config.public?.apiUrl ||
    'http://localhost:8000/api'

  const isApplicantRoute = () => {
    if (process.server) return false
    return window.location.pathname.startsWith('/applicant/')
  }

  const isApplicantSession = () => {
    if (process.server) return false
    return isApplicantRoute() && !!localStorage.getItem('applicant_token')
  }

  const getToken = () => {
    if (process.server) return null

    const path = window.location.pathname

    const adminToken =
      localStorage.getItem('access_token') ||
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token')

    const applicantToken = localStorage.getItem('applicant_token')

    if (
      path.startsWith('/admission/') ||
      path.startsWith('/crud/') ||
      path.startsWith('/dashboard') ||
      path.startsWith('/rbac') ||
      path.startsWith('/system') ||
      path.startsWith('/applicant-portal')
    ) {
      return adminToken
    }

    if (path.startsWith('/applicant/')) {
      return applicantToken
    }

    return adminToken || applicantToken
  }

  const request = async <T = any>(url: string, options: any = {}) => {
    const token = getToken()
    const isFormData = options?.body instanceof FormData
    const headers: Record<string, string> = {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...(options?.headers as Record<string, string> || {}),
    }
    return await $fetch<T>(`${baseUrl}${url}`, {
      ...options,
      headers,
      body: isFormData ? options.body : options?.body ? JSON.stringify(options.body) : undefined,
    })
  }

  const crudList = async (entityCode: string, params: Record<string, any> = {}) => {
    const query = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        query.append(key, String(value))
      }
    })

    const suffix = query.toString() ? `?${query.toString()}` : ''
    return await request(`/dynamic/crud/${entityCode}${suffix}`)
  }

  const crudShow = async (entityCode: string, id: number) => {
    return await request(`/dynamic/crud/${entityCode}/${id}`)
  }

  const crudCreate = async (entityCode: string, payload: Record<string, any>) => {
    return await request(`/dynamic/crud/${entityCode}`, {
      method: 'POST',
      body: payload,
    })
  }

  const crudUpdate = async (entityCode: string, id: number, payload: Record<string, any>) => {
    return await request(`/dynamic/crud/${entityCode}/${id}`, {
      method: 'PUT',
      body: payload,
    })
  }

  const crudDelete = async (entityCode: string, id: number) => {
    return await request(`/dynamic/crud/${entityCode}/${id}`, {
      method: 'DELETE',
    })
  }

  const getOptions = async (url: string) => request(url)
    const getAdmissionPreferenceGroups = async (admissionSessionId?: number | null) => {
    const suffix = admissionSessionId ? `?admission_session_id=${admissionSessionId}` : ''
    return await request(`/dynamic-options/admission-preference-groups${suffix}`)
    }
  const getApplicants = async () => request('/dynamic-options/applicants')
  const getApplicant = async (id: number) => crudShow('applicants', id)
  const updateApplicant = async (id: number, payload: Record<string, any>) => crudUpdate('applicants', id, payload)

  const getApplicantQualifications = async (applicantId: number) => crudList('applicant-qualifications', { applicant_id: applicantId })
  const saveApplicantQualification = async (payload: Record<string, any>, id?: number | null) => id ? crudUpdate('applicant-qualifications', id, payload) : crudCreate('applicant-qualifications', payload)
  const deleteApplicantQualification = async (id: number) => crudDelete('applicant-qualifications', id)

  const getApplicantExperiences = async (applicantId: number) => crudList('applicant-experiences', { applicant_id: applicantId })
  const saveApplicantExperience = async (payload: Record<string, any>, id?: number | null) => id ? crudUpdate('applicant-experiences', id, payload) : crudCreate('applicant-experiences', payload)
  const deleteApplicantExperience = async (id: number) => crudDelete('applicant-experiences', id)

  const getApplicantResearchProfiles = async (applicantId: number) => crudList('applicant-research-profiles', { applicant_id: applicantId })
  const saveApplicantResearchProfile = async (payload: Record<string, any>, id?: number | null) => id ? crudUpdate('applicant-research-profiles', id, payload) : crudCreate('applicant-research-profiles', payload)

  const getApplicantPublications = async (applicantId: number) => crudList('applicant-publications', { applicant_id: applicantId })
  const saveApplicantPublication = async (payload: Record<string, any>, id?: number | null) => id ? crudUpdate('applicant-publications', id, payload) : crudCreate('applicant-publications', payload)
  const deleteApplicantPublication = async (id: number) => crudDelete('applicant-publications', id)

  const getApplicantTestResults = async (applicantId: number) => crudList('applicant-test-results', { applicant_id: applicantId })
  const saveApplicantTestResult = async (payload: Record<string, any>, id?: number | null) => id ? crudUpdate('applicant-test-results', id, payload) : crudCreate('applicant-test-results', payload)
  const deleteApplicantTestResult = async (id: number) => crudDelete('applicant-test-results', id)

  const uploadApplicantDocument = async (formData: FormData) => {
    return await request('/admission/applicant-documents/upload', {
      method: 'POST',
      body: formData,
    })
  }

  const getApplicantDocuments = async (applicantId: number) => crudList('applicant-documents', { applicant_id: applicantId })

  const deleteApplicantDocument = async (documentId: number) => {
    return await request(`/admission/applicant-documents/${documentId}`, {
      method: 'DELETE',
    })
  }

  const getEligiblePrograms = async (applicantId: number, preferenceGroupId?: number | null) => {
  const suffix = preferenceGroupId ? `?preference_group_id=${preferenceGroupId}` : ''
  return await request(`/admission/applicant-portal/applicants/${applicantId}/eligible-programs${suffix}`)
}
  const getApplications = async (applicantId: number) => request(`/admission/applicant-portal/applicants/${applicantId}/applications`)

  const applyToProgram = async (payload: {
    applicant_id: number
    offered_program_id: number
    program_quota_seat_id?: number | null
    preference_order?: number
    submit_now?: boolean
    remarks?: string
  }) => {
    return await request('/admission/applicant-portal/applications/apply', {
      method: 'POST',
      body: payload,
    })
  }

  const getChecklist = async (applicationId: number) => request(`/admission/applicant-portal/applications/${applicationId}/checklist`)

  const finalSubmit = async (applicationId: number) => {
    return await request(`/admission/applicant-portal/applications/${applicationId}/final-submit`, {
      method: 'POST',
    })
  }

  const generateVoucher = async (applicationId: number) => {
    return await request('/admission/fees/vouchers/generate', {
      method: 'POST',
      body: {
        applicant_program_application_id: applicationId,
        voucher_type_code: 'application_fee',
      },
    })
  }

  const getApplicationVouchers = async (applicationId: number) => request(`/admission/fees/applications/${applicationId}/vouchers`)

  const submitApplicantPayment = async (payload: {
    applicant_fee_voucher_id: number
    payment_method_code: string
    payment_reference_no?: string | null
    payment_date?: string | null
    amount: number
    payment_proof_document_id?: number | null
    remarks?: string | null
  }) => {
    return await request('/admission/fees/payments/submit', {
      method: 'POST',
      body: payload,
    })
  }

  const verifyApplicantPayment = async (paymentId: number, remarks?: string | null) => {
    return await request(`/admission/fees/payments/${paymentId}/verify`, {
      method: 'PATCH',
      body: { remarks },
    })
  }

  const rejectApplicantPayment = async (paymentId: number, rejectionReason: string) => {
    return await request(`/admission/fees/payments/${paymentId}/reject`, {
      method: 'PATCH',
      body: { rejection_reason: rejectionReason },
    })
  }

  const getPreferenceGroup = async (applicantId: number, admissionSessionId?: number | null) => {
    const suffix = admissionSessionId ? `?admission_session_id=${admissionSessionId}` : ''
    return await request(`/admission/applicant-portal/applicants/${applicantId}/preference-group${suffix}`)
  }

  const addPreference = async (applicantId: number, payload: {
    offered_program_id: number
    remarks?: string | null
    }) => {
    return await request(`/admission/applicant-portal/applicants/${applicantId}/preference-group/preferences`, {
      method: 'POST',
      body: payload,
    })
  }

  const reorderPreferences = async (applicantId: number, items: Array<{ id: number; preference_order: number }>) => {
    return await request(`/admission/applicant-portal/applicants/${applicantId}/preference-group/reorder`, {
      method: 'PATCH',
      body: { items },
    })
  }

  const removePreference = async (applicantId: number, applicationId: number) => {
    return await request(`/admission/applicant-portal/applicants/${applicantId}/preference-group/preferences/${applicationId}`, {
      method: 'DELETE',
    })
  }

  const submitPreferenceGroup = async (applicantId: number, groupId: number) => {
    return await request(`/admission/applicant-portal/applicants/${applicantId}/preference-group/${groupId}/submit`, {
      method: 'POST',
    })
  }

  const applicantGetProfile = async () => request('/applicant/self-service/profile')

  const applicantUpdateProfile = async (payload: Record<string, any>) => {
    return await request('/applicant/self-service/profile', {
      method: 'PUT',
      body: payload,
    })
  }

  const applicantGetQualifications = async () => request('/applicant/self-service/qualifications')

  const applicantSaveQualification = async (payload: Record<string, any>, id?: number | null) => {
    return await request('/applicant/self-service/qualifications', {
      method: 'POST',
      body: { ...payload, id: id || payload.id || null },
    })
  }

  const applicantDeleteQualification = async (id: number) => request(`/applicant/self-service/qualifications/${id}`, { method: 'DELETE' })

  const applicantGetExperiences = async () => request('/applicant/self-service/experiences')

  const applicantSaveExperience = async (payload: Record<string, any>, id?: number | null) => {
    return await request('/applicant/self-service/experiences', {
      method: 'POST',
      body: { ...payload, id: id || payload.id || null },
    })
  }

  const applicantDeleteExperience = async (id: number) => request(`/applicant/self-service/experiences/${id}`, { method: 'DELETE' })

  const applicantGetResearchProfile = async () => request('/applicant/self-service/research-profile')

  const applicantSaveResearchProfile = async (payload: Record<string, any>) => {
    return await request('/applicant/self-service/research-profile', {
      method: 'POST',
      body: payload,
    })
  }

  const applicantGetPublications = async () => request('/applicant/self-service/publications')

  const applicantSavePublication = async (payload: Record<string, any>, id?: number | null) => {
    return await request('/applicant/self-service/publications', {
      method: 'POST',
      body: { ...payload, id: id || payload.id || null },
    })
  }

  const applicantDeletePublication = async (id: number) => request(`/applicant/self-service/publications/${id}`, { method: 'DELETE' })

  const applicantGetTestResults = async () => request('/applicant/self-service/test-results')

  const applicantSaveTestResult = async (payload: Record<string, any>, id?: number | null) => {
    return await request('/applicant/self-service/test-results', {
      method: 'POST',
      body: { ...payload, id: id || payload.id || null },
    })
  }

  const applicantDeleteTestResult = async (id: number) => request(`/applicant/self-service/test-results/${id}`, { method: 'DELETE' })

  const applicantGetDocuments = async () => request('/applicant/self-service/documents')
  const applicantGetEligiblePrograms = async (preferenceGroupId?: number | null) => {
  const suffix = preferenceGroupId ? `?preference_group_id=${preferenceGroupId}` : ''
  return await request(`/applicant/self-service/eligible-programs${suffix}`)
}
  const applicantGetApplications = async () => request('/applicant/self-service/applications')

  const applicantApplyToProgram = async (payload: {
    offered_program_id: number
    program_quota_seat_id?: number | null
    preference_order?: number
    submit_now?: boolean
    remarks?: string
  }) => {
    return await request('/applicant/self-service/applications/apply', {
      method: 'POST',
      body: payload,
    })
  }

  const applicantGetChecklist = async (applicationId: number) => request(`/applicant/self-service/applications/${applicationId}/checklist`)

  const applicantFinalSubmit = async (applicationId: number) => {
    return await request(`/applicant/self-service/applications/${applicationId}/final-submit`, {
      method: 'POST',
    })
  }

  const applicantGenerateVoucher = async (applicationId: number) => {
    return await request(`/applicant/self-service/applications/${applicationId}/voucher`, {
      method: 'POST',
    })
  }

  const applicantGetApplicationVouchers = async (applicationId: number) => request(`/applicant/self-service/applications/${applicationId}/vouchers`)

  const applicantSubmitPayment = async (payload: Record<string, any>) => {
    return await request('/applicant/self-service/payments/submit', {
      method: 'POST',
      body: payload,
    })
  }

  const applicantGetPreferenceGroup = async (admissionSessionId?: number | null) => {
    const suffix = admissionSessionId ? `?admission_session_id=${admissionSessionId}` : ''
    return await request(`/applicant/self-service/preference-group${suffix}`)
  }

    const applicantAddPreference = async (payload: {
        offered_program_id: number
        remarks?: string | null
    }) => {
    return await request('/applicant/self-service/preference-group/preferences', {
      method: 'POST',
      body: payload,
    })
  }

  const applicantReorderPreferences = async (items: Array<{ id: number; preference_order: number }>) => {
    return await request('/applicant/self-service/preference-group/reorder', {
      method: 'PATCH',
      body: { items },
    })
  }

  const applicantRemovePreference = async (applicationId: number) => {
    return await request(`/applicant/self-service/preference-group/preferences/${applicationId}`, {
      method: 'DELETE',
    })
  }

  const applicantSubmitPreferenceGroup = async (groupId: number) => {
    return await request(`/applicant/self-service/preference-group/${groupId}/submit`, {
      method: 'POST',
    })
  }

  const getEligibilityPolicyLookups = async () => request('/admission/eligibility-policy/lookups')

  const getEligibilityPolicy = async (offeredProgramId: number, programQuotaSeatId?: number | null) => {
    const suffix = programQuotaSeatId ? `?program_quota_seat_id=${programQuotaSeatId}` : ''
    return await request(`/admission/eligibility-policy/offered-programs/${offeredProgramId}${suffix}`)
  }

  const saveEligibilityPolicy = async (offeredProgramId: number, payload: Record<string, any>) => {
    return await request(`/admission/eligibility-policy/offered-programs/${offeredProgramId}`, {
      method: 'POST',
      body: payload,
    })
  }



  
const buildQuery = (params: Record<string, any> = {}) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, String(value))
    }
  })

  return query.toString() ? `?${query.toString()}` : ''
}
  const getPaymentVerificationPayments = async (params: Record<string, any> = {}) => {
    const query = buildQuery(params)
    const suffix = query ? `?${query}` : ''
    return await request(`/admission/payment-verification/payments${suffix}`)
  }

  const getPaymentVerificationPayment = async (paymentId: number) => {
    return await request(`/admission/payment-verification/payments/${paymentId}`)
  }

  const verifyPaymentFromAdmin = async (paymentId: number, remarks?: string | null) => {
    return await request(`/admission/payment-verification/payments/${paymentId}/verify`, {
      method: 'PATCH',
      body: { remarks },
    })
  }

  const rejectPaymentFromAdmin = async (paymentId: number, rejectionReason: string) => {
    return await request(`/admission/payment-verification/payments/${paymentId}/reject`, {
      method: 'PATCH',
      body: { rejection_reason: rejectionReason },
    })
  }
const getApplicantProgressList = async (params: Record<string, any> = {}) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, String(value))
    }
  })

  const suffix = query.toString() ? `?${query.toString()}` : ''

  return await request(`/admission/applicant-progress${suffix}`)
}

const getApplicantProgressDetail = async (applicantId: number) => {
  return await request(`/admission/applicant-progress/${applicantId}`)
}
const getQuestionEditorList = async (params: Record<string, any> = {}) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, String(value))
    }
  })

  const suffix = query.toString() ? `?${query.toString()}` : ''

  return await request(`/assessment/questions${suffix}`)
}

const getQuestionEditorItem = async (id: number) => {
  return await request(`/assessment/questions/${id}`)
}

const createQuestionEditorItem = async (payload: Record<string, any>) => {
  return await request('/assessment/questions', {
    method: 'POST',
    body: payload,
  })
}

const updateQuestionEditorItem = async (id: number, payload: Record<string, any>) => {
  return await request(`/assessment/questions/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

const deleteQuestionEditorItem = async (id: number) => {
  return await request(`/assessment/questions/${id}`, {
    method: 'DELETE',
  })
}

const bulkImportQuestions = async (rows: any[]) => {
  return await request('/assessment/questions/bulk-import', {
    method: 'POST',
    body: {
      rows,
    },
  })
}
const importQuestionsExcel = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  return await request('/assessment/questions/import-excel', {
    method: 'POST',
    body: formData,
  })
}
const getAssessmentBuilder = async (assessmentId: number) => {
  return await request(`/assessment/builder/assessments/${assessmentId}`)
}

const createAssessmentBuilderSection = async (assessmentId: number, payload: Record<string, any>) => {
  return await request(`/assessment/builder/assessments/${assessmentId}/sections`, {
    method: 'POST',
    body: payload,
  })
}

const updateAssessmentBuilderSection = async (sectionId: number, payload: Record<string, any>) => {
  return await request(`/assessment/builder/sections/${sectionId}`, {
    method: 'PUT',
    body: payload,
  })
}

const deleteAssessmentBuilderSection = async (sectionId: number) => {
  return await request(`/assessment/builder/sections/${sectionId}`, {
    method: 'DELETE',
  })
}

const getAssessmentAvailableQuestions = async (params: Record<string, any> = {}) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, String(value))
    }
  })

  const suffix = query.toString() ? `?${query.toString()}` : ''

  return await request(`/assessment/builder/questions/available${suffix}`)
}

const bulkAssignAssessmentQuestions = async (sectionId: number, payload: Record<string, any>) => {
  return await request(`/assessment/builder/sections/${sectionId}/bulk-assign-questions`, {
    method: 'POST',
    body: payload,
  })
}

const removeAssessmentQuestion = async (assessmentQuestionId: number) => {
  return await request(`/assessment/builder/assessment-questions/${assessmentQuestionId}`, {
    method: 'DELETE',
  })
}
const getAssessmentParticipants = async (params: Record<string, any> = {}) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, String(value))
    }
  })

  const suffix = query.toString() ? `?${query.toString()}` : ''

  return await request(`/assessment/participants${suffix}`)
}

const getAssessmentApplicantCandidates = async (params: Record<string, any> = {}) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, String(value))
    }
  })

  const suffix = query.toString() ? `?${query.toString()}` : ''

  return await request(`/assessment/participants/candidates/applicants${suffix}`)
}

const bulkAssignApplicantsToAssessment = async (payload: Record<string, any>) => {
  return await request('/assessment/participants/bulk-assign-applicants', {
    method: 'POST',
    body: payload,
  })
}

const generateAssessmentRollNumbers = async (payload: Record<string, any>) => {
  return await request('/assessment/participants/generate-roll-numbers', {
    method: 'POST',
    body: payload,
  })
}

const getAssessmentRollNoSlip = async (participantId: number) => {
  return await request(`/assessment/participants/${participantId}/roll-no-slip`)
}

const applicantGetMyTests = async () => {
  return await request('/applicant/self-service/assessments/my-tests')
}

const applicantGetAssessmentRollNoSlip = async (participantId: number) => {
  return await request(`/applicant/self-service/assessments/participants/${participantId}/roll-no-slip`)
}

const applicantStartAssessmentAttempt = async (participantId: number) => {
  return await request(`/applicant/self-service/assessments/participants/${participantId}/start-attempt`, {
    method: 'POST',
  })
}

const applicantGetAssessmentAttempt = async (attemptId: number) => {
  return await request(`/applicant/self-service/assessments/attempts/${attemptId}`)
}

const applicantSaveAssessmentAnswer = async (attemptId: number, payload: Record<string, any>) => {
  return await request(`/applicant/self-service/assessments/attempts/${attemptId}/answers`, {
    method: 'POST',
    body: payload,
  })
}

const applicantSubmitAssessmentAttempt = async (attemptId: number) => {
  return await request(`/applicant/self-service/assessments/attempts/${attemptId}/submit`, {
    method: 'POST',
  })
}

const generateAssessmentResultForAttempt = async (attemptId: number) => {
  return await request(`/assessment/results/attempts/${attemptId}/generate`, {
    method: 'POST',
  })
}

const approveAssessmentResult = async (resultId: number) => {
  return await request(`/assessment/results/${resultId}/approve`, {
    method: 'POST',
  })
}

const publishAssessmentResult = async (resultId: number) => {
  return await request(`/assessment/results/${resultId}/publish`, {
    method: 'POST',
  })
}
const syncAssessmentResultToAdmission = async (assessmentResultId: number) => {
  return await request(`/assessment/admission-sync/results/${assessmentResultId}`, {
    method: 'POST',
  })
}
const getAdminAssessmentAttempts = async (params: Record<string, any> = {}) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, String(value))
    }
  })

  const suffix = query.toString() ? `?${query.toString()}` : ''

  return await request(`/assessment/admin/attempts${suffix}`)
}

const getAdminAssessmentAttemptDetail = async (attemptId: number) => {
  return await request(`/assessment/admin/attempts/${attemptId}`)
}
const getAdminAssessmentResults = async (params: Record<string, any> = {}) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, String(value))
    }
  })

  const suffix = query.toString() ? `?${query.toString()}` : ''

  return await request(`/assessment/admin/results${suffix}`)
}

const getAdminAssessmentResultDetail = async (resultId: number) => {
  return await request(`/assessment/admin/results/${resultId}`)
}

const approveAdminAssessmentResult = async (resultId: number) => {
  return await request(`/assessment/admin/results/${resultId}/approve`, {
    method: 'POST',
  })
}

const publishAdminAssessmentResult = async (resultId: number) => {
  return await request(`/assessment/admin/results/${resultId}/publish`, {
    method: 'POST',
  })
}

const syncAdminAssessmentResultToAdmission = async (resultId: number) => {
  return await request(`/assessment/admin/results/${resultId}/sync-to-admission`, {
    method: 'POST',
  })
}
const getAdminAssessmentAnalytics = async (params: Record<string, any> = {}) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, String(value))
    }
  })

  const suffix = query.toString() ? `?${query.toString()}` : ''

  return await request(`/assessment/admin/analytics${suffix}`)
}
const importAssessmentQuestionsExcel = async (formData: FormData) => {
  return await request('/assessment/questions/import/excel', {
    method: 'POST',
    body: formData,
  })
}

const downloadAssessmentQuestionImportTemplate = async () => {
  return await request('/assessment/questions/import/template')
}
const getManualMarkingPendingAnswers = async (params: Record<string, any> = {}) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, String(value))
    }
  })

  const suffix = query.toString() ? `?${query.toString()}` : ''

  return await request(`/assessment/admin/manual-marking/pending${suffix}`)
}

const markManualAnswer = async (answerId: number, payload: Record<string, any>) => {
  return await request(`/assessment/admin/manual-marking/answers/${answerId}/mark`, {
    method: 'POST',
    body: payload,
  })
}
const getMeritBuilderFormulas = async (params: Record<string, any> = {}) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, String(value))
    }
  })

  const suffix = query.toString() ? `?${query.toString()}` : ''

  return await request(`/admission/merit-builder/formulas${suffix}`)
}

const getMeritBuilderFormula = async (formulaId: number) => {
  return await request(`/admission/merit-builder/formulas/${formulaId}`)
}

const createMeritBuilderFormula = async (payload: Record<string, any>) => {
  return await request('/admission/merit-builder/formulas', {
    method: 'POST',
    body: payload,
  })
}

const updateMeritBuilderFormula = async (formulaId: number, payload: Record<string, any>) => {
  return await request(`/admission/merit-builder/formulas/${formulaId}`, {
    method: 'PUT',
    body: payload,
  })
}

const deleteMeritBuilderFormula = async (formulaId: number) => {
  return await request(`/admission/merit-builder/formulas/${formulaId}`, {
    method: 'DELETE',
  })
}

const createMeritFormulaComponent = async (formulaId: number, payload: Record<string, any>) => {
  return await request(`/admission/merit-builder/formulas/${formulaId}/components`, {
    method: 'POST',
    body: payload,
  })
}

const updateMeritFormulaComponent = async (componentId: number, payload: Record<string, any>) => {
  return await request(`/admission/merit-builder/components/${componentId}`, {
    method: 'PUT',
    body: payload,
  })
}

const deleteMeritFormulaComponent = async (componentId: number) => {
  return await request(`/admission/merit-builder/components/${componentId}`, {
    method: 'DELETE',
  })
}

const createMeritFormulaApplicability = async (formulaId: number, payload: Record<string, any>) => {
  return await request(`/admission/merit-builder/formulas/${formulaId}/applicabilities`, {
    method: 'POST',
    body: payload,
  })
}

const updateMeritFormulaApplicability = async (applicabilityId: number, payload: Record<string, any>) => {
  return await request(`/admission/merit-builder/applicabilities/${applicabilityId}`, {
    method: 'PUT',
    body: payload,
  })
}

const deleteMeritFormulaApplicability = async (applicabilityId: number) => {
  return await request(`/admission/merit-builder/applicabilities/${applicabilityId}`, {
    method: 'DELETE',
  })
}

const calculateApplicantMeritScore = async (payload: Record<string, any>) => {
  return await request('/admission/merit-calculation/calculate-applicant', {
    method: 'POST',
    body: payload,
  })
}

const bulkCalculateApplicantMeritScores = async (payload: Record<string, any>) => {
  return await request('/admission/merit-calculation/bulk-calculate', {
    method: 'POST',
    body: payload,
  })
}
const getApplicantMeritScores = async (params: Record<string, any> = {}) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, String(value))
    }
  })

  const suffix = query.toString() ? `?${query.toString()}` : ''

  return await request(`/admission/merit-scores${suffix}`)
}

const getApplicantMeritScoreDetail = async (scoreId: number) => {
  return await request(`/admission/merit-scores/${scoreId}`)
}
const getMeritLists = async (params: Record<string, any> = {}) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, String(value))
    }
  })

  const suffix = query.toString() ? `?${query.toString()}` : ''

  return await request(`/admission/merit-lists${suffix}`)
}

const getMeritListDetail = async (meritListId: number) => {
  return await request(`/admission/merit-lists/${meritListId}`)
}

const generateMeritList = async (payload: Record<string, any>) => {
  return await request('/admission/merit-lists/generate', {
    method: 'POST',
    body: payload,
  })
}

const publishMeritList = async (meritListId: number) => {
  return await request(`/admission/merit-lists/${meritListId}/publish`, {
    method: 'POST',
  })
}

const cancelMeritList = async (meritListId: number) => {
  return await request(`/admission/merit-lists/${meritListId}/cancel`, {
    method: 'POST',
  })
}
const generateMeritOffers = async (meritListId: number, payload: Record<string, any> = {}) => {
  return await request(`/admission/merit-offers/lists/${meritListId}/generate-offers`, {
    method: 'POST',
    body: payload,
  })
}

const getMeritOfferMovements = async (meritListId: number) => {
  return await request(`/admission/merit-offers/lists/${meritListId}/movements`)
}

const acceptMeritOffer = async (meritListApplicantId: number, payload: Record<string, any> = {}) => {
  return await request(`/admission/merit-offers/applicants/${meritListApplicantId}/accept`, {
    method: 'POST',
    body: payload,
  })
}

const rejectMeritOffer = async (meritListApplicantId: number, payload: Record<string, any> = {}) => {
  return await request(`/admission/merit-offers/applicants/${meritListApplicantId}/reject`, {
    method: 'POST',
    body: payload,
  })
}

const expireMeritOffer = async (meritListApplicantId: number, payload: Record<string, any> = {}) => {
  return await request(`/admission/merit-offers/applicants/${meritListApplicantId}/expire`, {
    method: 'POST',
    body: payload,
  })
}
const applicantAdmissionOffers = async () => {
  return await request('/applicant/admission-offers')
}

const applicantAcceptAdmissionOffer = async (
  meritListApplicantId: number,
  payload: Record<string, any> = {}
) => {
  return await request(`/applicant/admission-offers/${meritListApplicantId}/accept`, {
    method: 'POST',
    body: payload,
  })
}

const applicantRejectAdmissionOffer = async (
  meritListApplicantId: number,
  payload: Record<string, any> = {}
) => {
  return await request(`/applicant/admission-offers/${meritListApplicantId}/reject`, {
    method: 'POST',
    body: payload,
  })
}
const getDynamicFieldStorageRules = async (moduleCode: string, entityKey: string) => {
  return await request(`/platform/dynamic-field-storage-rules/${moduleCode}/${entityKey}`)
}
const submitAdmissionOfferPayment = async (meritListApplicantId: number, payload: any) => {
  return await request(`/applicant/admission-offers/${meritListApplicantId}/submit-payment`, {
    method: 'POST',
    body: payload,
  })
}
const getAdmittedCandidates = async (params: Record<string, any> = {}) => {
  const query = buildQuery(params)
  const suffix = query ? `?${query}` : ''

  return await request(`/admission/closure-reports/admitted-candidates${suffix}`)
}

const getAdmissionSeatSummary = async (params: Record<string, any> = {}) => {
  const query = buildQuery(params)
  const suffix = query ? `?${query}` : ''

  return await request(`/admission/closure-reports/seat-summary${suffix}`)
}

const generateWaitingList = async (meritListId: number) => {
  return await request(`/admission/waiting-lists/merit-lists/${meritListId}/generate`, {
    method: 'POST',
  })
}

const promoteNextWaitingCandidate = async (
  meritListId: number,
  payload: Record<string, any> = {}
) => {
  return await request(`/admission/waiting-lists/merit-lists/${meritListId}/promote-next`, {
    method: 'POST',
    body: payload,
  })
}

const getWaitingListMovements = async (
  meritListId: number,
  params: Record<string, any> = {}
) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, String(value))
    }
  })

  const suffix = query.toString() ? `?${query.toString()}` : ''

  return await request(`/admission/waiting-lists/merit-lists/${meritListId}/movements${suffix}`)
}
const getAdmissionDashboardSummary = async (params: Record<string, any> = {}) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, String(value))
    }
  })

  const suffix = query.toString() ? `?${query.toString()}` : ''

  return await request(`/admission/dashboard/summary${suffix}`)
}

const getAdmissionReport = async (
  reportCode: string,
  params: Record<string, any> = {}
) => {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      query.append(key, String(value))
    }
  })

  const suffix = query.toString() ? `?${query.toString()}` : ''

  return await request(`/admission/reports/${reportCode}${suffix}`)
}
const applicantGetAdmissionOffers = async () => {
  return await request('/applicant/admission-offers')
}
const transferConfirmedAdmissionToStudent = async (confirmationId: number) => {
  return await request(`/admission/confirmations/${confirmationId}/transfer-student`, {
    method: 'POST',
  })
}
const finalizeConfirmedAdmission = async (
  confirmationId: number,
  payload: Record<string, any> = {}
) => {
  return await request(`/admission/confirmations/${confirmationId}/finalize`, {
    method: 'POST',
    body: payload,
  })
}
const applicantGetEditLocks = async () => {
  return await request('/applicant/self-service/edit-locks')
}

const getApplicantEditLocks = async (applicantId: number) => {
  return await request(`/admission/applicants/${applicantId}/edit-locks`)
}
const applicantGetMyAssessments = async () => {
  return await request('/applicant/self-service/assessments/my-tests')
}

const applicantGetAssessmentAttemptReview = async (attemptId: number) => {
  return await request(`/applicant/self-service/assessments/attempts/${attemptId}/review`)
}
const applicantLogAssessmentAttemptActivity = async (
  attemptId: number,
  payload: Record<string, any>
) => {
  return await request(`/applicant/self-service/assessments/attempts/${attemptId}/activity`, {
    method: 'POST',
    body: payload,
  })
}
return {
    request,
    getOptions,
    getAdmissionPreferenceGroups,
    crudList,
    crudShow,
    crudCreate,
    crudUpdate,
    crudDelete,

    getApplicants,
    getApplicant,
    updateApplicant,

    getApplicantQualifications,
    saveApplicantQualification,
    deleteApplicantQualification,

    getApplicantExperiences,
    saveApplicantExperience,
    deleteApplicantExperience,

    getApplicantResearchProfiles,
    saveApplicantResearchProfile,

    getApplicantPublications,
    saveApplicantPublication,
    deleteApplicantPublication,

    getApplicantTestResults,
    saveApplicantTestResult,
    deleteApplicantTestResult,

    getApplicantDocuments,
    uploadApplicantDocument,
    deleteApplicantDocument,

    getEligiblePrograms,
    getApplications,
    applyToProgram,
    getChecklist,
    finalSubmit,
    generateVoucher,
    getApplicationVouchers,

    submitApplicantPayment,
    verifyApplicantPayment,
    rejectApplicantPayment,

    getPreferenceGroup,
    addPreference,
    reorderPreferences,
    removePreference,
    submitPreferenceGroup,

    isApplicantSession,

    applicantGetProfile,
    applicantUpdateProfile,

    applicantGetQualifications,
    applicantSaveQualification,
    applicantDeleteQualification,

    applicantGetExperiences,
    applicantSaveExperience,
    applicantDeleteExperience,

    applicantGetResearchProfile,
    applicantSaveResearchProfile,

    applicantGetPublications,
    applicantSavePublication,
    applicantDeletePublication,

    applicantGetTestResults,
    applicantSaveTestResult,
    applicantDeleteTestResult,

    applicantGetDocuments,

    applicantGetEligiblePrograms,
    applicantGetApplications,
    applicantApplyToProgram,

    applicantGetChecklist,
    applicantFinalSubmit,
    applicantGenerateVoucher,
    applicantGetApplicationVouchers,
    applicantSubmitPayment,

    applicantGetPreferenceGroup,
    applicantAddPreference,
    applicantReorderPreferences,
    applicantRemovePreference,
    applicantSubmitPreferenceGroup,

    getEligibilityPolicyLookups,
    getEligibilityPolicy,
    saveEligibilityPolicy,


    getPaymentVerificationPayments,
    getPaymentVerificationPayment,
    verifyPaymentFromAdmin,
    rejectPaymentFromAdmin,
    getApplicantProgressList,
    getApplicantProgressDetail,
    getQuestionEditorList,
    getQuestionEditorItem,
    createQuestionEditorItem,
    updateQuestionEditorItem,
    deleteQuestionEditorItem,
    bulkImportQuestions,
    importQuestionsExcel,
    getAssessmentBuilder,
    createAssessmentBuilderSection,
    updateAssessmentBuilderSection,
    deleteAssessmentBuilderSection,
    getAssessmentAvailableQuestions,
    bulkAssignAssessmentQuestions,
    removeAssessmentQuestion,
    getAssessmentParticipants,
    getAssessmentApplicantCandidates,
    bulkAssignApplicantsToAssessment,
    generateAssessmentRollNumbers,
    getAssessmentRollNoSlip,
    applicantGetMyTests,
    applicantGetAssessmentRollNoSlip,
    applicantStartAssessmentAttempt,
    applicantGetAssessmentAttempt,
    applicantSaveAssessmentAnswer,
    applicantSubmitAssessmentAttempt,
    generateAssessmentResultForAttempt,
    approveAssessmentResult,
    publishAssessmentResult,
    syncAssessmentResultToAdmission,
    getAdminAssessmentAttempts,
    getAdminAssessmentAttemptDetail,
    getAdminAssessmentResults,
    getAdminAssessmentResultDetail,
    approveAdminAssessmentResult,
    publishAdminAssessmentResult,
    syncAdminAssessmentResultToAdmission,
    getAdminAssessmentAnalytics,
    importAssessmentQuestionsExcel,
    downloadAssessmentQuestionImportTemplate,
    getManualMarkingPendingAnswers,
    markManualAnswer,
    getMeritBuilderFormulas,
    getMeritBuilderFormula,
    createMeritBuilderFormula,
    updateMeritBuilderFormula,
    deleteMeritBuilderFormula,
    createMeritFormulaComponent,
    updateMeritFormulaComponent,
    deleteMeritFormulaComponent,
    createMeritFormulaApplicability,
    updateMeritFormulaApplicability,
    deleteMeritFormulaApplicability,
    calculateApplicantMeritScore,
    bulkCalculateApplicantMeritScores,
    getApplicantMeritScores,
    getApplicantMeritScoreDetail,
    getMeritLists,
    getMeritListDetail,
    generateMeritList,
    publishMeritList,
    cancelMeritList,
    generateMeritOffers,
    getMeritOfferMovements,
    acceptMeritOffer,
    rejectMeritOffer,
    expireMeritOffer,
    applicantAdmissionOffers,
    applicantAcceptAdmissionOffer,
    applicantRejectAdmissionOffer,
    getDynamicFieldStorageRules,
    submitAdmissionOfferPayment,
    getAdmittedCandidates,
    getAdmissionSeatSummary,
    generateWaitingList,
    promoteNextWaitingCandidate,
    getWaitingListMovements,
    getAdmissionDashboardSummary,
    getAdmissionReport,
    applicantGetAdmissionOffers,
    transferConfirmedAdmissionToStudent,
    finalizeConfirmedAdmission,
    applicantGetEditLocks,
    getApplicantEditLocks,
    applicantGetMyAssessments,
    applicantGetAssessmentAttemptReview,
    applicantLogAssessmentAttemptActivity,
  }
}
