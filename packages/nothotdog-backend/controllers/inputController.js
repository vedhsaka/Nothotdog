const InputModel = require('../models/inputModel');
const ProjectModel = require("../models/projectModel");
const GroupModel = require("../models/groupModel");
const UserModel = require("../models/userModel");
const logger = require('../utils/logger');

exports.saveInput = async (req, res) => {
    const { description, inputType, content, projectId, groupId, checks, sequence, url, apiType, method, headers, query_params, content_type } = req.body;
    const userId = req.get("userId");
    logger.info('Save input attempt', { userId, inputType, projectId, groupId });
    try {
        const user = await UserModel.getUser(userId);
        let group_id = null;
        let order = 1;
        if (!content) {
            logger.warn('No input content provided', { userId, inputType, projectId });
            return res.status(400).json({ message: 'No input content provided' });
        }
        if (groupId != null) {
            const group = await GroupModel.getGroupById(groupId);
            group_id = group.id;
            order = sequence;
            logger.info('Input associated with group', { userId, groupId: group.id, order });
        } 
        const project = await ProjectModel.getProjectById(projectId);

        const { data, error } = await InputModel.saveInput(user.id, description, inputType, content, project.id, group_id, checks, order, url, apiType, method, headers, query_params, content_type);

        if (error) throw error;

        logger.info('Input saved successfully', { userId, inputType, projectId, inputId: data[0].id });
        res.status(200).json({ message: 'Input saved successfully', data });
    } catch (error) {
        logger.error('Error saving input', { 
            userId, 
            inputType, 
            projectId, 
            groupId, 
            error: error.message, 
            stack: error.stack 
        });
        res.status(500).json({ message: 'Error saving Input', error: error.message });
    }
};

exports.getInputs = async (req, res) => {
    const userId = req.get("userId");
    logger.info('Get inputs attempt', { userId });
    try {
        const user = await UserModel.getUser(userId);
        const projects = await ProjectModel.getProjects(user.id);
        const projectsWithInputs = await Promise.all(projects.map(async (project) => {
            const projectData = await InputModel.getInputs(project.id);
            return projectData;
        }));
        
        logger.info('Inputs fetched successfully', { userId, projectCount: projects.length });
        res.status(200).json({ data: projectsWithInputs });
    } catch (error) {
        logger.error('Error fetching inputs', { 
            userId, 
            error: error.message, 
            stack: error.stack 
        });
        res.status(500).json({ message: 'Error fetching inputs', error: error.message });
    }
};

exports.updateInput = async (req, res) => {
    const { uuid } = req.params;
    const updateData = req.body;
    const userId = req.get("userId");
    logger.info('Update input attempt', { userId, inputId: uuid });
    try {
        const user = await UserModel.getUser(userId);
        const updatedInput = await InputModel.updateInput(user.id, uuid, updateData);
        logger.info('Input updated successfully', { userId, inputId: uuid });
        res.status(200).json({ message: 'Input updated successfully', data: updatedInput });
    } catch (error) {
        logger.error('Error updating input', { 
            userId, 
            inputId: uuid, 
            error: error.message, 
            stack: error.stack 
        });
        res.status(500).json({ message: 'Error updating Input', error: error.message });
    }
};

exports.deleteInput = async (req, res) => {
    const userId = req.get("userId");
    const { uuid } = req.params;
    logger.info('Delete input attempt', { userId, inputId: uuid });
    try {
        const user = await UserModel.getUser(userId);
        const result = await InputModel.deleteInput(user.id, uuid);
        logger.info('Input deleted successfully', { userId, inputId: uuid });
        res.status(200).json(result);
    } catch (error) {
        logger.error('Error deleting input', { 
            userId, 
            inputId: uuid, 
            error: error.message, 
            stack: error.stack 
        });
        res.status(500).json({ 
            message: 'Error deleting Input', 
            error: error.message,
            stack: error.stack 
        });
    }
};

exports.testInput = async (req, res) => {
    const { inputType, content, checks } = req.body;
    const userId = req.get("userId");
    logger.info('Test input attempt', { userId, inputType });
    try {
        if (!content) {
            logger.warn('No input data provided for testing', { userId, inputType });
            return res.status(400).json({ message: 'No input data provided' });
        }

        const result = await InputModel.testInput(inputType, content, checks);
        logger.info('Input tested successfully', { 
            userId, 
            inputType, 
            testResult: result.test_result, 
            checksCount: checks.length 
        });
        res.status(200).json(result);
    } catch (error) {
        logger.error('Error testing input', { 
            userId, 
            inputType, 
            error: error.message, 
            stack: error.stack 
        });
        res.status(500).json({ 
            message: 'Error testing Input', 
            error: error.message,
            stack: error.stack 
        });
    }
};