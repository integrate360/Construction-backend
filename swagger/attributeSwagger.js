/**
 * @swagger
 * tags:
 *   name: Attributes
 *   description: Material Attribute Management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Attribute:
 *       type: object
 *       required:
 *         - label
 *         - type
 *       properties:
 *         _id:
 *           type: string
 *           example: 65f2b1e9c7a1a23b45678901
 *         label:
 *           type: string
 *           example: UltraTech Cement
 *         type:
 *           type: string
 *           enum:
 *             - cement
 *             - sand
 *             - aggregate
 *             - steel
 *             - brick
 *             - block
 *             - concrete
 *             - wood
 *             - plywood
 *             - tiles
 *             - marble
 *             - granite
 *             - paint
 *             - electrical
 *             - plumbing
 *             - sanitary
 *             - glass
 *             - aluminium
 *             - hardware
 *             - chemicals
 *             - waterproofing
 *             - adhesive
 *             - flooring
 *             - roofing
 *             - false_ceiling
 *             - fixtures
 *             - tools
 *             - miscellaneous
 *         pricing:
 *           type: number
 *           example: 450
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
 * /api/attributes/createAttribute:
 *   post:
 *     tags: [Attributes]
 *     summary: Create new attribute
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
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/attributes/getAllAttributes:
 *   get:
 *     tags: [Attributes]
 *     summary: Get all attributes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of attributes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Attribute'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/attributes/getAttributeById/{id}:
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
 *       404:
 *         description: Attribute not found
 */

/**
 * @swagger
 * /api/attributes/updateAttribute/{id}:
 *   put:
 *     tags: [Attributes]
 *     summary: Update attribute by ID
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
 *       404:
 *         description: Attribute not found
 */

/**
 * @swagger
 * /api/attributes/deleteAttribute/{id}:
 *   delete:
 *     tags: [Attributes]
 *     summary: Delete attribute by ID
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
 *       404:
 *         description: Attribute not found
 */
