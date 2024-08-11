const supabase = require('../supabaseClient.js');

class ProjectModel {
  static async createProject(userId, projectName) {
    const { data, error } = await supabase
      .from('projects')
      .insert({ name: projectName, created_by: userId })
      .select();


		const { data2 , error2 } = await supabase
    .from('user_project_mapping')
    .insert({ project_id: data[0].id, user_id: userId})
    .select();

    return data[0];
  }

  static async getProjects(userId) {
		const { data, error } = await supabase
    .from('projects')
    .select(`
      id, 
      created_at, 
      name, 
      uuid, 
      user_project_mapping!inner(user_id)
    `)
    .eq('user_project_mapping.user_id', userId)
    
    if (error) throw error;
		return data.map(({ user_project_mapping, ...project }) => project);
  }

  static async getProjectById(projectId) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('uuid', projectId)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProject(projectId, name) {
    const { data, error } = await supabase
      .from('projects')
      .update({ name })
      .eq('uuid', projectId)
      .select();

    if (error) throw error;
    return data[0];
  }

  static async deleteProject(projectId, userId) {
    const project = await this.getProjectById(projectId);

    // Delete all inputs associated with the project
    const { error: inputDeleteError } = await supabase
      .from('collections')
      .delete()
      .eq('project_id', project.id);

    if (inputDeleteError) throw inputDeleteError;

    // Delete all groups associated with the project
    const { error: groupDeleteError } = await supabase
      .from('groups')
      .delete()
      .eq('project_id', project.id);

    if (groupDeleteError) throw groupDeleteError;

    // Delete the project itself
    const { error: projectDeleteError } = await supabase
      .from('projects')
      .delete()
      .eq('id', project.id)
      .eq('created_by', userId);

    if (projectDeleteError) throw projectDeleteError;

    // Delete the user-project mapping
    const { error: mappingDeleteError } = await supabase
      .from('user_project_mapping')
      .delete()
      .eq('project_id', project.id)
      .eq('user_id', userId);

    if (mappingDeleteError) throw mappingDeleteError;

    return { message: 'Project and all associated data deleted successfully' };
  }

  static async addUserToProject(projectId, userId) {
    const { error: insertError } = await supabase
      .from('user_project_mapping')
      .insert({ project_id: projectId, user_id: userId });

    if (insertError) throw insertError;

    return { message: 'User added to project successfully' };
  }

  static async removeUserFromProject(projectId, userId) {
    const { error: removeError } = await supabase
      .from('user_project_mapping')
			.delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);
  
    if (removeError) throw removeError;
  
    return { message: 'User removed from project successfully' };
  }
}

module.exports = ProjectModel;