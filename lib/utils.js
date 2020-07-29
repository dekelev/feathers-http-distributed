// Removes all leading and trailing slashes from a path
exports.stripSlashes = function stripSlashes (name) {
  return name.replace(/^(\/*)|(\/*)$/g, '');
};
