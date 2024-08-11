const { supabase } = require('../server');
const InputModel = require('../models/inputModel');
const ProjectModel = require("../models/projectModel");
const GroupModel = require("../models/groupModel");
const UserModel = require("../models/userModel");

exports.saveInput = async (req, res) => {
    try {
        let group_id = null;
        const { description, inputType, content, projectId, groupId, checks, sequence, url, apiType, method, headers, query_params, content_type } = req.body;
        const userId = req.get("userId");
        const user = await UserModel.getUser(userId);
        let order = 1;
        if (!content) {
            return res.status(400).json({ message: 'No input content provided' });
        }
        if (groupId != null) {
            group = await GroupModel.getGroupById(groupId);
            group_id = group.id;
            order = sequence;
        } 
        project = await ProjectModel.getProjectById(projectId);

        const { data, error } = await InputModel.saveInput(user.id, description, inputType, content, project.id, group_id, checks, order, url, apiType, method, headers, query_params, content_type);

        if (error) throw error;

        res.status(200).json({ message: 'Input saved successfully', data });
    } catch (error) {
        res.status(500).json({ message: 'Error saving Input', error: error.message });
    }
};

exports.getInputs = async (req, res) => {
    try {
        const userId = req.get("userId");
        const user = await UserModel.getUser(userId);
        const projects = await ProjectModel.getProjects(user.id);
        const projectsWithInputs = await Promise.all(projects.map(async (project) => {
            const projectData = await InputModel.getInputs(project.id);
            return projectData;
        }));
      
          res.status(200).json({ data: projectsWithInputs });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching inputs', error: error.message });
    }
};

exports.updateInput = async (req, res) => {
    try {
        const { uuid } = req.params;
        const updateData = req.body;
        const userId = req.get("userId");
        const user = await UserModel.getUser(userId);
        const updatedInput = await InputModel.updateInput(user.id, uuid, updateData);
        res.status(200).json({ message: 'Input updated successfully', data: updatedInput });
    } catch (error) {
        res.status(500).json({ message: 'Error updating Input', error: error.message });
    }
};

exports.deleteInput = async (req, res) => {
    try {
      const userId = req.get("userId");
      const { uuid } = req.params;
      const user = await UserModel.getUser(userId);
      const result = await InputModel.deleteInput(user.id, uuid);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in deleteInput:', error);
      res.status(500).json({ 
        message: 'Error deleting Input', 
        error: error.message,
        stack: error.stack 
      });
    }
};

exports.testInput = async (req, res) => {
    try {
        const { inputType, content, checks } = req.body;

        if (!content) {
        return res.status(400).json({ message: 'No input data provided' });
        }

        const result = await InputModel.testInput(inputType, content, checks);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in testInput:', error);
        res.status(500).json({ 
        message: 'Error testing Input', 
        error: error.message,
        stack: error.stack 
        });
    }
};
