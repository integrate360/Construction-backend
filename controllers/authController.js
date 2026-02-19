import User from "../models/User.js";

export const registerUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phoneNumber,
      address,
      gstNumber,
      panNumber,
      adharNumber,
      profilePicture,
    } = req.body;

    // Validation
    if (!name || !email || !password || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, password and phone number",
      });
    }

    // Email validation
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Phone number validation
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit phone number",
      });
    }

    // PAN Number validation (if provided)
    if (panNumber) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(panNumber)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid PAN number (e.g., ABCDE1234F)",
        });
      }
    }

    // Aadhar Number validation (if provided)
    if (adharNumber) {
      const adharRegex = /^\d{12}$/;
      if (!adharRegex.test(adharNumber)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid 12-digit Aadhar number",
        });
      }

      // Check if Aadhar is already registered
      const existingAadhar = await User.findOne({ adharNumber });
      if (existingAadhar) {
        return res.status(400).json({
          success: false,
          message: "User with this Aadhar number already exists",
        });
      }
    }

    // GST Number validation (if provided)
    if (gstNumber) {
      const gstRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gstNumber)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid GST number (e.g., 22AAAAA0000A1Z5)",
        });
      }

      // Check if GST is already registered
      const existingGST = await User.findOne({ gstNumber });
      if (existingGST) {
        return res.status(400).json({
          success: false,
          message: "User with this GST number already exists",
        });
      }
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if user exists by email or phone
    const userExists = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });

    if (userExists) {
      if (userExists.email === email) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }
      if (userExists.phoneNumber === phoneNumber) {
        return res.status(400).json({
          success: false,
          message: "User with this phone number already exists",
        });
      }
    }

    // Role-based permissions for who can create what
    const creatorRole = req.user.role;
    const newUserRole = role || "labour";

    // Define permission matrix
    const permissions = {
      saas_admin: {
        canCreate: ["super_admin"], // SaaS Admin can only create Super Admin
        associatedWith: null, // SaaS Admin doesn't need association
      },
      super_admin: {
        canCreate: ["site_manager", "client", "labour"], // Super Admin can create all other roles
        associatedWith: req.user.id, // All created users are associated with this Super Admin
      },
      site_manager: {
        canCreate: [], // Cannot create any users
        associatedWith: null,
      },
      client: {
        canCreate: [], // Cannot create any users
        associatedWith: null,
      },
      labour: {
        canCreate: [], // Cannot create any users
        associatedWith: null,
      },
    };

    // Check if creator has permission to create the new user role
    if (!permissions[creatorRole]?.canCreate.includes(newUserRole)) {
      return res.status(403).json({
        success: false,
        message: `You don't have permission to create a user with role: ${newUserRole}. ${
          creatorRole === "saas_admin"
            ? "SaaS Admin can only create Super Admin."
            : creatorRole === "super_admin"
              ? "Super Admin can create Site Manager, Client, and Labour."
              : "Your role does not have permission to create users."
        }`,
      });
    }

    // Prepare user data with all fields
    const userData = {
      name,
      email,
      password,
      phoneNumber,
      role: newUserRole,
    };

    // Add optional fields only if provided
    if (address) userData.address = address;
    if (gstNumber) userData.gstNumber = gstNumber;
    if (panNumber) userData.panNumber = panNumber;
    if (adharNumber) userData.adharNumber = adharNumber;
    if (profilePicture) userData.profilePicture = profilePicture;

    // Set associatedWithUser based on creator role
    if (creatorRole === "super_admin") {
      // Super Admin creates users, so associate them with this Super Admin
      userData.associatedWithUser = req.user.id;
    }
    // For saas_admin creating super_admin, no association needed

    // Create the user
    const user = await User.create(userData);

    const token = user.getSignedJwtToken();

    // Remove password from response
    user.password = undefined;

    // Populate the associated user details if exists
    if (user.associatedWithUser) {
      await user.populate("associatedWithUser", "name email role");
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `User with this ${field} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Please contact admin.",
      });
    }

    const token = user.getSignedJwtToken();

    // Remove password from response
    user.password = undefined;

    res.json({
      success: true,
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
};

export const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch profile",
    });
  }
};

export const updateMyProfile = async (req, res, next) => {
  try {
    const { name, phoneNumber, profilePicture, address, gstNumber, panNumber, adharNumber } = req.body;

    // Validate fields to update
    if (!name && !phoneNumber && !profilePicture && !address && !gstNumber && !panNumber && !adharNumber) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field to update",
      });
    }

    // Validate phone number if provided
    if (phoneNumber) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid 10-digit phone number",
        });
      }

      // Check if phone number is already taken by another user
      const existingUser = await User.findOne({
        phoneNumber,
        _id: { $ne: req.user.id },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Phone number is already in use",
        });
      }
    }

    // Validate PAN if provided
    if (panNumber) {
      if (!validatePAN(panNumber)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid PAN number (e.g., ABCDE1234F)",
        });
      }

      // Check if PAN is already taken by another user
      const existingUser = await User.findOne({
        panNumber,
        _id: { $ne: req.user.id },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "PAN number is already in use",
        });
      }
    }

    // Validate Aadhar if provided
    if (adharNumber) {
      if (!validateAadhar(adharNumber)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid 12-digit Aadhar number",
        });
      }

      // Check if Aadhar is already taken by another user
      const existingUser = await User.findOne({
        adharNumber,
        _id: { $ne: req.user.id },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Aadhar number is already in use",
        });
      }
    }

    // Validate GST number if provided
    if (gstNumber) {
      if (!validateGST(gstNumber)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid GST number",
        });
      }

      // Check if GST is already taken by another user
      const existingUser = await User.findOne({
        gstNumber,
        _id: { $ne: req.user.id },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "GST number is already in use",
        });
      }
    }

    const updates = {};
    if (name) updates.name = name;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (profilePicture) updates.profilePicture = profilePicture;
    if (address) updates.address = address;
    if (gstNumber) updates.gstNumber = gstNumber;
    if (panNumber) updates.panNumber = panNumber;
    if (adharNumber) updates.adharNumber = adharNumber;

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} is already in use`,
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || "Profile update failed",
    });
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current password and new password",
      });
    }

    // New password validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordMatch = await user.matchPassword(currentPassword);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Password change failed",
    });
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const {
      role,
      isActive,
      search,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    // Apply data access rules based on user role
    const currentUserRole = req.user.role;
    const currentUserId = req.user.id;

    if (currentUserRole === "saas_admin") {
      // SaaS Admin can see all users
      // No additional filters needed
    } else if (currentUserRole === "super_admin") {
      // Super Admin can see:
      // 1. All users associated with them
      // 2. All labour, client, site_manager users (since they manage everything)
      // This gives them full visibility of all users under their organization
      filter.$or = [
        { associatedWithUser: currentUserId },
        { role: { $in: ["labour", "client", "site_manager"] } },
      ];
    } else {
      // Other roles (site_manager, client, labour) can only see users associated with them
      // And only if they have permission (labour might not need to see any users)
      if (currentUserRole === "site_manager" || currentUserRole === "client") {
        filter.associatedWithUser = currentUserId;
      } else {
        // Labour role - maybe they don't need to see any users
        // Or they can only see themselves
        filter._id = currentUserId;
      }
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { gstNumber: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute queries with population
    const users = await User.find(filter)
      .select("-password")
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate("associatedWithUser", "name email role");

    const totalUsers = await User.countDocuments(filter);

    const totalPages = Math.ceil(totalUsers / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalUsers,
          limit: limitNum,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? pageNum + 1 : null,
          prevPage: hasPrevPage ? pageNum - 1 : null,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch users",
    });
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("associatedWithUser", "name email role phoneNumber");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if the requesting user has permission to view this user
    const currentUserRole = req.user.role;
    const currentUserId = req.user.id;

    let hasPermission = false;

    if (currentUserRole === 'saas_admin') {
      // SaaS Admin can view any user
      hasPermission = true;
    } 
    else if (currentUserRole === 'super_admin') {
      // Super Admin can view:
      // 1. Any user associated with them
      // 2. Any labour, client, site_manager (since they manage everything)
      if (user.associatedWithUser?._id.toString() === currentUserId ||
          ['labour', 'client', 'site_manager'].includes(user.role)) {
        hasPermission = true;
      }
    }
    else if (currentUserRole === 'site_manager' || currentUserRole === 'client') {
      // Site Manager and Client can only view users associated with them
      if (user.associatedWithUser?._id.toString() === currentUserId) {
        hasPermission = true;
      }
    }
    else if (currentUserRole === 'labour') {
      // Labour can only view themselves
      if (user._id.toString() === currentUserId) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this user",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user",
    });
  }
};

