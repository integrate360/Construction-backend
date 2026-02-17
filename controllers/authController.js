import User from "../models/User.js";

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phoneNumber, address, gstNumber } =
      req.body;

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

    // Phone number validation (basic - can be customized based on your region)
    const phoneRegex = /^\d{10}$/; // Assuming 10 digit phone number
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit phone number",
      });
    }

    // GST Number validation (if provided)
    if (gstNumber) {
      const gstRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gstNumber)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid GST number",
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

    // Check if user exists
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

    const user = await User.create({
      name,
      email,
      password,
      phoneNumber,
      address,
      gstNumber,
      role: role || "labour",
    });

    const token = user.getSignedJwtToken();

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user,
    });
  } catch (error) {
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
    const user = await User.findById(req.user.id).populate(
      "assignedSites",
      "name location status",
    );

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
    const { name, phoneNumber, profilePicture, address, gstNumber } = req.body;

    // Validate fields to update
    if (!name && !phoneNumber && !profilePicture && !address && !gstNumber) {
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

    // Validate GST number if provided
    if (gstNumber) {
      const gstRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gstNumber)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid GST number",
        });
      }
    }

    const updates = {};
    if (name) updates.name = name;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (profilePicture) updates.profilePicture = profilePicture;
    if (address) updates.address = address;
    if (gstNumber) updates.gstNumber = gstNumber;

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
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

    // Build filter object
    const filter = {};

    // Role filter
    if (role) filter.role = role;

    // Status filter
    if (isActive !== undefined) filter.isActive = isActive === "true";

    // Search functionality (search in name, email, phoneNumber, address, and gstNumber)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { gstNumber: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute queries
    const users = await User.find(filter)
      .select("-password")
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate("assignedSites", "name location status");

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
      .populate("assignedSites", "name location status");

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
    const { name, email, role, phoneNumber, isActive, address, gstNumber } =
      req.body;

    // Validate at least one field is provided
    if (
      !name &&
      !email &&
      !role &&
      !phoneNumber &&
      isActive === undefined &&
      !address &&
      !gstNumber
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field to update",
      });
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

    // Validate GST number if provided
    if (gstNumber) {
      const gstRegex =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gstNumber)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid GST number",
        });
      }
    }

    // Validate role if provided
    if (
      role &&
      !["super_admin", "site_manager", "client", "labour"].includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid role. Allowed roles: super_admin, site_manager, client, labour",
      });
    }

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (isActive !== undefined) updates.isActive = isActive;
    if (address) updates.address = address;
    if (gstNumber) updates.gstNumber = gstNumber;

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
