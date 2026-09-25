/**
 * Middleware to restrict access based on user role
 * @param  {...string} roles Allowed roles: 'patient', 'caregiver', 'healthworker', 'admin'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user?.role || 'unauthenticated'}) is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = { authorize };
