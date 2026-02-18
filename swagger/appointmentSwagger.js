/**
 * @swagger
 * components:
 *   schemas:
 *     Appointment:
 *       type: object
 *       required:
 *         - title
 *         - startTime
 *         - endTime
 *         - createdBy
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the appointment
 *         title:
 *           type: string
 *           description: The title of the appointment
 *         description:
 *           type: string
 *           description: Detailed description of the appointment
 *         startTime:
 *           type: string
 *           format: date-time
 *           description: Start time of the appointment
 *         endTime:
 *           type: string
 *           format: date-time
 *           description: End time of the appointment
 *         location:
 *           type: string
 *           description: Location of the appointment
 *         status:
 *           type: string
 *           enum: [scheduled, completed, cancelled, rescheduled]
 *           default: scheduled
 *           description: Current status of the appointment
 *         attendees:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of attendee names or emails
 *         createdBy:
 *           type: string
 *           description: User ID who created the appointment
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when appointment was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when appointment was last updated
 *
 *     AppointmentStats:
 *       type: object
 *       properties:
 *         scheduled:
 *           type: integer
 *           description: Number of scheduled appointments
 *         completed:
 *           type: integer
 *           description: Number of completed appointments
 *         cancelled:
 *           type: integer
 *           description: Number of cancelled appointments
 *         upcoming:
 *           type: integer
 *           description: Number of upcoming appointments
 *
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indicates if the request was successful
 *         data:
 *           type: object
 *           description: Response data
 *         message:
 *           type: string
 *           description: Response message
 *         error:
 *           type: string
 *           description: Error message (if any)
 *
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           description: Error message
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 * tags:
 *   name: Appointments
 *   description: Appointment management endpoints
 */

