const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const escapeRegex = require('../utils/escapeRegex');
const { getPagination, getPaginationMeta } = require('../utils/pagination');

const projectPopulate = [
  { path: 'createdBy', select: 'name email role' },
  { path: 'members', select: 'name email role' },
];

const isProjectMember = (project, userId) =>
  project.members.some((member) => String(member._id || member) === String(userId));

const loadProjectById = (projectId) =>
  Project.findById(projectId).populate(projectPopulate).lean();

const getProjects = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query, { defaultLimit: 8 });
    const search = req.query.search?.trim();
    const filter = req.user.role === 'Admin' ? {} : { members: req.user._id };

    if (search) {
      filter.name = { $regex: escapeRegex(search), $options: 'i' };
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate(projectPopulate)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(filter),
    ]);

    return res.json({
      projects,
      meta: getPaginationMeta(total, page, limit),
    });
  } catch (error) {
    return next(error);
  }
};

const getProjectById = async (req, res, next) => {
  try {
    const project = await loadProjectById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (req.user.role !== 'Admin' && !isProjectMember(project, req.user._id)) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    return res.json({ project });
  } catch (error) {
    return next(error);
  }
};

const createProject = async (req, res, next) => {
  const { name, description = '', memberIds = [] } = req.body;

  try {
    const normalizedMemberIds = [...new Set(memberIds.map(String))];
    const allMemberIds = [...new Set([...normalizedMemberIds, String(req.user._id)])];
    const members = await User.find({ _id: { $in: allMemberIds } }).select('_id').lean();

    if (members.length !== allMemberIds.length) {
      return res.status(400).json({ message: 'One or more member ids are invalid.' });
    }

    const project = await Project.create({
      name,
      description,
      createdBy: req.user._id,
      members: allMemberIds,
    });

    const populatedProject = await loadProjectById(project._id);

    return res.status(201).json({
      message: 'Project created.',
      project: populatedProject,
    });
  } catch (error) {
    return next(error);
  }
};

const updateProject = async (req, res, next) => {
  const { name, description } = req.body;

  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    project.name = name;

    if (description !== undefined) {
      project.description = description;
    }

    await project.save();

    const populatedProject = await loadProjectById(project._id);

    return res.json({
      message: 'Project updated.',
      project: populatedProject,
    });
  } catch (error) {
    return next(error);
  }
};

const addMember = async (req, res, next) => {
  const { userId } = req.body;

  try {
    const [project, userExists] = await Promise.all([
      Project.findById(req.params.id),
      User.exists({ _id: userId }),
    ]);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (!userExists) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (project.members.some((memberId) => memberId.equals(userId))) {
      return res.status(409).json({ message: 'User is already a member.' });
    }

    project.members.push(userId);
    await project.save();

    const populatedProject = await loadProjectById(project._id);

    return res.json({
      message: 'Member added.',
      project: populatedProject,
    });
  } catch (error) {
    return next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (project.createdBy.equals(req.params.userId)) {
      return res.status(400).json({ message: 'Project creator cannot be removed.' });
    }

    const isMember = project.members.some((memberId) => memberId.equals(req.params.userId));

    if (!isMember) {
      return res.status(404).json({ message: 'User is not a member of this project.' });
    }

    project.members = project.members.filter((memberId) => !memberId.equals(req.params.userId));

    await Promise.all([
      project.save(),
      Task.updateMany(
        { project: project._id, assignedTo: req.params.userId },
        { $set: { assignedTo: null } }
      ),
    ]);

    const populatedProject = await loadProjectById(project._id);

    return res.json({
      message: 'Member removed and project tasks unassigned.',
      project: populatedProject,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const deletedTasks = await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    return res.json({
      message: 'Project deleted.',
      deletedTasks: deletedTasks.deletedCount,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  addMember,
  removeMember,
  deleteProject,
};