export const updateUserByAdmin = async (req, res, next) => {
  try {
    const { 
      name, 
      email, 
      role, 
      phoneNumber, 
      isActive, 
      address, 
      gstNumber,
      panNumber,
      adharNumber,
      profilePicture 
    } = req.body;

    // Validate at least one field is provided
    if (
      !name &&
      !email &&
      !role &&
      !phoneNumber &&
      isActive === undefined &&
      !address &&
      !gstNumber &&
      !panNumber &&
      !adharNumber &&
      !profilePicture
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field to update",
      });
    }

    // Get the user being updated to check current role
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Role-based permission check for role updates
    if (role && role !== targetUser.role) {
      const adminRole = req.user.role;
      
      // Define who can change roles to what
      const roleChangePermissions = {
        saas_admin: {
          canChangeRoleOf: ["super_admin"], // SaaS Admin can only change Super Admin roles
          canAssignRoles: ["super_admin"] // Can only assign Super Admin role
        },
        super_admin: {
          canChangeRoleOf: ["site_manager", "client", "labour"], // Super Admin can change these roles
          canAssignRoles: ["site_manager", "client", "labour"] // Can assign these roles
        },
        site_manager: {
          canChangeRoleOf: [], // Cannot change any roles
          canAssignRoles: []
        },
        client: {
          canChangeRoleOf: [], // Cannot change any roles
          canAssignRoles: []
        },
        labour: {
          canChangeRoleOf: [], // Cannot change any roles
          canAssignRoles: []
        }
      };

      // Check if admin has permission to change this user's role
      if (!roleChangePermissions[adminRole]?.canChangeRoleOf.includes(targetUser.role)) {
        return res.status(403).json({
          success: false,
          message: `You don't have permission to change the role of a ${targetUser.role}`,
        });
      }

      // Check if admin can assign the new role
      if (!roleChangePermissions[adminRole]?.canAssignRoles.includes(role)) {
        return res.status(403).json({
          success: false,
          message: `You don't have permission to assign the role: ${role}`,
        });
      }

      // Prevent changing own role
      if (req.params.id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: "You cannot change your own role",
        });
      }
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
        });
      }

      // Check if email is already taken
      const existingUser = await User.findOne({
        email,
        _id: { $ne: req.params.id },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email is already in use",
        });
      }
    }

    // Validate phone number if provided
    if (phoneNumber) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid 10-digit phone number",
        });
      }

      // Check if phone number is already taken
      const existingUser = await User.findOne({
        phoneNumber,
        _id: { $ne: req.params.id },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Phone number is already in use",
        });
      }
    }

    // Validate PAN if provided
    if (panNumber) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(panNumber)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid PAN number (e.g., ABCDE1234F)",
        });
      }

      // Check if PAN is already taken by another user
      const existingUser = await User.findOne({
        panNumber,
        _id: { $ne: req.params.id },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "PAN number is already in use",
        });
      }
    }

    // Validate Aadhar if provided
    if (adharNumber) {
      const adharRegex = /^\d{12}$/;
      if (!adharRegex.test(adharNumber)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid 12-digit Aadhar number",
        });
      }

      // Check if Aadhar is already taken by another user
      const existingUser = await User.findOne({
        adharNumber,
        _id: { $ne: req.params.id },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Aadhar number is already in use",
        });
      }
    }

    // Validate GST number if provided
    if (gstNumber) {
      const gstRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gstNumber)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid GST number (e.g., 22AAAAA0000A1Z5)",
        });
      }

      // Check if GST is already taken by another user
      const existingUser = await User.findOne({
        gstNumber,
        _id: { $ne: req.params.id },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "GST number is already in use",
        });
      }
    }

    // Validate role if provided (basic validation)
    if (role && !["super_admin", "site_manager", "client", "labour", "saas_admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Allowed roles: saas_admin, super_admin, site_manager, client, labour",
      });
    }

    // Build updates object
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (isActive !== undefined) updates.isActive = isActive;
    if (address) updates.address = address;
    if (gstNumber) updates.gstNumber = gstNumber;
    if (panNumber) updates.panNumber = panNumber;
    if (adharNumber) updates.adharNumber = adharNumber;
    if (profilePicture) updates.profilePicture = profilePicture;

    // Additional check: If updating a user to super_admin, ensure creator is saas_admin
    if (role === "super_admin" && req.user.role !== "saas_admin") {
      return res.status(403).json({
        success: false,
        message: "Only SaaS Admin can assign Super Admin role",
      });
    }

    // If updating a user to saas_admin, prevent it (only one SaaS Admin?)
    if (role === "saas_admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot assign SaaS Admin role through this endpoint",
      });
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Populate associated user if exists
    if (user.associatedWithUser) {
      await user.populate("associatedWithUser", "name email role");
    }

    res.json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} is already in use`,
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update user",
    });
  }
};

export const deactivateUser = async (req, res, next) => {
  try {
    // Prevent deactivating yourself
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Failed to deactivate user",
    });
  }
};

export const activateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User activated successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Failed to activate user",
    });
  }
};
