/**
 * @swagger
 * tags:
 *   name: Attribute Sets
 *   description: Attribute Set management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AttributeSet:
 *       type: object
 *       required:
 *         - name
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
 *
 *     CreateAttributeSetRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: Electrical Set
 *         attributes:
 *           type: array
 *           items:
 *             type: string
 *
 *     UpdateAttributeSetRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
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
 *     summary: Create attribute set
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
 *         description: Attribute set created
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/attribute-sets/getAll:
 *   get:
 *     tags: [Attribute Sets]
 *     summary: Get all attribute sets
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attribute sets list
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
 *       404:
 *         description: Not found
 */

/**
 * @swagger
 * /api/attribute-sets/update/{id}:
 *   put:
 *     tags: [Attribute Sets]
 *     summary: Update attribute set
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
 *         description: Attribute set updated
 */

/**
 * @swagger
 * /api/attribute-sets/delete/{id}:
 *   delete:
 *     tags: [Attribute Sets]
 *     summary: Delete attribute set
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
 *         description: Attribute set deleted
 */
