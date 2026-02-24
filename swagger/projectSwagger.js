/**
 * @swagger
 * tags:
 *   - name: Projects
 *     description: Project management endpoints
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
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           enum: [Point]
 *           default: Point
 *         coordinates:
 *           type: array
 *           items:
 *             type: number
 *           example: [72.8777, 19.0760]
 *           description: [longitude, latitude]
 *
 *     Location:
 *       type: object
 *       properties:
 *         address:
 *           type: string
 *           example: "123 Main Street"
 *         city:
 *           type: string
 *           example: "Mumbai"
 *         state:
 *           type: string
 *           example: "Maharashtra"
 *         pincode:
 *           type: string
 *           example: "400001"
 *         coordinates:
 *           $ref: '#/components/schemas/Coordinates'
 *
 *     Phase:
 *       type: object
 *       properties:
 *         phaseName:
 *           type: string
 *           enum: [FOUNDATION, STRUCTURE, FINISHING, HANDOVER]
 *           example: "FOUNDATION"
 *         completionPercentage:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           default: 0
 *           example: 75
 *         isCompleted:
 *           type: boolean
 *           default: false
 *           example: false
 *
 *     Document:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Blueprint.pdf"
 *         url:
 *           type: string
 *           example: "https://storage.example.com/blueprint.pdf"
 *
 *     ProjectAttribute:
 *       type: object
 *       properties:
 *         attribute:
 *           type: string
 *           description: Attribute ID
 *           example: "507f1f77bcf86cd799439018"
 *         quantity:
 *           type: number
 *           minimum: 1
 *           default: 1
 *           example: 5
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
 *         area:
 *           type: number
 *           minimum: 0
 *           example: 5000
 *           description: Area in square feet/meters
 *         location:
 *           $ref: '#/components/schemas/Location'
 *         client:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             phoneNumber:
 *               type: string
 *         site_manager:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             phoneNumber:
 *               type: string
 *         labour:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *         createdBy:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         AttributeSet:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               name:
 *                 type: string
 *               attributes:
 *                 type: array
 *                 items:
 *                   type: object
 *               setTotal:
 *                 type: number
 *         attributes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               attribute:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   label:
 *                     type: string
 *                   type:
 *                     type: string
 *                   unit:
 *                     type: string
 *                   pricing:
 *                     type: number
 *               quantity:
 *                 type: number
 *         startDate:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *         expectedEndDate:
 *           type: string
 *           format: date
 *           example: "2024-12-31"
 *         extracost:
 *           type: number
 *           minimum: 0
 *           example: 500000
 *         progressPercentage:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           default: 0
 *           example: 45
 *         projectStatus:
 *           type: string
 *           enum: [planning, in_progress, on_hold, completed]
 *           default: planning
 *           example: "in_progress"
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
 *           default: pending
 *           example: "approved"
 *         projectTotal:
 *           type: number
 *           example: 2500000
 *           description: Total from attributes (sets + direct attributes)
 *         finalProjectTotal:
 *           type: number
 *           example: 3000000
 *           description: projectTotal + extracost
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     ProjectStats:
 *       type: object
 *       properties:
 *         totalProjects:
 *           type: number
 *           example: 25
 *         areaStatistics:
 *           type: object
 *           properties:
 *             totalArea:
 *               type: number
 *               example: 125000
 *             averageArea:
 *               type: number
 *               example: 5000
 *             minArea:
 *               type: number
 *               example: 1000
 *             maxArea:
 *               type: number
 *               example: 20000
 *         financialSummary:
 *           type: object
 *           properties:
 *             totalExtracost:
 *               type: number
 *               example: 12500000
 *             totalAttributeValue:
 *               type: number
 *               example: 62500000
 *             totalProjectValue:
 *               type: number
 *               example: 75000000
 *         averageProgress:
 *           type: number
 *           example: 42.5
 *         projectStatusBreakdown:
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
 *         approvalStatusBreakdown:
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
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Error message"
 *
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *         message:
 *           type: string
 *
 *   responses:
 *     UnauthorizedError:
 *       description: Access token is missing or invalid
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             success: false
 *             message: "Unauthorized"
 *
 *     ForbiddenError:
 *       description: User doesn't have required permissions
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             success: false
 *             message: "Only admins and super admins can create projects"
 *
 *     NotFoundError:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Error'
 *           example:
 *             success: false
 *             message: "Project not found"
 *
 * security:
 *   - bearerAuth: []
 */

