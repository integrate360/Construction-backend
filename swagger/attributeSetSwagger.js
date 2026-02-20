/**
 * @swagger
 * tags:
 *   name: Attribute Sets
 *   description: Attribute Set management APIs (saas_admin = all access, super_admin = own data)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AttributeSet:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 65f2caa1e4a123456789abcd
 *         name:
 *           type: string
 *           example: Flooring Materials
 *         attributes:
 *           type: array
 *           items:
 *             type: string
 *             example: 65f2b1e9c7a1a23b45678901
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
 *     CreateAttributeSetRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: Electrical Materials Set
 *         attributes:
 *           type: array
 *           items:
 *             type: string
 *             example: 65f2b1e9c7a1a23b45678901
 *
 *     UpdateAttributeSetRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Updated Flooring Set
 *         attributes:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/attribute-sets/create:
 *   post:
 *     tags: [Attribute Sets]
 *     summary: Create a new attribute set
 *     description: |
 *       - **saas_admin**: Can create attribute sets for the system  
 *       - **super_admin**: Creates attribute sets owned by them
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAttributeSetRequest'
 *     responses:
 *       201:
 *         description: Attribute set created successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/attribute-sets/getAll:
 *   get:
 *     tags: [Attribute Sets]
 *     summary: Get all attribute sets
 *     description: |
 *       - **saas_admin**: Gets all attribute sets  
 *       - **super_admin**: Gets only attribute sets created by them
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attribute sets list
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/attribute-sets/getById/{id}:
 *   get:
 *     tags: [Attribute Sets]
 *     summary: Get attribute set by ID
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
 *         description: Attribute set details
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Attribute set not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/attribute-sets/update/{id}:
 *   put:
 *     tags: [Attribute Sets]
 *     summary: Update an attribute set
 *     description: |
 *       - **saas_admin**: Can update any attribute set  
 *       - **super_admin**: Can update only their own attribute sets
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
 *             $ref: '#/components/schemas/UpdateAttributeSetRequest'
 *     responses:
 *       200:
 *         description: Attribute set updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Attribute set not found
 */

/**
 * @swagger
 * /api/attribute-sets/delete/{id}:
 *   delete:
 *     tags: [Attribute Sets]
 *     summary: Delete an attribute set
 *     description: |
 *       - **saas_admin**: Can delete any attribute set  
 *       - **super_admin**: Can delete only their own attribute sets
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
 *         description: Attribute set deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Attribute set not found
 */