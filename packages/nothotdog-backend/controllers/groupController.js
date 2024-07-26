import { getProjectById } from '../models/projectModel.js';
import { createGroup, getGroups, updateGroup } from '../models/groupModel.js';

export const create = async (req, res) => {
  try {
    const { project_id, name } = req.body;
    const project = await getProjectById(project_id);
    const group = await createGroup(project.id, name);
    res.status(201).json({ message: 'Group created successfully', data: group });
  } catch (error) {
    res.status(500).json({ message: 'Error creating group', error: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const { project_id } = req.params;
    const project = await getProjectById(project_id);
    const groups = await getGroups(project.id);
    res.status(200).json({ data: groups });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching groups', error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updatedGroup = await updateGroup(id, name);
    if (!updatedGroup) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.status(200).json({ message: 'Group updated successfully', data: updatedGroup });
  } catch (error) {
    res.status(500).json({ message: 'Error updating group', error: error.message });
  }
};