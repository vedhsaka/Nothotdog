// groupController.js
const GroupModel = require('../models/groupModel');
const ProjectModel = require('../models/projectModel')

exports.createGroup = async (req, res) => {
  try {
    const { project_id, name } = req.body;
    const project = await ProjectModel.getProjectById(project_id);
    const group = await GroupModel.createGroup(project.id, name);
    res.status(201).json({ message: 'Group created successfully', data: group });
  } catch (error) {
    res.status(500).json({ message: 'Error creating group', error: error.message });
  }
};

exports.getGroups = async (req, res) => {
  try {
    const { project_id } = req.params;
    const project = await ProjectModel.getProjectById(project_id);
    const groups = await GroupModel.getGroups(project.id);
    res.status(200).json({ data: groups });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching groups', error: error.message });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updatedGroup = await GroupModel.updateGroup(id, name);
    if (!updatedGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(200).json({ message: 'Group updated successfully', data: updatedGroup });
  } catch (error) {
    res.status(500).json({ message: 'Error updating group', error: error.message });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    await GroupModel.deleteGroup(id);
    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting group', error: error.message });
  }
};