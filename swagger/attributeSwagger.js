/**
 * @swagger
 * tags:
 *   name: Attributes
 *   description: Material Attribute Management APIs (saas_admin = all access, super_admin = own data)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Attribute:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 65f2b1e9c7a1a23b45678901
 *         label:
 *           type: string
 *           example: UltraTech Cement
 *         type:
 *           type: string
 *           example: cement
 *         pricing:
 *           type: number
 *           example: 450
 *         createdBy:
 *           type: string
 *           example: 65f29abde4a1234567891111
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateAttributeRequest:
 *       type: object
 *       required:
 *         - label
 *         - type
 *       properties:
 *         label:
 *           type: string
 *           example: ACC Cement
 *         type:
 *           type: string
 *           example: cement
 *         pricing:
 *           type: number
 *           example: 420
 *
 *     UpdateAttributeRequest:
 *       type: object
 *       properties:
 *         label:
 *           type: string
 *           example: Updated Cement
 *         type:
 *           type: string
 *           example: cement
 *         pricing:
 *           type: number
 *           example: 480
 */

/**
 * @swagger
 * /api/attribute/createAttribute:
 *   post:
 *     tags: [Attributes]
 *     summary: Create a new attribute
 *     description: |
 *       - **saas_admin**: Can create attribute for the system  
 *       - **super_admin**: Creates attribute owned by them
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAttributeRequest'
 *     responses:
 *       201:
 *         description: Attribute created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/attribute/getAllAttributes:
 *   get:
 *     tags: [Attributes]
 *     summary: Get all attribute
 *     description: |
 *       - **saas_admin**: Gets all attribute  
 *       - **super_admin**: Gets only attribute created by them
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of attribute
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Attribute'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/attribute/getAttributeById/{id}:
 *   get:
 *     tags: [Attributes]
 *     summary: Get attribute by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attribute fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attribute'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Attribute not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/attribute/updateAttribute/{id}:
 *   put:
 *     tags: [Attributes]
 *     summary: Update attribute by ID
 *     description: |
 *       - **saas_admin**: Can update any attribute  
 *       - **super_admin**: Can update only their own attribute
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAttributeRequest'
 *     responses:
 *       200:
 *         description: Attribute updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Attribute not found
 */

/**
 * @swagger
 * /api/attribute/deleteAttribute/{id}:
 *   delete:
 *     tags: [Attributes]
 *     summary: Delete attribute by ID
 *     description: |
 *       - **saas_admin**: Can delete any attribute  
 *       - **super_admin**: Can delete only their own attribute
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attribute deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Attribute not found
 */