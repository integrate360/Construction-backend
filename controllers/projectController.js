const Project = require('../models/Project');

// @desc  Get dashboard summary | GET /api/projects/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const projects = await Project.find({ status: { $ne: 'cancelled' } })
      .populate('client', 'name')
      .select('projectName client totalBudget completionPercentage currentPhase startDate endDate status phases');

    const totalProjects = projects.length;
    const overallCompletion = totalProjects > 0
      ? Math.round(projects.reduce((s, p) => s + p.completionPercentage, 0) / totalProjects)
      : 0;

    res.json({
      success: true,
      data: {
        totalProjects,
        overallCompletion,
        projects: projects.map(p => ({
          id: p._id,
          projectName: p.projectName,
          client: p.client,
          totalBudget: p.totalBudget,
          completionPercentage: p.completionPercentage,
          currentPhase: p.currentPhase,
          startDate: p.startDate,
          endDate: p.endDate,
          status: p.status,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all projects | GET /api/projects
exports.getAll = async (req, res) => {
  try {
    const { status, client } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (client) filter.client = client;

    const projects = await Project.find(filter)
      .populate('client', 'name email phone')
      .populate('siteManagers', 'name email')
      .sort('-createdAt');
    res.json({ success: true, count: projects.length, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single project | GET /api/projects/:id
exports.getOne = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name email phone')
      .populate('siteManagers', 'name email role')
      .populate('createdBy', 'name');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create project | POST /api/projects
exports.create = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;
    // Initialize 4 default phases
    req.body.phases = [
      { phaseNumber: 1, phaseName: 'FOUNDATION' },
      { phaseNumber: 2, phaseName: 'STRUCTURE' },
      { phaseNumber: 3, phaseName: 'FINISHING' },
      { phaseNumber: 4, phaseName: 'HANDOVER' },
    ];
    const project = await Project.create(req.body);
    res.status(201).json({ success: true, data: project });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Update project | PUT /api/projects/:id
exports.update = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Update phase | PUT /api/projects/:id/phases/:phaseNumber
exports.updatePhase = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const phaseIndex = project.phases.findIndex(p => p.phaseNumber === parseInt(req.params.phaseNumber));
    if (phaseIndex === -1) return res.status(404).json({ success: false, message: 'Phase not found' });

    Object.assign(project.phases[phaseIndex], req.body);
    // Recalculate overall completion
    const total = project.phases.reduce((s, p) => s + p.completionPercentage, 0);
    project.completionPercentage = Math.round(total / project.phases.length);

    await project.save();
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Delete project | DELETE /api/projects/:id
exports.remove = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
