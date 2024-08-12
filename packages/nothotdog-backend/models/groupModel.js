const supabase = require('../supabaseClient.js');
const logger = require('../utils/logger');

class GroupModel {
  static async createGroup(projectId, name) {
    logger.info('Creating new group', { projectId, name });
    try {
      const { data, error } = await supabase
        .from('groups')
        .insert({ project_id: projectId, name })
        .select();

      if (error) throw error;

      logger.info('Group created successfully', { projectId, groupId: data[0].id, name });
      return data[0];
    } catch (error) {
      logger.error('Error creating group', { projectId, name, error: error.message, stack: error.stack });
      throw error;
    }
  }

  static async getGroups(projectId) {
    logger.info('Fetching groups for project', { projectId });
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      logger.info('Groups fetched successfully', { projectId, groupCount: data.length });
      return data;
    } catch (error) {
      logger.error('Error fetching groups', { projectId, error: error.message, stack: error.stack });
      throw error;
    }
  }

  static async updateGroup(groupId, name) {
    logger.info('Updating group', { groupId, newName: name });
    try {
      const { data, error } = await supabase
        .from('groups')
        .update({ name })
        .eq('uuid', groupId)
        .select();

      if (error) throw error;

      logger.info('Group updated successfully', { groupId, newName: name });
      return data[0];
    } catch (error) {
      logger.error('Error updating group', { groupId, newName: name, error: error.message, stack: error.stack });
      throw error;
    }
  }

  static async getGroupById(groupId) {
    logger.info('Fetching group by ID', { groupId });
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('uuid', groupId)
        .single();

      if (error) throw error;

      logger.info('Group fetched successfully', { groupId });
      return data;
    } catch (error) {
      logger.error('Error fetching group by ID', { groupId, error: error.message, stack: error.stack });
      throw error;
    }
  }

  static async deleteGroup(groupId) {
    logger.info('Deleting group', { groupId });
    try {
      const group = await this.getGroupById(groupId);

      const { error: inputDeleteError } = await supabase
        .from('collections')
        .delete()
        .eq('group_id', group.id);

      if (inputDeleteError) throw inputDeleteError;

      const { error: groupDeleteError } = await supabase
        .from('groups')
        .delete()
        .eq('id', group.id);

      if (groupDeleteError) throw groupDeleteError;

      logger.info('Group and all associated inputs deleted successfully', { groupId });
      return { message: 'Group and all associated inputs deleted successfully' };
    } catch (error) {
      logger.error('Error deleting group', { groupId, error: error.message, stack: error.stack });
      throw error;
    }
  }
}

module.exports = GroupModel;