const Project = require('../models/Project');
const Task = require('../models/Task');
const escapeRegex = require('../utils/escapeRegex');
const { getPagination, getPaginationMeta } = require('../utils/pagination');

const taskPopulate = [
  { path: 'assignedTo', select: 'name email role' },
  { path: 'project', select: 'name' },
  { path: 'createdBy', select: 'name email role' },
];

const isMemberOfProject = (project, userId) =>
  project.members.some((memberId) => String(memberId) === String(userId));

const loadTaskById = (taskId) => Task.findById(taskId).populate(taskPopulate).lean();

const getTasks = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query, { defaultLimit: 10 });
    const { projectId, status, assignedTo, search } = req.query;
    const filter = {};

    if (projectId) {
      filter.project = projectId;
    }

    if (status) {
      filter.status = status;
    }

    if (search?.trim()) {
      filter.title = { $regex: escapeRegex(search.trim()), $options: 'i' };
    }

    if (req.user.role === 'Admin') {
      if (assignedTo) {
        filter.assignedTo = assignedTo;
      }
    } else {
      filter.assignedTo = req.user._id;
    }

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate(taskPopulate)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.countDocuments(filter),
    ]);

    return res.json({
      tasks,
      meta: getPaginationMeta(total, page, limit),
    });
  } catch (error) {
    return next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const filter = req.user.role === 'Member' ? { assignedTo: req.user._id } : {};
    const now = new Date();

    const [statusCounts, overdue, recentTasks] = await Promise.all([
      Task.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.countDocuments({
        ...filter,
        status: { $ne: 'Completed' },
        dueDate: { $lt: now, $ne: null },
      }),
      Task.find(filter)
        .populate(taskPopulate)
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const counts = statusCounts.reduce(
      (accumulator, item) => ({
        ...accumulator,
        [item._id]: item.count,
      }),
      {}
    );

    const completed = counts.Completed || 0;
    const pending = counts.Pending || 0;
    const inProgress = counts['In Progress'] || 0;

    return res.json({
      stats: {
        total: completed + pending + inProgress,
        completed,
        pending,
        inProgress,
        overdue,
      },
      recentTasks,
    });
  } catch (error) {
    return next(error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const task = await loadTaskById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    if (
      req.user.role === 'Member' &&
      String(task.assignedTo?._id || task.assignedTo) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    return res.json({ task });
  } catch (error) {
    return next(error);
  }
};

const createTask = async (req, res, next) => {
  const { title, description = '', assignedTo, projectId, status = 'Pending', dueDate } = req.body;

  try {
    const project = await Project.findById(projectId).select('members');

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (assignedTo && !isMemberOfProject(project, assignedTo)) {
      return res.status(400).json({
        message: 'Assigned user must be a member of the selected project.',
      });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo: assignedTo || null,
      project: projectId,
      status,
      dueDate: dueDate || null,
      createdBy: req.user._id,
    });

    const populatedTask = await loadTaskById(task._id);

    return res.status(201).json({
      message: 'Task created.',
      task: populatedTask,
    });
  } catch (error) {
    return next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    if (req.user.role === 'Member') {
      const submittedFields = Object.keys(req.body);
      const invalidFields = submittedFields.filter((field) => field !== 'status');

      if (invalidFields.length > 0) {
        return res.status(403).json({ message: 'Members can only update task status.' });
      }

      if (String(task.assignedTo) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Access denied.' });
      }

      task.status = req.body.status;
    } else {
      const { title, description, assignedTo, status, dueDate, projectId } = req.body;

      const targetProjectId = projectId || String(task.project);
      let targetProject = null;

      if (projectId || assignedTo !== undefined) {
        targetProject = await Project.findById(targetProjectId).select('members');

        if (!targetProject) {
          return res.status(404).json({ message: 'Project not found.' });
        }
      }

      if (title !== undefined) {
        task.title = title;
      }

      if (description !== undefined) {
        task.description = description;
      }

      if (projectId) {
        task.project = projectId;
      }

      if (assignedTo !== undefined) {
        if (assignedTo && !isMemberOfProject(targetProject, assignedTo)) {
          return res.status(400).json({
            message: 'Assigned user must be a member of the selected project.',
          });
        }

        task.assignedTo = assignedTo || null;
      } else if (projectId && task.assignedTo && !isMemberOfProject(targetProject, task.assignedTo)) {
        task.assignedTo = null;
      }

      if (status !== undefined) {
        task.status = status;
      }

      if (dueDate !== undefined) {
        task.dueDate = dueDate || null;
      }
    }

    await task.save();

    const populatedTask = await loadTaskById(task._id);

    return res.json({
      message: 'Task updated.',
      task: populatedTask,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    return res.json({ message: 'Task deleted.' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getTasks,
  getDashboardStats,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
