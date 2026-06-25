# TSID Government API Documentation

## Overview
The TSID Government API provides endpoints for managing the Tanzania Student Identification System.

## Base URL
- Development: http://localhost:5173/api
- Production: https://student-tanzania.vercel.app/api

## Authentication
All endpoints require JWT authentication.
Headers: Authorization: Bearer <token>

## Endpoints

### Students
- GET /students - Get all students
- POST /students - Create student
- GET /students/{tsid} - Get student by TSID
- PUT /students/{tsid} - Update student
- DELETE /students/{tsid} - Delete student
- GET /students/stats - Get statistics

### Schools
- GET /schools - Get all schools
- POST /schools - Register school
- GET /schools/{code} - Get school by code
- PUT /schools/{code} - Update school
- DELETE /schools/{code} - Delete school
- GET /schools/stats - Get statistics
- POST /schools/bulk - Bulk upload
- POST /schools/{code}/toggle-status - Toggle status
- POST /schools/{code}/reset-password - Reset password

### Admins
- GET /admins - Get all admins
- POST /admins - Create admin
- GET /admins/{uid} - Get admin by UID
- PUT /admins/{uid} - Update admin
- DELETE /admins/{uid} - Delete admin
- GET /admins/stats - Get statistics
- POST /admins/{uid}/reset-password - Reset password

### Approvals
- GET /approvals - Get all approvals
- POST /approvals - Create approval request
- GET /approvals/{id} - Get by ID
- POST /approvals/{id}/approve - Approve
- POST /approvals/{id}/reject - Reject
- POST /approvals/bulk - Bulk action
- GET /approvals/stats - Get statistics

### Analytics
- GET /analytics - Dashboard analytics
- GET /analytics/regions - Regional distribution
- GET /analytics/trends - Trend data
- GET /analytics/distribution - Distribution data

### Reports
- GET /reports - Get all reports
- POST /reports - Generate report
- GET /reports/{id} - Get by ID
- DELETE /reports/{id} - Delete report
- GET /reports/{id}/download - Download report

## Error Responses
All endpoints return standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

Error format: { "error": "Error message" }

## OpenAPI Spec
Full spec available at: /api-docs/openapi.json