/**
 * @swagger
 * /api/appointments/calendar:
 *   get:
 *     summary: Get appointments for calendar view
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for calendar range (YYYY-MM-DD)
 *       - in: query
 *         name: end
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for calendar range (YYYY-MM-DD)
 *       - in: query
 *         name: view
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: month
 *         description: Calendar view type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, completed, cancelled, rescheduled]
 *         description: Filter by appointment status
 *     responses:
 *       200:
 *         description: Calendar appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       start:
 *                         type: string
 *                         format: date-time
 *                       end:
 *                         type: string
 *                         format: date-time
 *                       allDay:
 *                         type: boolean
 *                       backgroundColor:
 *                         type: string
 *                       borderColor:
 *                         type: string
 *                       extendedProps:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           location:
 *                             type: string
 *                           description:
 *                             type: string
 *                           attendees:
 *                             type: array
 *                             items:
 *                               type: string
 *                           project:
 *                             type: object
 *                           notes:
 *                             type: string
 *                           createdBy:
 *                             type: object
 *                 total:
 *                   type: integer
 *                 range:
 *                   type: object
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/appointments/agenda:
 *   get:
 *     summary: Get appointments in agenda view (grouped by date)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to look ahead
 *     responses:
 *       200:
 *         description: Agenda view retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         time:
 *                           type: string
 *                         endTime:
 *                           type: string
 *                         status:
 *                           type: string
 *                         location:
 *                           type: string
 *                         project:
 *                           type: string
 *                         duration:
 *                           type: string
 *                 count:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/appointments/check-availability:
 *   get:
 *     summary: Check if a time slot is available
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startTime
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start time to check (ISO format)
 *       - in: query
 *         name: endTime
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End time to check (ISO format)
 *       - in: query
 *         name: excludeId
 *         schema:
 *           type: string
 *         description: Appointment ID to exclude from check (useful when updating)
 *     responses:
 *       200:
 *         description: Availability check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 isAvailable:
 *                   type: boolean
 *                   example: false
 *                 conflicts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       startTime:
 *                         type: string
 *                         format: date-time
 *                       endTime:
 *                         type: string
 *                         format: date-time
 *                       createdBy:
 *                         type: string
 *       400:
 *         description: Bad request - Missing parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/appointments/stats:
 *   get:
 *     summary: Get appointment statistics (Admin only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AppointmentStats'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/appointments/upcoming:
 *   get:
 *     summary: Get upcoming appointments for the current user
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days to look ahead
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of appointments to return
 *     responses:
 *       200:
 *         description: Upcoming appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/appointments/getAppointments:
 *   get:
 *     summary: Get all appointments with filters and pagination
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, completed, cancelled, rescheduled]
 *         description: Filter by appointment status
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter appointments starting from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter appointments up to this date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, notes, location, and attendees
 *       - in: query
 *         name: attendee
 *         schema:
 *           type: string
 *         description: Filter by attendee name
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [startTime, endTime, title, createdAt]
 *           default: startTime
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/appointments/createAppointment:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - startTime
 *               - endTime
 *             properties:
 *               title:
 *                 type: string
 *                 description: Appointment title
 *               description:
 *                 type: string
 *                 description: Appointment description
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: Start time (ISO format)
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: End time (ISO format)
 *               location:
 *                 type: string
 *                 description: Appointment location
 *               reminderTime:
 *                 type: string
 *                 format: date-time
 *                 description: Reminder time (must be before start time)
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *               project:
 *                 type: string
 *                 description: Project ID to associate with
 *               attendees:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of attendee names or emails
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *                 message:
 *                   type: string
 *                   example: Appointment created successfully
 *       400:
 *         description: Bad request - Invalid input data or time conflict
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Conflict - Time slot already booked
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/appointments/getAppointmentById/{id}:
 *   get:
 *     summary: Get appointment by ID
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *       404:
 *         description: Appointment not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - You don't have permission to view this appointment
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/appointments/updateAppointment/{id}:
 *   put:
 *     summary: Update an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               reminderTime:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *               project:
 *                 type: string
 *               attendees:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [scheduled, completed, cancelled, rescheduled]
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *                 message:
 *                   type: string
 *                   example: Appointment updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only creator can update
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/appointments/deleteAppointment/{id}:
 *   delete:
 *     summary: Delete an appointment (soft delete)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment deleted successfully
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
 *                   example: Appointment deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only creator can delete
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/appointments/rescheduleAppointment/{id}/reschedule:
 *   patch:
 *     summary: Reschedule an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startTime
 *               - endTime
 *             properties:
 *               startTime:
 *                 type: string
 *                 format: date-time
 *                 description: New start time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *                 description: New end time
 *               reminderTime:
 *                 type: string
 *                 format: date-time
 *                 description: New reminder time (optional)
 *     responses:
 *       200:
 *         description: Appointment rescheduled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *                 message:
 *                   type: string
 *                   example: Appointment rescheduled successfully
 *       400:
 *         description: Invalid input or cannot reschedule
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only creator can reschedule
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/appointments/cancelAppointment/{id}/cancel:
 *   patch:
 *     summary: Cancel an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation (optional)
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *                 message:
 *                   type: string
 *                   example: Appointment cancelled successfully
 *       400:
 *         description: Cannot cancel - Appointment already completed/cancelled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only creator can cancel
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/appointments/completeAppointment/{id}/complete:
 *   patch:
 *     summary: Mark appointment as completed
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Appointment'
 *                 message:
 *                   type: string
 *                   example: Appointment marked as completed
 *       400:
 *         description: Cannot complete - Appointment is cancelled/already completed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only creator can mark as completed
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/appointments/addAttendee/{id}/attendees:
 *   post:
 *     summary: Add an attendee to appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - attendee
 *             properties:
 *               attendee:
 *                 type: string
 *                 description: Attendee name or email to add
 *     responses:
 *       200:
 *         description: Attendee added successfully
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
 *                   example: Attendee added successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     attendees:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Bad request - Attendee name required or already in list
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only creator can add attendees
 *       404:
 *         description: Appointment not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/appointments/removeAttendee/{id}/attendees/{attendee}:
 *   delete:
 *     summary: Remove an attendee from appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *       - in: path
 *         name: attendee
 *         required: true
 *         schema:
 *           type: string
 *         description: Attendee name or email to remove (URL encoded)
 *     responses:
 *       200:
 *         description: Attendee removed successfully
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
 *                   example: Attendee removed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     attendees:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only creator can remove attendees
 *       404:
 *         description: Appointment or attendee not found
 *       500:
 *         description: Server error
 */
