const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const getPagination = (query = {}, overrides = {}) => {
  const page = Math.max(
    DEFAULT_PAGE,
    Number.parseInt(query.page, 10) || overrides.defaultPage || DEFAULT_PAGE
  );

  const requestedLimit =
    Number.parseInt(query.limit, 10) || overrides.defaultLimit || DEFAULT_LIMIT;

  const limit = Math.min(Math.max(requestedLimit, 1), overrides.maxLimit || MAX_LIMIT);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const getPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  hasPrevPage: page > 1,
  hasNextPage: page * limit < total,
});

module.exports = {
  getPagination,
  getPaginationMeta,
};
