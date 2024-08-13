const ProjectModel = require('../models/projectModel');
const UserModel = require('../models/userModel');
const logger = require('../utils/logger');

exports.createProject = async (req, res) => {
  try {
    const { projectName } = req.body;
    const userId = req.header("userId");
    logger.info('Create project attempt', { userId, projectName });
    const project = await ProjectModel.createProject(userId, projectName);
    logger.info('Project created successfully', { userId, projectName, projectId: project.id})
    res.status(201).json(project);
  } catch (error) {
    logger.error("Error creating project", { userId, projectName, error: error.message, stack: error.stack});
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const userId = req.header("userId");
    const user = await UserModel.getUser(userId)
    logger.info('Fetch project attempt', { userId: user.id });
    const projects = await ProjectModel.getProjects(user.id);
    logger.info('Project fetched successfully', { userId, projectCount: projects.length})
    res.status(200).json(projects);
  } catch (error) {
    logger.error("Error fetching project", { userId, error: error.message, stack: error.stack});
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name } = req.body;
    logger.info('Update project attempt', { projectId, projectName: name });
    const updatedProject = await ProjectModel.updateProject(projectId, name);
    logger.info('Project updated successfully', { projectId, projectName: name })
    res.status(200).json(updatedProject);
  } catch (error) {
    logger.error("Error updating project", { projectId, error: error.message, stack: error.stack});
    res.status(500).json({ message: 'Error updating project', error: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.header("userId");
    logger.info('Delete project attempt', { projectId, userId });
    await ProjectModel.deleteProject(projectId, userId);
    logger.info('Project deleted successfully', { projectId, userId })
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    logger.error("Error deleting project", { projectId, userId, error: error.message, stack: error.stack});
    res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
};

exports.addUserToProject = async (req, res) => {
  try {
    const { projectId, userId } = req.body;
    const user = await UserModel.getUser(userId)
    const project = await ProjectModel.getProjectById(projectId)
    logger.info('Adding user to project attempted', { projectId, userId });
    const result = await ProjectModel.addUserToProject(project.id, user.id);
    logger.info('Added user to project successfully', { projectId, userId });
    res.status(200).json(result);
  } catch (error) {
    logger.error("Error adding user to project", { projectId, userId, error: error.message, stack: error.stack});
    res.status(500).json({ message: 'Error adding user to project', error: error.message });
  }
};

exports.removeUserFromProject = async (req, res) => {
  try {
    const { projectId, userId } = req.body;
    const user = await UserModel.getUser(userId)
    const project = await ProjectModel.getProjectById(projectId)
    logger.info('Removing user from project attempted', { projectId, userId });
    const result = await ProjectModel.removeUserFromProject(project.id, user.id);
    logger.info('Removed user from project successfully', { projectId, userId });
    res.status(200).json(result);
  } catch (error) {
    logger.error("Error removing user from project", { projectId, userId, error: error.message, stack: error.stack});
    res.status(500).json({ message: 'Error removing user from project', error: error.message });
  }
};
