const UserModel = require('../models/userModel');

exports.createUser = async (req, res) => {
  try {
    const { uuid, createdAt, invitedProjectId } = req.body;
    const result = await UserModel.createUser(uuid, createdAt, invitedProjectId);
    res.status(201).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const userId = req.header("userId");
    const user = await UserModel.getUser(userId);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.header("userId");
    const updateData = req.body;
    const updatedUser = await UserModel.updateUser(userId, updateData);
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.user.id;
    await UserModel.deleteUser(userId);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};