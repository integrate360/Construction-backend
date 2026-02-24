/**
 * @swagger
 * tags:
 *   name: Attendance
 *   description: Attendance management endpoints for labor check-in/check-out
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Enter JWT token in format "Bearer {token}"
 *
 *   schemas:
 *     Coordinates:
 *       type: array
 *       items:
 *         type: number
 *         format: float
 *       minItems: 2
 *       maxItems: 2
 *       example: [72.8777, 19.0760]
 *       description: Longitude first, then latitude
 *
 *     Location:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [Point]
 *           default: Point
 *         coordinates:
 *           $ref: '#/components/schemas/Coordinates'
 *       required:
 *         - coordinates
 *
 *     AttendanceType:
 *       type: string
 *       enum: [check-in, check-out]
 *       description: Type of attendance entry
 *
 *     HistoryEntry:
 *       type: object
 *       properties:
 *         attendanceType:
 *           $ref: '#/components/schemas/AttendanceType'
 *         selfieImage:
 *           type: string
 *           description: Base64 encoded image or image URL
 *           example: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 *         location:
 *           $ref: '#/components/schemas/Location'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of the entry
 *         editedByAdmin:
 *           type: boolean
 *           description: Indicates if entry was edited by admin
 *         editedAt:
 *           type: string
 *           format: date-time
 *           description: When the entry was last edited
 *
 *     AttendanceDocument:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         user:
 *           type: string
 *           description: User ID
 *           example: "507f1f77bcf86cd799439012"
 *         project:
 *           type: string
 *           description: Project ID
 *           example: "507f1f77bcf86cd799439013"
 *         history:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/HistoryEntry'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Error message here"
 *
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Operation successful"
 */

