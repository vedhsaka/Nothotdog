const supabase = require('../supabaseClient.js');

class ProjectModel {
  static async createProject(userId, projectName) {
		let user_id = null;
		try {
			user_id = await this.getUser(userId);
		} catch(e) {
		}

    const { data, error } = await supabase
      .from('projects')
      .insert({ name: projectName, created_by: userId })
      .select();


		const { data2 , error2 } = await supabase
    .from('user_project_mapping')
    .insert({ project_id: data[0].id, user_id: user_id.id})
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

  static async addUserToProject(projectId, userIdToAdd) {
		let project = null;
		let user = null;
		try {
			project = await this.getProjectById(projectId);
			user = await this.getUser(userIdToAdd);
		} catch (e) {
			console.error('Error getting project or user:', e);
			throw new Error('Project or user not found');
		}

    const { error: insertError } = await supabase
      .from('user_project_mapping')
      .insert({ project_id: project.id, user_id: user.id });

    if (insertError) throw insertError;

    return { message: 'User added to project successfully' };
  }

  static async removeUserFromProject(projectId, userIdToRemove) {
		let project = null;
		let user = null;
		try {
			project = await this.getProjectById(projectId);
			user = await this.getUser(userIdToRemove);
		} catch (e) {
			console.error('Error getting project or user:', e);
			throw new Error('Project or user not found');
		}

    const { error: removeError } = await supabase
      .from('user_project_mapping')
			.delete()
      .eq('project_id', project.id)
      .eq('user_id', user.id);
  
    if (removeError) throw removeError;
  
    return { message: 'User removed from project successfully' };
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
}

module.exports = ProjectModel;