const supabase = require('../supabaseClient.js');
const ProjectModel = require('./projectModel.js');

class UserModel {
  static async createUser(uuid, createdAt, invitedProjectId = null) {
    let project = null;

    const { data, error } = await supabase
    .from('users')
    .insert({ uuid: uuid, created_at: createdAt })
    .select();
    if (error) throw error;

    if (invitedProjectId) {
        project = await ProjectModel.getProjectById(invitedProjectId);
        if(project == null) return "Project doesnt exist";

        ProjectModel.addUserToProject(invitedProjectId, uuid);
      } else {
        project = await ProjectModel.createProject(uuid, 'Test Project');
      }

    return { user: data[0], project };
  }

  static async getUser(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('uuid', userId)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateUser(uuid, updateData) {
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('uuid', uuid)
      .select();

    if (error) throw error;
    return data[0];
  }

  static async deleteUser(userId) {
    // Get all projects associated with the user
    const projects = await ProjectModel.getProjects(userId);

    // Remove the user from all associated projects
    for (const project of projects) {
      await ProjectModel.removeUserFromProject(project.id, userId);
    }

    // Delete the user's personal data
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    return { message: 'User deleted and removed from all associated projects successfully' };
  }
}

module.exports = UserModel;