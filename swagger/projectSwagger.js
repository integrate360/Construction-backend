/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Something went wrong
 *
 *     Location:
 *       type: object
 *       properties:
 *         address:
 *           type: string
 *           example: "123 Main St"
 *         city:
 *           type: string
 *           example: "Mumbai"
 *         state:
 *           type: string
 *           example: "Maharashtra"
 *         pincode:
 *           type: string
 *           example: "400001"
 *
 *     Phase:
 *       type: object
 *       required:
 *         - phaseName
 *       properties:
 *         phaseName:
 *           type: string
 *           enum: [FOUNDATION, STRUCTURE, FINISHING, HANDOVER]
 *           example: "FOUNDATION"
 *         completionPercentage:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 75
 *         isCompleted:
 *           type: boolean
 *           example: false
 *
 *     Document:
 *       type: object
 *       required:
 *         - name
 *         - url
 *       properties:
 *         name:
 *           type: string
 *           example: "Blueprint.pdf"
 *         url:
 *           type: string
 *           example: "https://storage.example.com/blueprint.pdf"
 *
 *     Project:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         projectName:
 *           type: string
 *           example: "Greenfield Towers"
 *         siteName:
 *           type: string
 *           example: "Greenfield Construction Site"
 *         location:
 *           $ref: '#/components/schemas/Location'
 *         client:
 *           type: string
 *           description: User ID with role client
 *           example: "507f1f77bcf86cd799439012"
 *         site_manager:
 *           type: string
 *           description: User ID with role site_manager
 *           example: "507f1f77bcf86cd799439013"
 *         labour:
 *           type: array
 *           items:
 *             type: string
 *           example: ["507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015"]
 *         createdBy:
 *           type: string
 *           example: "507f1f77bcf86cd799439016"
 *         AttributeSet:
 *           type: array
 *           items:
 *             type: string
 *           example: ["507f1f77bcf86cd799439017", "507f1f77bcf86cd799439018"]
 *         startDate:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *         expectedEndDate:
 *           type: string
 *           format: date
 *           example: "2024-12-31"
 *         budget:
 *           type: number
 *           example: 5000000
 *         progressPercentage:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           example: 45
 *         siteStatus:
 *           type: string
 *           enum: [planning, in_progress, on_hold, completed]
 *           example: "in_progress"
 *         projectStatus:
 *           type: string
 *           enum: [not_started, running, completed]
 *           example: "running"
 *         phases:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Phase'
 *         documents:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Document'
 *         approvalStatus:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           example: "approved"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T14:30:00Z"
 *
 *     ProjectStats:
 *       type: object
 *       properties:
 *         totalProjects:
 *           type: number
 *           example: 25
 *         totalBudget:
 *           type: number
 *           example: 125000000
 *         averageProgress:
 *           type: number
 *           example: 42.5
 *         siteStatusBreakdown:
 *           type: object
 *           properties:
 *             planning:
 *               type: number
 *               example: 5
 *             in_progress:
 *               type: number
 *               example: 15
 *             on_hold:
 *               type: number
 *               example: 3
 *             completed:
 *               type: number
 *               example: 2
 *         approvalBreakdown:
 *           type: object
 *           properties:
 *             pending:
 *               type: number
 *               example: 4
 *             approved:
 *               type: number
 *               example: 20
 *             rejected:
 *               type: number
 *               example: 1
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /projects/createProject:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectName
 *               - siteName
 *               - startDate
 *               - budget
 *               - AttributeSet
 *             properties:
 *               projectName:
 *                 type: string
 *                 example: "Greenfield Towers"
 *               siteName:
 *                 type: string
 *                 example: "Greenfield Construction Site"
 *               location:
 *                 $ref: '#/components/schemas/Location'
 *               client:
 *                 type: string
 *                 description: User ID with role client
 *                 example: "507f1f77bcf86cd799439012"
 *               labour:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["507f1f77bcf86cd799439014"]
 *               site_manager:
 *                 type: string
 *                 description: User ID with role site_manager
 *                 example: "507f1f77bcf86cd799439013"
 *               AttributeSet:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["507f1f77bcf86cd799439017"]
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               expectedEndDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-31"
 *               budget:
 *                 type: number
 *                 example: 5000000
 *               phases:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Phase'
 *               documents:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Document'
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Bad request - Missing required fields or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Only admins can create projects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Client or AttributeSet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /projects/getProjects:
 *   get:
 *     summary: Get all projects with pagination and filters
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: siteStatus
 *         schema:
 *           type: string
 *           enum: [planning, in_progress, on_hold, completed]
 *         description: Filter by site status
 *       - in: query
 *         name: approvalStatus
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by approval status
 *       - in: query
 *         name: client
 *         schema:
 *           type: string
 *         description: Filter by client ID (admin only)
 *       - in: query
 *         name: site_manager
 *         schema:
 *           type: string
 *         description: Filter by site manager ID (admin only)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by project name, site name, city, or address
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *           enum: [createdAt, projectName, budget, startDate, progressPercentage]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           default: desc
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of projects retrieved successfully
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
 *                     $ref: '#/components/schemas/Project'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     pages:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /projects/getProjectById/{id}:
 *   get:
 *     summary: Get a project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Not authorized to view this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /projects/updateProject/{id}:
 *   put:
 *     summary: Update a project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectName:
 *                 type: string
 *                 example: "Updated Greenfield Towers"
 *               siteName:
 *                 type: string
 *                 example: "Updated Construction Site"
 *               location:
 *                 $ref: '#/components/schemas/Location'
 *               client:
 *                 type: string
 *                 description: User ID with role client (admin only)
 *                 example: "507f1f77bcf86cd799439012"
 *               site_manager:
 *                 type: string
 *                 description: User ID with role site_manager (admin only)
 *                 example: "507f1f77bcf86cd799439013"
 *               labour:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs with role labour (admin only)
 *                 example: ["507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015"]
 *               AttributeSet:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Attribute set IDs (admin only)
 *                 example: ["507f1f77bcf86cd799439017"]
 *               expectedEndDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-31"
 *               budget:
 *                 type: number
 *                 example: 5500000
 *               progressPercentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 60
 *               siteStatus:
 *                 type: string
 *                 enum: [planning, in_progress, on_hold, completed]
 *                 example: "in_progress"
 *               projectStatus:
 *                 type: string
 *                 enum: [not_started, running, completed]
 *                 example: "running"
 *               phases:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Phase'
 *               documents:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Document'
 *               approvalStatus:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *                 example: "approved"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Bad request - Invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Not authorized to update this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project or referenced user/attribute set not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /projects/deleteProject/{id}:
 *   delete:
 *     summary: Delete a project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
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
 *                   example: Project deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Only admins can delete projects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /projects/getProjectStats/stats:
 *   get:
 *     summary: Get project statistics
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ProjectStats'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Only admins can view project statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
