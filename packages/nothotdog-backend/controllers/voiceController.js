const { supabase } = require('../server');
const VoiceModel = require('../models/voiceModel');
const ProjectModel = require("../models/projectModel");
const GroupModel = require("../models/groupModel");
const UserModel = require("../models/userModel");

exports.saveVoice = async (req, res) => {
    try {
        let group_id = null;
        const { description, audioBase64, projectId, groupId, checks, sequence } = req.body;
        const userId = req.get("userId"); // Assuming you have middleware setting req.user
        const user = await UserModel.getUser(userId);
        let order = 1;
        if (!audioBase64) {
            return res.status(400).json({ message: 'No audio data provided' });
        }
        if (groupId != null) {
            group = await GroupModel.getGroupById(groupId);
            group_id = group.id;
            order = sequence;
        } 
        project = await ProjectModel.getProjectById(projectId);

        // Convert base64 to Buffer
        const audioBinary = Buffer.from(audioBase64, 'base64');
        const { data, error } = await VoiceModel.saveVoice(user.id, description, audioBinary, project.id, group_id, checks, order);

        if (error) throw error;

        res.status(200).json({ message: 'Voice saved successfully', data });
    } catch (error) {
        res.status(500).json({ message: 'Error saving voice', error: error.message });
    }
};

exports.getVoices = async (req, res) => {
    try {
        const userId = req.get("userId"); // Assuming you have middleware setting req.user
        const user = await UserModel.getUser(userId);
        const projects = await ProjectModel.getProjects(user.id);
        
        const projectsWithVoices = await Promise.all(projects.map(async (project) => {
            const { data: voices, error } = await VoiceModel.getVoices(project.id);
            if (error) throw error;
      
            return {
              created_at: project.created_at,
              name: project.name,
              uuid: project.uuid,
              voices: voices
            };
          }));
      
          res.status(200).json({ data: projectsWithVoices });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching voices', error: error.message });
    }
};

exports.deleteVoice = async (req, res) => {
    try {
      const userId = "temp"; // Assuming you have middleware setting req.user
      const { uuid } = req.params; // Assuming voiceId is passed as a URL parameter
      const result = await VoiceModel.deleteVoice(userId, uuid);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error in deleteVoice:', error);
      res.status(500).json({ 
        message: 'Error deleting voice', 
        error: error.message,
        stack: error.stack 
      });
    }
  };

exports.testVoice = async (req, res) => {
    try {
        const { audioBase64, checks } = req.body;

        if (!audioBase64) {
        return res.status(400).json({ message: 'No audio data provided' });
        }

        const result = await VoiceModel.testVoice(audioBase64, checks);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error in testVoice:', error);
        res.status(500).json({ 
        message: 'Error testing voice', 
        error: error.message,
        stack: error.stack 
        });
    }
};
