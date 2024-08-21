const UserModel = require('../models/userModel');
const ProjectModel = require('../models/projectModel');
const logger = require('../utils/logger');

exports.createUser = async (req, res) => {
  const { uuid, createdAt, invitedProjectId } = req.body;
  logger.info('Create user attempt', { uuid, invitedProjectId });
  try {
    const result = await UserModel.createUser(uuid, createdAt, invitedProjectId);
    const user = result.user;
    let project;

    if (invitedProjectId) {
      project = await ProjectModel.getProjectById(invitedProjectId);
      if (project == null) {
        logger.warn('Invited project not found', { uuid, invitedProjectId });
        return res.status(404).json({ message: "Project doesn't exist" });
      }
      await ProjectModel.addUserToProject(invitedProjectId, uuid);
      logger.info('User added to invited project', { uuid, invitedProjectId });
    } else {
      project = await ProjectModel.createProject(user.id, 'Test Project');
      logger.info('New project created for user', { uuid, projectId: project.id });
    }

    logger.info('User created successfully', { uuid, projectId: project.id });
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error creating user', { 
      uuid, 
      invitedProjectId, 
      error: error.message, 
      stack: error.stack 
    });
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

exports.getUser = async (req, res) => {
  const userId = req.header("userId");
  logger.info('Get user attempt', { userId });
  try {
    const user = await UserModel.getUser(userId);
    logger.info('User fetched successfully', { userId });
    res.status(200).json(user);
  } catch (error) {
    logger.error('Error fetching user', { 
      userId, 
      error: error.message, 
      stack: error.stack 
    });
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  const userId = req.header("userId");
  logger.info('Update user attempt', { userId });
  try {
    const user = await UserModel.getUser(userId);
    const updateData = req.body;
    const updatedUser = await UserModel.updateUser(user.id, updateData);
    logger.info('User updated successfully', { userId });
    res.status(200).json(updatedUser);
  } catch (error) {
    logger.error('Error updating user', { 
      userId, 
      error: error.message, 
      stack: error.stack 
    });
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  const userId = req.header("userId");
  logger.info('Delete user attempt', { userId });
  try {
    const user = await UserModel.getUser(userId);
    await UserModel.deleteUser(user.id);
    logger.info('User deleted successfully', { userId });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user', { 
      userId, 
      error: error.message, 
      stack: error.stack 
    });
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};