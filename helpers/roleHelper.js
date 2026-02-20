const isGlobalAdmin = (role) => role === "saas_admin";
const isAdmin = (role) => ["saas_admin", "super_admin"].includes(role);

const buildRoleFilter = (user = {}) => {
  if (!user || !user.role) {
    return { _id: null }; // safety fallback
  }

  // saas_admin sees ALL projects
  if (isGlobalAdmin(user.role)) return {};

  // super_admin sees only projects THEY created
  if (user.role === "super_admin") {
    return { createdBy: user._id };
  }

  // site_manager sees only projects assigned to them
  if (user.role === "site_manager") {
    return { site_manager: user._id };
  }

  // client sees only their own projects
  if (user.role === "client") {
    return { client: user._id };
  }

  // labour sees projects managed by their associated site_manager
  if (user.role === "labour") {
    return { site_manager: user.associatedWithUser };
  }

  // No access by default
  return { _id: null };
};

const canAccessProject = (user, project) => {
  if (isGlobalAdmin(user.role)) return true;

  if (user.role === "super_admin") {
    const createdBy = project.createdBy?._id ?? project.createdBy;
    return createdBy?.toString() === user._id.toString();
  }

  if (user.role === "site_manager") {
    const pm = project.site_manager?._id ?? project.site_manager;
    return pm?.toString() === user._id.toString();
  }

  if (user.role === "client") {
    const client = project.client?._id ?? project.client;
    return client?.toString() === user._id.toString();
  }

  if (user.role === "labour") {
    const pm = project.site_manager?._id ?? project.site_manager;
    return pm?.toString() === user.associatedWithUser?.toString();
  }

  return false;
};

export { isGlobalAdmin, isAdmin, buildRoleFilter, canAccessProject };
