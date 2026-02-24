/**
 * @swagger
 * tags:
 *   - name: Salary Structure
 *     description: Manage salary configurations for users
 *   - name: Payroll
 *     description: Generate and manage payroll records
 *   - name: Advances
 *     description: Manage salary advances for users
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
 *     // ==================== SALARY STRUCTURE SCHEMAS ====================
 *     SalaryType:
 *       type: string
 *       enum: [daily, monthly, hourly]
 *       description: Type of salary calculation
 * 
 *     UserRole:
 *       type: string
 *       enum: [site_manager, labour]
 *       description: User role in project
 * 
 *     SalaryStructure:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         user:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             role:
 *               type: string
 *             phoneNumber:
 *               type: string
 *             profilePicture:
 *               type: string
 *             adharNumber:
 *               type: string
 *         project:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             projectName:
 *               type: string
 *             siteName:
 *               type: string
 *             location:
 *               type: object
 *             client:
 *               type: object
 *         role:
 *           $ref: '#/components/schemas/UserRole'
 *         salaryType:
 *           $ref: '#/components/schemas/SalaryType'
 *         rateAmount:
 *           type: number
 *           minimum: 0
 *           example: 500
 *           description: Daily/Monthly/Hourly rate amount
 *         overtimeRate:
 *           type: number
 *           minimum: 0
 *           example: 100
 *           description: Extra pay per hour for overtime
 *         effectiveFrom:
 *           type: string
 *           format: date-time
 *         effectiveTo:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         isActive:
 *           type: boolean
 *           default: true
 *         createdBy:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     SalaryStructureInput:
 *       type: object
 *       required:
 *         - user
 *         - project
 *         - role
 *         - salaryType
 *         - rateAmount
 *       properties:
 *         user:
 *           type: string
 *           description: User ID
 *           example: "507f1f77bcf86cd799439012"
 *         project:
 *           type: string
 *           description: Project ID
 *           example: "507f1f77bcf86cd799439013"
 *         role:
 *           $ref: '#/components/schemas/UserRole'
 *         salaryType:
 *           $ref: '#/components/schemas/SalaryType'
 *         rateAmount:
 *           type: number
 *           minimum: 0
 *           example: 500
 *         overtimeRate:
 *           type: number
 *           minimum: 0
 *           example: 100
 *         effectiveFrom:
 *           type: string
 *           format: date-time
 *         effectiveTo:
 *           type: string
 *           format: date-time
 * 
 *     // ==================== PAYROLL SCHEMAS ====================
 *     AllowanceReason:
 *       type: string
 *       enum: [bonus, travel, food, overtime, other]
 * 
 *     DeductionReason:
 *       type: string
 *       enum: [absence, advance_recovery, penalty, other]
 * 
 *     PaymentMode:
 *       type: string
 *       enum: [cash, bank_transfer, upi, cheque]
 * 
 *     PaymentStatus:
 *       type: string
 *       enum: [pending, partially_paid, paid]
 * 
 *     Allowance:
 *       type: object
 *       properties:
 *         reason:
 *           $ref: '#/components/schemas/AllowanceReason'
 *         amount:
 *           type: number
 *           minimum: 0
 *           example: 500
 *         note:
 *           type: string
 *           example: "Performance bonus"
 * 
 *     Deduction:
 *       type: object
 *       properties:
 *         reason:
 *           $ref: '#/components/schemas/DeductionReason'
 *         amount:
 *           type: number
 *           minimum: 0
 *           example: 200
 *         note:
 *           type: string
 *           example: "Absent on 15th Jan"
 * 
 *     Payroll:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/SalaryStructure/properties/user'
 *         project:
 *           $ref: '#/components/schemas/SalaryStructure/properties/project'
 *         salaryStructure:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             salaryType:
 *               type: string
 *             rateAmount:
 *               type: number
 *         role:
 *           $ref: '#/components/schemas/UserRole'
 *         periodStart:
 *           type: string
 *           format: date
 *         periodEnd:
 *           type: string
 *           format: date
 *         totalWorkingDays:
 *           type: number
 *           example: 26
 *         presentDays:
 *           type: number
 *           example: 22
 *         absentDays:
 *           type: number
 *           example: 4
 *         overtimeHours:
 *           type: number
 *           example: 5
 *         basicSalary:
 *           type: number
 *           example: 11000
 *         overtimePay:
 *           type: number
 *           example: 500
 *         allowances:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Allowance'
 *         deductions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Deduction'
 *         totalAllowances:
 *           type: number
 *           example: 1000
 *         totalDeductions:
 *           type: number
 *           example: 500
 *         grossSalary:
 *           type: number
 *           example: 12500
 *         netSalary:
 *           type: number
 *           example: 12000
 *         advancePaid:
 *           type: number
 *           example: 2000
 *         advanceRecovered:
 *           type: number
 *           example: 1000
 *         paymentStatus:
 *           $ref: '#/components/schemas/PaymentStatus'
 *         paymentDate:
 *           type: string
 *           format: date-time
 *         paymentMode:
 *           $ref: '#/components/schemas/PaymentMode'
 *         transactionReference:
 *           type: string
 *         remarks:
 *           type: string
 *         createdBy:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     PayrollInput:
 *       type: object
 *       required:
 *         - user
 *         - project
 *         - periodStart
 *         - periodEnd
 *       properties:
 *         user:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *         project:
 *           type: string
 *           example: "507f1f77bcf86cd799439013"
 *         periodStart:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *         periodEnd:
 *           type: string
 *           format: date
 *           example: "2024-01-31"
 *         allowances:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Allowance'
 *         deductions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Deduction'
 *         overtimeHours:
 *           type: number
 *           example: 5
 *         remarks:
 *           type: string
 * 
 *     BulkPayrollInput:
 *       type: object
 *       required:
 *         - project
 *         - periodStart
 *         - periodEnd
 *       properties:
 *         project:
 *           type: string
 *           example: "507f1f77bcf86cd799439013"
 *         periodStart:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *         periodEnd:
 *           type: string
 *           format: date
 *           example: "2024-01-31"
 *         allowances:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Allowance'
 *         deductions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Deduction'
 * 
 *     MarkAsPaidInput:
 *       type: object
 *       required:
 *         - paymentMode
 *       properties:
 *         paymentMode:
 *           $ref: '#/components/schemas/PaymentMode'
 *         transactionReference:
 *           type: string
 *           example: "UPI123456789"
 *         paymentDate:
 *           type: string
 *           format: date-time
 * 
 *     // ==================== ADVANCE SCHEMAS ====================
 *     RecoveryStatus:
 *       type: string
 *       enum: [pending, partially_recovered, recovered]
 * 
 *     Advance:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/SalaryStructure/properties/user'
 *         project:
 *           $ref: '#/components/schemas/SalaryStructure/properties/project'
 *         amount:
 *           type: number
 *           example: 5000
 *         reason:
 *           type: string
 *           example: "Medical emergency"
 *         givenDate:
 *           type: string
 *           format: date-time
 *         recoveryStatus:
 *           $ref: '#/components/schemas/RecoveryStatus'
 *         amountRecovered:
 *           type: number
 *           example: 2000
 *         createdBy:
 *           type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     AdvanceInput:
 *       type: object
 *       required:
 *         - user
 *         - project
 *         - amount
 *       properties:
 *         user:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *         project:
 *           type: string
 *           example: "507f1f77bcf86cd799439013"
 *         amount:
 *           type: number
 *           minimum: 1
 *           example: 5000
 *         reason:
 *           type: string
 *           example: "Medical emergency"
 *         givenDate:
 *           type: string
 *           format: date-time
 * 
 *     RecoverAdvanceInput:
 *       type: object
 *       required:
 *         - amountToRecover
 *       properties:
 *         amountToRecover:
 *           type: number
 *           minimum: 1
 *           example: 1000
 * 
 *     // ==================== RESPONSE SCHEMAS ====================
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           type: object
 *         count:
 *           type: integer
 *         summary:
 *           type: object
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
 */

