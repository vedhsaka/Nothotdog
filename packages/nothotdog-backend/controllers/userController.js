import { createUser, getUser, updateUser, deleteUser } from '../models/userModel.js';

export const create = async (req, res) => {
  try {
    const { uuid, createdAt, invitedProjectId } = req.body;
    const result = await createUser(uuid, createdAt, invitedProjectId);
    res.status(201).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const userId = req.header("userId");
    const user = await getUser(userId);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const userId = req.header("userId");
    const updateData = req.body;
    const updatedUser = await updateUser(userId, updateData);
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const userId = req.user.id;
    await deleteUser(userId);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};