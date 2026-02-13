/**
 * User Controller
 * Handles user-related operations
 */

const { User } = require('../models');
const { aiService } = require('../services');

/**
 * Login user (Simulated for MVP)
 * @route POST /api/auth/login
 * @body { email }
 */
const login = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({
      where: { email },
      attributes: {
        exclude: ['password'], // Never return password
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: {
        exclude: ['password'],
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users
 * @route GET /api/users
 */
const getAllUsers = async (_req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: {
        exclude: ['password'],
      },
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate 1-day meal plan
 * @route POST /api/users/meal-plan
 * @body { userId, profile } - One of them is required
 */
const getMealPlan = async (req, res, next) => {
  try {
    const { userId, profile } = req.body;
    let userProfile = profile;

    // If no explicit profile provided, fetch from user ID
    if (!userProfile) {
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId or profile object is required',
        });
      }

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      userProfile = {
        diet: user.dietary_preference,
        allergies: user.allergies || [],
      };
    } else {
      // Validate provided profile
      if (typeof userProfile.diet !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Invalid profile: diet must be a string',
        });
      }
      if (!Array.isArray(userProfile.allergies)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid profile: allergies must be an array',
        });
      }
    }

    const mealPlan = await aiService.generateMealPlan(userProfile);

    return res.status(200).json({
      success: true,
      data: mealPlan,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getUserById,
  getAllUsers,
  getMealPlan,
};
