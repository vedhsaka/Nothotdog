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
      .eq('uuid', groupId)
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

  static async deleteGroup(groupId) {
    const group = await this.getGroupById(groupId);

    // Delete all inputs associated with the group
    const { error: inputDeleteError } = await supabase
      .from('collections')
      .delete()
      .eq('group_id', group.id);

    if (inputDeleteError) throw inputDeleteError;

    // Delete the group itself
    const { error: groupDeleteError } = await supabase
      .from('groups')
      .delete()
      .eq('id', group.id);

    if (groupDeleteError) throw groupDeleteError;

    return { message: 'Group and all associated inputs deleted successfully' };
  }
}

module.exports = GroupModel;