/**
 * @swagger
 * /attendance/submit:
 *   post:
 *     summary: Submit attendance (check-in/check-out)
 *     tags: [Attendance]
 *     description: Allows labor to mark attendance with location verification (must be within 10 meters of project)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *               - attendanceType
 *               - selfieImage
 *               - coordinates
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: ID of the project
 *                 example: "507f1f77bcf86cd799439013"
 *               attendanceType:
 *                 $ref: '#/components/schemas/AttendanceType'
 *               selfieImage:
 *                 type: string
 *                 description: Base64 encoded selfie image
 *                 example: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 *               coordinates:
 *                 $ref: '#/components/schemas/Coordinates'
 *     responses:
 *       201:
 *         description: Attendance saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Attendance saved successfully"
 *                 history:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HistoryEntry'
 *       400:
 *         description: Bad request - missing fields or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingFields:
 *                 value:
 *                   success: false
 *                   message: "All fields are required"
 *               invalidCoordinates:
 *                 value:
 *                   success: false
 *                   message: "Coordinates must be [longitude, latitude]"
 *               invalidSequence:
 *                 value:
 *                   success: false
 *                   message: "Already checked in. Please check out first."
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Unauthorized"
 *       403:
 *         description: Forbidden - location too far or wrong role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               locationError:
 *                 value:
 *                   success: false
 *                   message: "Attendance allowed only within 10 meters"
 *               roleError:
 *                 value:
 *                   success: false
 *                   message: "Only labour can mark attendance"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /attendance/my:
 *   get:
 *     summary: Get my attendance history
 *     tags: [Attendance]
 *     description: Returns attendance history for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 history:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         project:
 *                           type: object
 *                           properties:
 *                             _id:
 *                               type: string
 *                             projectName:
 *                               type: string
 *                             siteName:
 *                               type: string
 *                         history:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/HistoryEntry'
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                 totalRecords:
 *                   type: integer
 *                   example: 1
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /attendance/today/status:
 *   get:
 *     summary: Get today's attendance status
 *     tags: [Attendance]
 *     description: Returns current attendance status for today (not-marked, checked-in, checked-out)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's attendance status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   enum: [not-marked, checked-in, checked-out]
 *                   example: "checked-in"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /attendance/daily-hours:
 *   get:
 *     summary: Get daily working hours
 *     tags: [Attendance]
 *     description: Calculate total working hours for a specific date
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date in YYYY-MM-DD format
 *         example: "2024-01-15"
 *     responses:
 *       200:
 *         description: Daily working hours calculated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 totalHours:
 *                   type: string
 *                   example: "8.50"
 *       400:
 *         description: Missing date parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /attendance/status:
 *   get:
 *     summary: Get attendance status for a date
 *     tags: [Attendance]
 *     description: Returns attendance status (absent, present, late) for a specific date
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Date in YYYY-MM-DD format
 *         example: "2024-01-15"
 *     responses:
 *       200:
 *         description: Attendance status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   enum: [absent, present, late]
 *                   example: "late"
 *       400:
 *         description: Missing date parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /attendance/monthly-summary:
 *   get:
 *     summary: Get monthly attendance summary
 *     tags: [Attendance]
 *     description: Returns summary of attendance for a specific month
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         required: true
 *         description: Month (1-12)
 *         example: 1
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *           minimum: 2000
 *           maximum: 2100
 *         required: true
 *         description: Year
 *         example: 2024
 *     responses:
 *       200:
 *         description: Monthly summary retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 totalEntries:
 *                   type: integer
 *                   example: 22
 *                 daysWorked:
 *                   type: integer
 *                   example: 20
 *       400:
 *         description: Missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /attendance/project/{projectId}:
 *   get:
 *     summary: Get project attendance (Admin/Manager)
 *     tags: [Attendance]
 *     description: Returns all attendance records for a specific project (requires appropriate permissions)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *         example: "507f1f77bcf86cd799439013"
 *     responses:
 *       200:
 *         description: Project attendance retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 attendance:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       user:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           phoneNumber:
 *                             type: string
 *                       attendance:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/AttendanceDocument'
 *                 totalRecords:
 *                   type: integer
 *                   example: 45
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /attendance/project/{projectId}/timeline:
 *   get:
 *     summary: Get project timeline (Admin/Manager)
 *     tags: [Attendance]
 *     description: Returns timeline view of attendance for a specific project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         schema:
 *           type: string
 *         required: true
 *         description: Project ID
 *         example: "507f1f77bcf86cd799439013"
 *     responses:
 *       200:
 *         description: Project timeline retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 timeline:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user:
 *                         type: string
 *                         example: "John Doe"
 *                       history:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/HistoryEntry'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /attendance/admin/edit:
 *   put:
 *     summary: Edit attendance record (Admin only)
 *     tags: [Attendance]
 *     description: Allows admin to edit an existing attendance entry
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - attendanceId
 *               - historyIndex
 *               - attendanceType
 *             properties:
 *               attendanceId:
 *                 type: string
 *                 description: ID of the attendance document
 *                 example: "507f1f77bcf86cd799439011"
 *               historyIndex:
 *                 type: integer
 *                 description: Index of history entry to edit
 *                 example: 0
 *               attendanceType:
 *                 $ref: '#/components/schemas/AttendanceType'
 *     responses:
 *       200:
 *         description: Attendance corrected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Attendance corrected"
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidType:
 *                 value:
 *                   success: false
 *                   message: "Invalid attendance type"
 *               invalidIndex:
 *                 value:
 *                   success: false
 *                   message: "Invalid history index"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - not admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Attendance not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /attendance/admin/add:
 *   post:
 *     summary: Add attendance for labor (Super Admin only)
 *     tags: [Attendance]
 *     description: Super admin can manually add attendance records for any labor with auto-fix logic for sequence issues
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - labourId
 *               - projectId
 *               - attendanceType
 *               - selfieImage
 *               - coordinates
 *             properties:
 *               labourId:
 *                 type: string
 *                 description: ID of the labor
 *                 example: "507f1f77bcf86cd799439012"
 *               projectId:
 *                 type: string
 *                 description: ID of the project
 *                 example: "507f1f77bcf86cd799439013"
 *               attendanceType:
 *                 $ref: '#/components/schemas/AttendanceType'
 *               selfieImage:
 *                 type: string
 *                 description: Base64 encoded selfie image
 *                 example: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
 *               coordinates:
 *                 $ref: '#/components/schemas/Coordinates'
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *                 description: Optional custom timestamp for the attendance
 *                 example: "2024-01-15T08:30:00Z"
 *     responses:
 *       201:
 *         description: Attendance added by admin successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Attendance added by admin successfully"
 *                 history:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HistoryEntry'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingFields:
 *                 value:
 *                   success: false
 *                   message: "All fields are required"
 *               invalidType:
 *                 value:
 *                   success: false
 *                   message: "Invalid attendance type"
 *               invalidCoordinates:
 *                 value:
 *                   success: false
 *                   message: "Coordinates must be [longitude, latitude]"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - not super admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Only super admin can add attendance"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
