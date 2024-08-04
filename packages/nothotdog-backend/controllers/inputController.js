const { supabase } = require('../server');
const InputModel = require('../models/inputModel');
const ProjectModel = require("../models/projectModel");
const GroupModel = require("../models/groupModel");
const UserModel = require("../models/userModel");

exports.saveInput = async (req, res) => {
    try {
        let group_id = null;
        const { description, type, content, projectId, groupId, checks, sequence } = req.body;
        const userId = req.get("userId"); // Assuming you have middleware setting req.user
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

        const { data, error } = await InputModel.saveInput(user.id, description, type, content, project.id, group_id, checks, order);

        if (error) throw error;

        res.status(200).json({ message: 'Input saved successfully', data });
    } catch (error) {
        res.status(500).json({ message: 'Error saving Input', error: error.message });
    }
};

exports.getInputs = async (req, res) => {
    try {
        const userId = req.get("userId"); // Assuming you have middleware setting req.user
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

exports.deleteInput = async (req, res) => {
    try {
      const userId = "temp"; // Assuming you have middleware setting req.user
      const { uuid } = req.params; // Assuming inputId is passed as a URL parameter
      const result = await InputModel.deleteInput(userId, uuid);
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