/**
 * @swagger
 * /salary/structure:
 *   post:
 *     summary: Create a new salary structure
 *     tags: [Salary Structure]
 *     description: Creates a new salary structure for a user on a project. Deactivates any existing active structures.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SalaryStructureInput'
 *     responses:
 *       201:
 *         description: Salary structure created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SalaryStructure'
 *       400:
 *         description: Bad request - validation error
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
 * 
 *   get:
 *     summary: Get all salary structures
 *     tags: [Salary Structure]
 *     description: Returns a list of salary structures with optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [site_manager, labour]
 *         description: Filter by user role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Salary structures retrieved successfully
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
 *                     $ref: '#/components/schemas/SalaryStructure'
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
 * /salary/structure/active/{userId}/{projectId}:
 *   get:
 *     summary: Get active salary structure for a user on a project
 *     tags: [Salary Structure]
 *     description: Returns the currently active salary structure for a specific user and project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "507f1f77bcf86cd799439012"
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *         example: "507f1f77bcf86cd799439013"
 *     responses:
 *       200:
 *         description: Active salary structure found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SalaryStructure'
 *       404:
 *         description: No active salary structure found
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
 * /salary/structure/{id}:
 *   get:
 *     summary: Get salary structure by ID
 *     tags: [Salary Structure]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Salary structure ID
 *     responses:
 *       200:
 *         description: Salary structure found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SalaryStructure'
 *       404:
 *         description: Salary structure not found
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
 * 
 *   put:
 *     summary: Update salary structure
 *     tags: [Salary Structure]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Salary structure ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SalaryStructureInput'
 *     responses:
 *       200:
 *         description: Salary structure updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SalaryStructure'
 *       404:
 *         description: Salary structure not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Validation error
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
 * 
 *   delete:
 *     summary: Deactivate salary structure (soft delete)
 *     tags: [Salary Structure]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Salary structure ID
 *     responses:
 *       200:
 *         description: Salary structure deactivated successfully
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
 *                   example: "Salary structure deactivated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/SalaryStructure'
 *       404:
 *         description: Salary structure not found
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
 * /salary/payroll:
 *   get:
 *     summary: Get all payrolls
 *     tags: [Payroll]
 *     description: Returns a list of payrolls with optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [site_manager, labour]
 *         description: Filter by user role
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [pending, partially_paid, paid]
 *         description: Filter by payment status
 *       - in: query
 *         name: periodStart
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for period filter (YYYY-MM-DD)
 *       - in: query
 *         name: periodEnd
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for period filter (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Payrolls retrieved successfully
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
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalPayrolls:
 *                       type: integer
 *                     totalNetSalary:
 *                       type: number
 *                     totalGrossSalary:
 *                       type: number
 *                     totalPaid:
 *                       type: integer
 *                     totalPending:
 *                       type: integer
 *                     totalPartiallyPaid:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payroll'
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
 * /salary/payroll/generate:
 *   post:
 *     summary: Generate payroll for a user
 *     tags: [Payroll]
 *     description: Calculates and creates a new payroll record based on attendance and salary structure
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PayrollInput'
 *     responses:
 *       201:
 *         description: Payroll generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Payroll'
 *                 attendance:
 *                   type: array
 *       400:
 *         description: Bad request - payroll already exists or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Salary structure not found
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
 * /salary/payroll/generate-bulk:
 *   post:
 *     summary: Generate payroll for all users in a project
 *     tags: [Payroll]
 *     description: Creates payroll records for all users with active salary structures in a project
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkPayrollInput'
 *     responses:
 *       200:
 *         description: Bulk payroll generation completed
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
 *                   properties:
 *                     success:
 *                       type: array
 *                       items:
 *                         type: object
 *                     failed:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: No salary structures found
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
 * /salary/payroll/summary/{projectId}:
 *   get:
 *     summary: Get payroll summary for a project
 *     tags: [Payroll]
 *     description: Returns aggregated payroll statistics for a specific project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project payroll summary retrieved
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
 *                   properties:
 *                     byStatus:
 *                       type: array
 *                     byUser:
 *                       type: array
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
 * /salary/payroll/{id}:
 *   get:
 *     summary: Get payroll by ID
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payroll ID
 *     responses:
 *       200:
 *         description: Payroll found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Payroll'
 *                 relatedAdvances:
 *                   type: array
 *       404:
 *         description: Payroll not found
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
 * 
 *   put:
 *     summary: Update payroll (only if not paid)
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payroll ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               allowances:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Allowance'
 *               deductions:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Deduction'
 *               overtimeHours:
 *                 type: number
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payroll updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Payroll'
 *       400:
 *         description: Cannot update paid payroll
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Payroll not found
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
 * 
 *   delete:
 *     summary: Delete payroll (only if pending)
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payroll ID
 *     responses:
 *       200:
 *         description: Payroll deleted successfully
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
 *                   example: "Payroll deleted successfully"
 *       400:
 *         description: Only pending payrolls can be deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Payroll not found
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
 * /salary/payroll/{id}/pay:
 *   patch:
 *     summary: Mark payroll as paid
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payroll ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MarkAsPaidInput'
 *     responses:
 *       200:
 *         description: Payroll marked as paid successfully
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
 *                 data:
 *                   $ref: '#/components/schemas/Payroll'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Payroll not found
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
 * /salary/advance:
 *   post:
 *     summary: Give advance to a user
 *     tags: [Advances]
 *     description: Record a salary advance given to a user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdvanceInput'
 *     responses:
 *       201:
 *         description: Advance recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Advance'
 *       400:
 *         description: Bad request
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
 * 
 *   get:
 *     summary: Get all advances
 *     tags: [Advances]
 *     description: Returns a list of advances with optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: recoveryStatus
 *         schema:
 *           type: string
 *           enum: [pending, partially_recovered, recovered]
 *         description: Filter by recovery status
 *     responses:
 *       200:
 *         description: Advances retrieved successfully
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
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalAdvances:
 *                       type: integer
 *                     totalAmount:
 *                       type: number
 *                     totalRecovered:
 *                       type: number
 *                     totalPending:
 *                       type: number
 *                     byStatus:
 *                       type: object
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Advance'
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
 * /salary/advance/summary/{projectId}:
 *   get:
 *     summary: Get advance summary for a project
 *     tags: [Advances]
 *     description: Returns aggregated advance statistics for a specific project
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project advance summary retrieved
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
 *                   properties:
 *                     project:
 *                       type: object
 *                     byStatus:
 *                       type: array
 *                     byUser:
 *                       type: array
 *                     totalAdvances:
 *                       type: integer
 *                     totalAmount:
 *                       type: number
 *                     totalRecovered:
 *                       type: number
 *                     totalPending:
 *                       type: number
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
 * /salary/advance/user/{userId}/{projectId}:
 *   get:
 *     summary: Get advances for a specific user on a project
 *     tags: [Advances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: User advances retrieved
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
 *                     $ref: '#/components/schemas/Advance'
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalGiven:
 *                       type: number
 *                     totalRecovered:
 *                       type: number
 *                     totalPending:
 *                       type: number
 *                     advanceCount:
 *                       type: integer
 *                     fullyRecovered:
 *                       type: integer
 *                     partiallyRecovered:
 *                       type: integer
 *                     pending:
 *                       type: integer
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
 * /salary/advance/{id}:
 *   get:
 *     summary: Get advance by ID
 *     tags: [Advances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Advance ID
 *     responses:
 *       200:
 *         description: Advance found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Advance'
 *                 relatedPayrolls:
 *                   type: array
 *       404:
 *         description: Advance not found
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
 * 
 *   put:
 *     summary: Update advance (only if pending)
 *     tags: [Advances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Advance ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               reason:
 *                 type: string
 *               givenDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Advance updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Advance'
 *       400:
 *         description: Cannot edit recovered advance
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Advance not found
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
 * 
 *   delete:
 *     summary: Delete advance (only if pending)
 *     tags: [Advances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Advance ID
 *     responses:
 *       200:
 *         description: Advance deleted successfully
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
 *                   example: "Advance deleted successfully"
 *       400:
 *         description: Cannot delete recovered advance
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Advance not found
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
 * /salary/advance/{id}/recover:
 *   patch:
 *     summary: Recover amount from an advance
 *     tags: [Advances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Advance ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecoverAdvanceInput'
 *     responses:
 *       200:
 *         description: Advance recovered successfully
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
 *                 data:
 *                   $ref: '#/components/schemas/Advance'
 *       400:
 *         description: Cannot recover more than remaining amount
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Advance not found
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