/**
 * @swagger
 * /projects/createProject:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     description: Creates a new project. Only admins and super admins can create projects.
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
 *               - area
 *             properties:
 *               projectName:
 *                 type: string
 *                 example: "Greenfield Towers"
 *                 description: Name of the project
 *               siteName:
 *                 type: string
 *                 example: "Greenfield Construction Site"
 *                 description: Name of the construction site
 *               area:
 *                 type: number
 *                 minimum: 0
 *                 example: 5000
 *                 description: Area in square feet/meters
 *               location:
 *                 $ref: '#/components/schemas/Location'
 *               client:
 *                 type: string
 *                 description: User ID with role client
 *                 example: "507f1f77bcf86cd799439012"
 *               site_manager:
 *                 type: string
 *                 description: User ID with role site_manager
 *                 example: "507f1f77bcf86cd799439013"
 *               labour:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs with role labour
 *                 example: ["507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015"]
 *               AttributeSet:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of AttributeSet IDs
 *                 example: ["507f1f77bcf86cd799439016", "507f1f77bcf86cd799439017"]
 *               attributes:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ProjectAttribute'
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               expectedEndDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-12-31"
 *               extracost:
 *                 type: number
 *                 minimum: 0
 *                 example: 500000
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
 *             examples:
 *               missingFields:
 *                 value:
 *                   success: false
 *                   message: "Missing required fields: projectName, siteName, startDate, extracost, and area are required"
 *               negativeArea:
 *                 value:
 *                   success: false
 *                   message: "Area cannot be negative"
 *               negativeExtracost:
 *                 value:
 *                   success: false
 *                   message: "extracost cannot be negative"
 *               invalidPhase:
 *                 value:
 *                   success: false
 *                   message: "Invalid phase name. Must be one of: FOUNDATION, STRUCTURE, FINISHING, HANDOVER"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Referenced user or attribute set not found
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
 *     description: Returns a list of projects based on user role and filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: projectStatus
 *         schema:
 *           type: string
 *           enum: [planning, in_progress, on_hold, completed]
 *         description: Filter by project status
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
 *         name: labour
 *         schema:
 *           type: string
 *         description: Filter by labour ID (admin only)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by project name, site name, city, address, state, or pincode
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *           enum: [createdAt, projectName, area, extracost, startDate, progressPercentage]
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
 *         description: Projects retrieved successfully
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
 *         $ref: '#/components/responses/UnauthorizedError'
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
 *     description: Returns detailed project information including calculated totals
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *         example: "507f1f77bcf86cd799439011"
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
 *       400:
 *         description: Invalid project ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to view this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
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
 *     description: Updates project details. Role-based access control applies.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *         example: "507f1f77bcf86cd799439011"
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
 *               area:
 *                 type: number
 *                 minimum: 0
 *                 example: 6000
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
 *                 example: ["507f1f77bcf86cd799439016", "507f1f77bcf86cd799439017"]
 *               attributes:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ProjectAttribute'
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               expectedEndDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-01-31"
 *               extracost:
 *                 type: number
 *                 minimum: 0
 *                 example: 550000
 *               projectStatus:
 *                 type: string
 *                 enum: [planning, in_progress, on_hold, completed]
 *                 example: "in_progress"
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
 *             examples:
 *               dateError:
 *                 value:
 *                   success: false
 *                   message: "Expected end date must be after start date"
 *               negativeValue:
 *                 value:
 *                   success: false
 *                   message: "extracost cannot be negative"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to update this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
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
 *     description: Deletes a project. Only admins can delete projects.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *         example: "507f1f77bcf86cd799439011"
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
 *                   example: "Project deleted successfully"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only admins can delete projects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
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
 *     description: Returns aggregated statistics about projects. Only admins can view statistics.
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
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only admins can view project statistics
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
 * /projects/addProjectAttributes/{id}:
 *   post:
 *     summary: Add attributes to a project
 *     tags: [Projects]
 *     description: Adds new attributes to an existing project. Only admins can add attributes.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - attributes
 *             properties:
 *               attributes:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/ProjectAttribute'
 *     responses:
 *       200:
 *         description: Attributes added successfully
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
 *         description: Bad request - Invalid attributes data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only admins can add attributes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project or attribute not found
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
 * /projects/updateAttributeQuantity/{projectId}/{attributeId}:
 *   put:
 *     summary: Update attribute quantity in a project
 *     tags: [Projects]
 *     description: Updates the quantity of a specific attribute in a project. Only admins can update quantities.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: path
 *         name: attributeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Attribute ID
 *         example: "507f1f77bcf86cd799439018"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 example: 10
 *     responses:
 *       200:
 *         description: Attribute quantity updated successfully
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
 *         description: Bad request - Invalid quantity
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only admins can update attribute quantities
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project or attribute not found
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
 * /projects/removeProjectAttribute/{projectId}/{attributeId}:
 *   delete:
 *     summary: Remove an attribute from a project
 *     tags: [Projects]
 *     description: Removes a specific attribute from a project. Only admins can remove attributes.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *         example: "507f1f77bcf86cd799439011"
 *       - in: path
 *         name: attributeId
 *         required: true
 *         schema:
 *           type: string
 *         description: Attribute ID
 *         example: "507f1f77bcf86cd799439018"
 *     responses:
 *       200:
 *         description: Attribute removed successfully
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
 *                   example: "Attribute removed from project successfully"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only admins can remove attributes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project or attribute not found
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
