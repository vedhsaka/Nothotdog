// groupModel.js
const supabase = require('../supabaseClient.js');

class GroupModel {
  static async createGroup(projectId, name) {
    const { data, error } = await supabase
      .from('groups')
      .insert({ project_id: projectId, name })
      .select();

    if (error) throw error;
    return data[0];
  }

  static async getGroups(projectId) {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async updateGroup(groupId, name) {
    const { data, error } = await supabase
      .from('groups')
      .update({ name })
      .eq('id', groupId)
      .select();

    if (error) throw error;
    return data[0];
  }

  static async getGroupById(groupId) {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('uuid', groupId)
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = GroupModel;