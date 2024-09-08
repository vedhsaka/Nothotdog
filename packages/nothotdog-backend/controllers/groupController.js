// groupController.js
const GroupModel = require('../models/groupModel');
const ProjectModel = require('../models/projectModel');
const logger = require('../utils/logger');

exports.createGroup = async (req, res) => {
  const { project_id, name } = req.body;
  const userId = req.get("userId");
  logger.info('Create group attempt', { userId, projectId: project_id, groupName: name });
  try {
    const project = await ProjectModel.getProjectById(project_id);
    const group = await GroupModel.createGroup(project.id, name);
    logger.info('Group created successfully', { userId, projectId: project.id, groupId: group.id, groupName: name });
    res.status(201).json({ message: 'Group created successfully', data: group });
  } catch (error) {
    logger.error('Error creating group', { 
      userId, 
      projectId: project_id, 
      groupName: name, 
      error: error.message, 
      stack: error.stack 
    });
    res.status(500).json({ message: 'Error creating group', error: error.message });
  }
};

exports.getGroups = async (req, res) => {
  const { project_id } = req.params;
  const userId = req.get("userId");
  logger.info('Get groups attempt', { userId, projectId: project_id });
  try {
    const project = await ProjectModel.getProjectById(project_id);
    const groups = await GroupModel.getGroups(project.id);
    logger.info('Groups fetched successfully', { userId, projectId: project.id, groupCount: groups.length });
    res.status(200).json({ data: groups });
  } catch (error) {
    logger.error('Error fetching groups', { 
      userId, 
      projectId: project_id, 
      error: error.message, 
      stack: error.stack 
    });
    res.status(500).json({ message: 'Error fetching groups', error: error.message });
  }
};


exports.updateGroup = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.get("userId");
  logger.info('Update group attempt', { userId, groupId: id, newName: name });
  try {
    const updatedGroup = await GroupModel.updateGroup(id, name);
    if (!updatedGroup) {
      logger.warn('Group not found for update', { userId, groupId: id });
      return res.status(404).json({ message: 'Group not found' });
    }
    logger.info('Group updated successfully', { userId, groupId: id, newName: name });
    res.status(200).json({ message: 'Group updated successfully', data: updatedGroup });
  } catch (error) {
    logger.error('Error updating group', { 
      userId, 
      groupId: id, 
      newName: name, 
      error: error.message, 
      stack: error.stack 
    });
    res.status(500).json({ message: 'Error updating group', error: error.message });
  }
};

exports.reorderInputs = async (req, res) => {
  const { id } = req.params;
  const { inputs } = req.body;
  const userId = req.get("userId");

  logger.info('Reorder inputs attempt', { userId, groupid: id });

  try {
    const group = await GroupModel.getGroup(id);
    if (!group) {
      logger.warn('Group not found', { userId, groupUuid: id });
      return res.status(404).json({ message: 'Group not found' });
    }

    const reorderedInputs = await GroupModel.reorderInputs(group.id, inputs);
    
    logger.info('Inputs reordered successfully', { 
      userId, 
      groupUuid: id, 
      groupId: group.id, 
      updatedCount: reorderedInputs.length,
      totalInputs: inputs.length
    });

    if (reorderedInputs.length < inputs.length) {
      res.status(207).json({ 
        message: 'Some inputs were reordered successfully', 
        data: reorderedInputs,
        warning: `${inputs.length - reorderedInputs.length} inputs failed to update`
      });
    } else {
      res.status(200).json({ 
        message: 'All inputs reordered successfully', 
        data: reorderedInputs 
      });
    }
  } catch (error) {
    logger.error('Error reordering inputs', {
      userId,
      groupUuid: id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Error reordering inputs', error: error.message });
  }
};

exports.deleteGroup = async (req, res) => {
  const { id } = req.params;
  const userId = req.get("userId");
  logger.info('Delete group attempt', { userId, groupId: id });
  try {
    await GroupModel.deleteGroup(id);
    logger.info('Group deleted successfully', { userId, groupId: id });
    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    logger.error('Error deleting group', { 
      userId, 
      groupId: id, 
      error: error.message, 
      stack: error.stack 
    });
    res.status(500).json({ message: 'Error deleting group', error: error.message });
  }
};