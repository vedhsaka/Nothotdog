import React, { useEffect, useState } from 'react';
import './css/RecordedTests.css';
import useAuthFetch from './AuthFetch';

const RecordedTests = () => {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const authFetch = useAuthFetch(); // Use the custom hook

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await authFetch('api/inputs/');
        const data = await response;
        setProjects(data.data);
      } catch (err) {
        setError('Failed to fetch recorded tests');
        console.error('Fetch error:', err);
      }
    };

    fetchTests();
  }, []);

  const handleDelete = async (uuid) => {
    try {
      const response = await authFetch(`api/delete-voice/${uuid}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProjects((prevProjects) =>
          prevProjects.map((project) => ({
            ...project,
            groups: project.groups.map((group) => ({
              ...group,
              inputs: group.inputs.filter((input) => input.uuid !== uuid),
            })),
          }))
        );
      } else {
        setError('Failed to delete the test');
        console.error('Delete error:', response.statusText);
      }
    } catch (err) {
      setError('Failed to delete the test');
      console.error('Fetch error:', err);
    }
  };

  const AudioPlayer = ({ audioBase64 }) => {
    const audioUrl = `data:audio/wav;base64,${audioBase64}`;
    return <audio controls src={audioUrl} />;
  };

  return (
    <div className="recorded-tests">
      <h2>Recorded Tests</h2>
      {error && <div className="error">{error}</div>}
      <table className="tests-table">
        <thead>
          <tr>
            <th></th>
            <th>User Name</th>
            <th>Description</th>
            <th>File Name</th>
            <th>Audio</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <React.Fragment key={project.uuid}>
              <tr>
                <td colSpan="6" className="project-name"><h4>{project.name}</h4></td>
              </tr>
              {project.groups.map((group) => (
                <React.Fragment key={group.uuid}>
                  <tr>
                    <td colSpan="6" className="group-name"><h5>{group.name}</h5></td>
                  </tr>
                  {group.inputs.map((input) => (
                    <tr key={input.uuid}>
                      <td></td>
                      <td>{input.created_by}</td>
                      <td>{input.description}</td>
                      <td>{input.file_name}</td>
                      <td><AudioPlayer audioBase64={input.content} /></td>
                      <td>
                        <button className="button delete" onClick={() => handleDelete(input.uuid)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecordedTests;
