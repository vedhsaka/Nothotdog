import { createProject, getProjects, addUserToProject, removeUserFromProject } from '../models/projectModel.js';
import { getUser } from '../models/userModel.js';

export const create = async (req, res) => {
  try {
    const { projectName } = req.body;
    const userId = req.header("userId");
    const project = await createProject(userId, projectName);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const userId = req.header("userId");
    const user = await getUser(userId)
    const projects = await getProjects(user.id);
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
};

export const addUser = async (req, res) => {
  try {
    const { projectId, userIdToAdd } = req.body;
    const result = await addUserToProject(projectId, userIdToAdd);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error adding user to project', error: error.message });
  }
};

export const removeUser = async (req, res) => {
  try {
    const { projectId, userIdToRemove } = req.body;
    const result = await removeUserFromProject(projectId, userIdToRemove);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error removing user from project', error: error.message });
  }
};

// export const remove = async (req, res) => {
//   try {
//     const { projectId } = req.params;
//     const userId = req.user.id;
//     await deleteProject(projectId, userId);
//     res.status(200).json({ message: 'Project deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Error deleting project', error: error.message });
// //   }
// };