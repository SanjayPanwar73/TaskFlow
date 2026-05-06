const User = require('../models/User');
const escapeRegex = require('../utils/escapeRegex');
const { getPagination, getPaginationMeta } = require('../utils/pagination');

const listUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query, { defaultLimit: 50 });
    const search = req.query.search?.trim();

    const filter = search
      ? {
          $or: [
            { name: { $regex: escapeRegex(search), $options: 'i' } },
            { email: { $regex: escapeRegex(search), $options: 'i' } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email role createdAt updatedAt')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.json({
      users,
      meta: getPaginationMeta(total, page, limit),
    });
  } catch (error) {
    return next(error);
  }
};

const getProfile = async (req, res) => res.json({ user: req.user });

module.exports = {
  listUsers,
  getProfile,
};
