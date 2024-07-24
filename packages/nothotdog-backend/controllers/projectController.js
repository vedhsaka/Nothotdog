const ProjectModel = require('../models/projectModel');
const UserModel = require('../models/userModel');

exports.createProject = async (req, res) => {
  try {
    const { projectName } = req.body;
    const userId = req.header("userId");
    const project = await ProjectModel.createProject(userId, projectName);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const userId = req.header("userId");
    const user = await UserModel.getUser(userId)
    const projects = await ProjectModel.getProjects(user.id);
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
};

exports.addUserToProject = async (req, res) => {
  try {
    const { projectId, userIdToAdd } = req.body;
    const result = await ProjectModel.addUserToProject(projectId, userIdToAdd);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error adding user to project', error: error.message });
  }
};

exports.removeUserFromProject = async (req, res) => {
  try {
    const { projectId, userIdToRemove } = req.body;
    const result = await ProjectModel.removeUserFromProject(projectId, userIdToRemove);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error removing user from project', error: error.message });
  }
};

// exports.deleteProject = async (req, res) => {
//   try {
//     const { projectId } = req.params;
//     const userId = req.user.id;
//     await ProjectModel.deleteProject(projectId, userId);
//     res.status(200).json({ message: 'Project deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Error deleting project', error: error.message });
// //   }
// };