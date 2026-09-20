# PreOne Enterprise Error Code Registry

| Error Code | HTTP Status | Error Class | Default User Message | Typical Cause / Resolution |
| :--- | :---: | :---: | :--- | :--- |
| `AUTH_001` | 401 | OPERATIONAL | Please sign in to continue. | Missing or invalid auth session cookie. |
| `AUTH_002` | 401 | OPERATIONAL | Your session has expired or is invalid. | Expired token / revoked session. |
| `PERMISSION_001` | 403 | OPERATIONAL | You do not have permission to perform this action. | User lacks required RBAC role permission. |
| `PERMISSION_002` | 403 | OPERATIONAL | Only school owners or platform administrators can modify owner accounts. | Privilege escalation attempt against owner. |
| `PERMISSION_003` | 403 | OPERATIONAL | Access restricted. You cannot manage resources outside your assigned campus branch. | Cross-branch boundary violation. |
| `NOT_FOUND_001` | 404 | OPERATIONAL | The requested resource could not be found. | Entity ID not found or scoped to another tenant. |
| `NOT_FOUND_STUDENT_001` | 404 | OPERATIONAL | Student record not found. | Admission number or student ID missing. |
| `NOT_FOUND_STAFF_001` | 404 | OPERATIONAL | Staff member profile not found. | Employee ID missing. |
| `CONFLICT_001` | 409 | OPERATIONAL | A record with this information already exists. | Database unique constraint violation. |
| `CONFLICT_EMAIL_001` | 409 | OPERATIONAL | A user with this email address already exists in this school. | Duplicate email address within tenant. |
| `CONFLICT_PHONE_001` | 409 | OPERATIONAL | A user with this mobile number already exists in this school. | Duplicate phone number within tenant. |
| `CONFLICT_EMPLOYEE_CODE_001` | 409 | OPERATIONAL | A staff member with this employee code already exists in this school. | Duplicate staff employee code. |
| `CONFLICT_ADMISSION_NO_001` | 409 | OPERATIONAL | A student with this admission number already exists in this school. | Duplicate student admission number. |
| `VALIDATION_001` | 400 | OPERATIONAL | Please check the highlighted fields and correct any errors. | Form input schema validation failure. |
| `VALIDATION_REQUIRED_001` | 400 | OPERATIONAL | This field is required. | Missing mandatory parameter. |
| `BUSINESS_PARENT_LIMIT_001` | 422 | OPERATIONAL | A student cannot have more than 2 primary parent accounts. | 2-Parent ceiling reached. |
| `BUSINESS_CLASSROOM_FULL_001` | 422 | OPERATIONAL | This classroom has reached its maximum student capacity. | Classroom capacity constraint. |
| `BUSINESS_FEE_ALREADY_PAID_001` | 422 | OPERATIONAL | This invoice has already been paid or settled. | Attempt to pay an already settled invoice. |
| `BUSINESS_SCHOOL_CLOSED` | 422 | OPERATIONAL | Attendance not expected on this date (school closed/holiday). | Daily ops calendar non-operating day. |
| `RATE_LIMIT_001` | 429 | OPERATIONAL | Too many requests. Please wait a moment before trying again. | Exceeded rate quota. |
| `AUDIT_WRITE_FAILED` | N/A | OPERATIONAL | Failed to write audit log. | Background audit failure (logged as WARN). |
| `SYSTEM_001` | 500 | DEVELOPER | Something went wrong on our side. Please try again or contact support. | Unhandled system exception or runtime crash. |
| `SYSTEM_DB_001` | 500 | DEVELOPER | An unexpected database error occurred. | Database connection or serialization fault. |
