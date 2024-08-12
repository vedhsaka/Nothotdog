const supabase = require('../supabaseClient.js');
const logger = require('../utils/logger');

class ProjectModel {
  static async createProject(userId, projectName) {
    logger.info('Creating new project', { userId, projectName });
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({ name: projectName, created_by: userId })
        .select();

      if (error) throw error;

      const { data: mappingData, error: mappingError } = await supabase
        .from('user_project_mapping')
        .insert({ project_id: data[0].id, user_id: userId})
        .select();

      if (mappingError) throw mappingError;

      logger.info('Project created successfully', { userId, projectId: data[0].id, projectName });
      return data[0];
    } catch (error) {
      logger.error('Error creating project', { userId, projectName, error: error.message, stack: error.stack });
      throw error;
    }
  }

  static async getProjects(userId) {
    logger.info('Fetching projects for user', { userId });
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id, 
          created_at, 
          name, 
          uuid, 
          user_project_mapping!inner(user_id)
        `)
        .eq('user_project_mapping.user_id', userId);
    
      if (error) throw error;

      const projects = data.map(({ user_project_mapping, ...project }) => project);
      logger.info('Projects fetched successfully', { userId, projectCount: projects.length });
      return projects;
    } catch (error) {
      logger.error('Error fetching projects', { userId, error: error.message, stack: error.stack });
      throw error;
    }
  }

  static async getProjectById(projectId) {
    logger.info('Fetching project by ID', { projectId });
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('uuid', projectId)
        .single();

      if (error) throw error;

      logger.info('Project fetched successfully', { projectId });
      return data;
    } catch (error) {
      logger.error('Error fetching project by ID', { projectId, error: error.message, stack: error.stack });
      throw error;
    }
  }

  static async updateProject(projectId, name) {
    logger.info('Updating project', { projectId, newName: name });
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ name })
        .eq('uuid', projectId)
        .select();

      if (error) throw error;

      logger.info('Project updated successfully', { projectId, newName: name });
      return data[0];
    } catch (error) {
      logger.error('Error updating project', { projectId, newName: name, error: error.message, stack: error.stack });
      throw error;
    }
  }

  static async deleteProject(projectId, userId) {
    logger.info('Deleting project', { projectId, userId });
    try {
      const project = await this.getProjectById(projectId);

      const { error: inputDeleteError } = await supabase
        .from('collections')
        .delete()
        .eq('project_id', project.id);

      if (inputDeleteError) throw inputDeleteError;

      const { error: groupDeleteError } = await supabase
        .from('groups')
        .delete()
        .eq('project_id', project.id);

      if (groupDeleteError) throw groupDeleteError;

      const { error: projectDeleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)
        .eq('created_by', userId);

      if (projectDeleteError) throw projectDeleteError;

      const { error: mappingDeleteError } = await supabase
        .from('user_project_mapping')
        .delete()
        .eq('project_id', project.id)
        .eq('user_id', userId);

      if (mappingDeleteError) throw mappingDeleteError;

      logger.info('Project and all associated data deleted successfully', { projectId, userId });
      return { message: 'Project and all associated data deleted successfully' };
    } catch (error) {
      logger.error('Error deleting project', { projectId, userId, error: error.message, stack: error.stack });
      throw error;
    }
  }

  static async addUserToProject(projectId, userId) {
    logger.info('Adding user to project', { projectId, userId });
    try {
      const { error: insertError } = await supabase
        .from('user_project_mapping')
        .insert({ project_id: projectId, user_id: userId });

      if (insertError) throw insertError;

      logger.info('User added to project successfully', { projectId, userId });
      return { message: 'User added to project successfully' };
    } catch (error) {
      logger.error('Error adding user to project', { projectId, userId, error: error.message, stack: error.stack });
      throw error;
    }
  }

  static async removeUserFromProject(projectId, userId) {
    logger.info('Removing user from project', { projectId, userId });
    try {
      const { error: removeError } = await supabase
        .from('user_project_mapping')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);
    
      if (removeError) throw removeError;
    
      logger.info('User removed from project successfully', { projectId, userId });
      return { message: 'User removed from project successfully' };
    } catch (error) {
      logger.error('Error removing user from project', { projectId, userId, error: error.message, stack: error.stack });
      throw error;
    }
  }
}

module.exports = ProjectModel;