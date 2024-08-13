const https = require('https');
const supabase = require('../supabaseClient.js');
const { VALID_CHECKS } = require('../constants.js');
const { createClient } = require("@deepgram/sdk");
const logger = require('../utils/logger');
require("dotenv").config({ path: '.env.local' });

class InputModel {
  static async saveInput(userId, description, inputType, content, project_id, group_id, checks, sequence, url, apiType, method, headers, query_params, content_type) {
      logger.info('Saving new input', { userId, inputType, projectId: project_id, groupId: group_id });
      try {
          if (group_id !== null) {
              await this.validateSequence(group_id, sequence);
              const { data: existingInputs, error: fetchError } = await supabase
                  .from('collections')
                  .select('input_type')
                  .eq('group_id', group_id)
                  .limit(1);
              
              if (fetchError) throw fetchError;
              
              if (existingInputs.length > 0 && existingInputs[0].input_type !== inputType) {
                  logger.warn('Type mismatch with existing inputs in group', { groupId: group_id, existingType: existingInputs[0].input_type, newType: inputType });
                  throw new Error(`Type mismatch with existing inputs in the group. The group contains ${existingInputs[0].input_type} inputs. Please create a new group for ${inputType} inputs.`);
              }
          }

          let fileName = null;
          let textContent = null;
          let audioBase64 = null;

          if (inputType === "voice") {
              fileName = `voice_${Date.now()}.wav`;
              const audioBlob = Buffer.from(content, 'base64');
              logger.info('Uploading voice input to storage', { fileName });
              const { data: fileData, error: fileError } = await supabase.storage
                  .from('audio')
                  .upload("public/"+fileName, audioBlob);

              if (fileError) throw fileError;
              audioBase64 = content;
          } else if (inputType === 'text') {
              textContent = content;
          } else {
              logger.error('Invalid input type provided', { inputType });
              throw new Error('Invalid input type');
          }

          const insertObject = {
              created_by: userId,
              description: description,
              file_name: fileName,
              input_type: inputType,
              text_content: textContent,
              project_id: project_id,
              sequence: sequence,
              checks: checks,
              group_id: group_id,
              url: url,
              api_type: apiType,
              method: method,
              query_params: query_params,
              headers: headers,
              content_type: content_type
          };

          logger.info('Inserting input data into database', { userId, projectId: project_id, groupId: group_id });
          const { data, error } = await supabase
              .from('collections')
              .insert(insertObject)
              .select();

          if (error) throw error;

          const standardizedOutput = {
              ...data[0],
              content: inputType === 'voice' ? audioBase64 : textContent
          };
          delete standardizedOutput.text_content;

          logger.info('Input saved successfully', { userId, inputType, projectId: project_id, groupId: group_id, inputId: data[0].id });
          return { data: [standardizedOutput] };
      } catch (error) {
          logger.error('Error saving input', { userId, inputType, projectId: project_id, groupId: group_id, error: error.message, stack: error.stack });
          throw error;
      }
  }

  static async getInputs(projectId) {
      logger.info('Fetching inputs for project', { projectId });
      try {
          const { data: project, error: projectError } = await supabase
              .from('projects')
              .select('*')
              .eq('id', projectId)
              .single();
          if (projectError) throw projectError;

          const { data: projectInputs, error: inputsError } = await supabase
              .from('collections')
              .select('*')
              .eq('project_id', projectId)
              .is('group_id', null)
              .order('created_at');
          if (inputsError) throw inputsError;

          const { data: groups, error: groupsError } = await supabase
              .from('groups')
              .select('*')
              .eq('project_id', projectId)
              .order('created_at');
          if (groupsError) throw groupsError;

          const standardizeInput = async (input) => {
              const standardizedInput = { ...input };
              if (input.input_type === 'voice') {
                  standardizedInput.content = await this.getAudioBase64(input.file_name);
              } else {
                  standardizedInput.content = input.text_content;
              }
              delete standardizedInput.text_content;
              delete standardizedInput.file_name;
              return standardizedInput;
          };

          logger.info('Fetching and standardizing group inputs', { projectId, groupCount: groups.length });
          const groupsWithInputs = await Promise.all(groups.map(async (group) => {
              const { data: groupInputs, error: groupInputsError } = await supabase
                  .from('collections')
                  .select('*')
                  .eq('group_id', group.id)
                  .order('sequence');

              if (groupInputsError) throw groupInputsError;

              const standardizedGroupInputs = await Promise.all(groupInputs.map(standardizeInput));

              return {
                  ...group,
                  inputs: standardizedGroupInputs
              };
          }));

          logger.info('Standardizing project inputs', { projectId, inputCount: projectInputs.length });
          const standardizedProjectInputs = await Promise.all(projectInputs.map(standardizeInput));

          const data = {
              ...project,
              inputs: standardizedProjectInputs,
              groups: groupsWithInputs
          };

          logger.info('Inputs fetched and processed successfully', { projectId, totalInputCount: standardizedProjectInputs.length + groupsWithInputs.reduce((sum, group) => sum + group.inputs.length, 0) });
          return data;
      } catch (error) {
          logger.error('Error fetching inputs', { projectId, error: error.message, stack: error.stack });
          throw error;
      }
  }

  static async getAudioBase64(fileName) {
      if (!fileName) return null;
      
      logger.info('Fetching audio file from storage', { fileName });
      try {
          const { data: audioBlob, error: audioError } = await supabase.storage
              .from('audio')
              .download(`public/${fileName}`);

          if (audioError) throw audioError;

          const arrayBuffer = await audioBlob.arrayBuffer();
          return Buffer.from(arrayBuffer).toString('base64');
      } catch (error) {
          logger.error('Error fetching audio file', { fileName, error: error.message, stack: error.stack });
          throw error;
      }
  }

  static async updateInput(userId, uuid, updateData) {
      logger.info('Updating input', { userId, inputId: uuid });
      try {
          const { data: existingInput, error: fetchError } = await supabase
              .from('collections')
              .select('*')
              .eq('uuid', uuid)
              .eq('created_by', userId)
              .single();

          if (fetchError) throw fetchError;
          if (!existingInput) {
              logger.warn('Input not found for update', { userId, inputId: uuid });
              throw new Error('Input not found');
          }

          const { description, inputType, content, checks, sequence, url, apiType, method, headers, query_params, content_type } = updateData;

          let fileName = existingInput.file_name;
          let textContent = existingInput.text_content;

          if (inputType === 'voice' && content) {
              if (fileName) {
                  logger.info('Deleting old audio file', { fileName });
                  const { error: deleteError } = await supabase.storage
                      .from('audio')
                      .remove([`public/${fileName}`]);
                  if (deleteError) throw deleteError;
              }

              fileName = `voice_${Date.now()}.wav`;
              const audioBlob = Buffer.from(content, 'base64');
              logger.info('Uploading new audio file', { fileName });
              const { error: uploadError } = await supabase.storage
                  .from('audio')
                  .upload(`public/${fileName}`, audioBlob);
              if (uploadError) throw uploadError;
          } else if (inputType === 'text') {
              textContent = content;
          }

          const updateObject = {
              description,
              input_type: inputType,
              file_name: fileName,
              text_content: textContent,
              sequence,
              checks,
              url,
              api_type: apiType,
              method,
              query_params,
              headers,
              content_type
          };

          logger.info('Updating input in database', { userId, inputId: uuid });
          const { data, error } = await supabase
              .from('collections')
              .update(updateObject)
              .eq('uuid', uuid)
              .eq('created_by', userId)
              .select();

          if (error) throw error;

          logger.info('Input updated successfully', { userId, inputId: uuid });
          return data[0];
      } catch (error) {
          logger.error('Error updating input', { userId, inputId: uuid, error: error.message, stack: error.stack });
          throw error;
      }
  }

  static async deleteInput(userId, uuid) {
      logger.info('Deleting input', { userId, inputId: uuid });
      try {
          const { data: input, error: fetchError } = await supabase
              .from('collections')
              .select('file_name, id, input_type')
              .eq('uuid', uuid)
              .eq('created_by', userId)
              .single();

          if (fetchError) throw fetchError;
          if (!input) {
              logger.warn('Input not found for deletion', { userId, inputId: uuid });
              throw new Error('Input not found');
          }

          if (input.input_type === 'voice' && input.file_name) {
              logger.info('Deleting associated audio file', { fileName: input.file_name });
              const { error: storageError } = await supabase.storage
                  .from('audio')
                  .remove([`public/${input.file_name}`]);

              if (storageError) throw storageError;
          }

          logger.info('Deleting input from database', { userId, inputId: uuid });
          const { error: deleteError } = await supabase
              .from('collections')
              .delete()
              .eq('id', input.id)
              .eq('created_by', userId);

          if (deleteError) throw deleteError;

          logger.info('Input deleted successfully', { userId, inputId: uuid });
          return { message: 'Input deleted successfully' };
      } catch (error) {
          logger.error('Error deleting input', { userId, inputId: uuid, error: error.message, stack: error.stack });
          throw error;
      }
  }

  static async validateSequence(groupId, newSequence) {
      logger.info('Validating sequence', { groupId, newSequence });
      try {
          const { data: collections, error } = await supabase
              .from('collections')
              .select('sequence')
              .eq('group_id', groupId);

          if (error) throw error;

          const sequences = collections.map(c => c.sequence);
          sequences.push(newSequence);

          const uniqueSequences = new Set(sequences);
          if (uniqueSequences.size !== sequences.length) {
              logger.warn('Sequence numbers are not unique', { groupId, newSequence });
              throw new Error('Sequence numbers must be unique within a group');
          }

          const sortedSequences = Array.from(uniqueSequences).sort((a, b) => a - b);
          if (sortedSequences[0] !== 1 || sortedSequences[sortedSequences.length - 1] !== sortedSequences.length) {
              logger.warn('Sequence numbers are not consecutive', { groupId, newSequence });
              throw new Error('Sequence numbers must be consecutive from 1 to N');
          }

          logger.info('Sequence validated successfully', { groupId, newSequence });
      } catch (error) {
          logger.error('Error validating sequence', { groupId, newSequence, error: error.message, stack: error.stack });
          throw error;
      }
  }

  static async testInput(inputType, content, checks) {
    logger.info('Starting input test', { inputType, checksCount: checks.length });
    try {
      let processedContent;

      if (inputType === "voice") {
        logger.info('Processing voice input');
        processedContent = await this.processVoiceInput(content);
      } else {
        logger.info('Processing non-voice input');
        processedContent = this.processNonVoiceInput(content);
      }

      const checkResults = [];
      let allChecksPassed = true;

      for (const check of checks) {
        const { field, rule, value } = check;
        logger.info('Performing check', { field, rule, value });
        let passed = false;
        let details = '';
        let actualValue;

        try {
          actualValue = this.getNestedValue(processedContent, field);
        } catch (error) {
          logger.warn('Error accessing field for check', { field, error: error.message });
          checkResults.push({ ...check, passed: false, details: `Error accessing field: ${error.message}`, actualValue: undefined });
          allChecksPassed = false;
          continue;
        }

        switch (rule) {
          case 'contains':
            passed = String(actualValue).includes(String(value));
            details = `Checked if ${field} contains: "${value}"`;
            break;
          case 'exact_match':
            passed = actualValue === value;
            details = `Checked if ${field} exactly matches: "${value}"`;
            break;
          case 'starts_with':
            passed = String(actualValue).startsWith(String(value));
            details = `Checked if ${field} starts with: "${value}"`;
            break;
          case 'ends_with':
            passed = String(actualValue).endsWith(String(value));
            details = `Checked if ${field} ends with: "${value}"`;
            break;
          case 'greater_than':
            passed = Number(actualValue) > Number(value);
            details = `Checked if ${field} is greater than: ${value}`;
            break;
          case 'less_than':
            passed = Number(actualValue) < Number(value);
            details = `Checked if ${field} is less than: ${value}`;
            break;
          case 'equals':
            passed = actualValue == value;
            details = `Checked if ${field} equals: "${value}"`;
            break;
          case 'context_match':
            logger.info('Performing context match check');
            const contextMatchScore = await this.checkContextMatch(String(actualValue), String(value));
            passed = contextMatchScore >= 0.6;
            details = `Context match score: ${contextMatchScore.toFixed(2)}. Threshold: 0.6`;
            break;
          default:
            logger.warn('Unimplemented check rule', { rule });
            passed = false;
            details = 'Check rule not implemented';
        }

        logger.info('Check result', { field, rule, passed, details });
        checkResults.push({ ...check, passed, details, actualValue });
        if (!passed) allChecksPassed = false;
      }

      const testResult = allChecksPassed ? "pass" : "fail";
      logger.info('Input test completed', { testResult, checksPerformed: checks.length });
      return {
        test_result: testResult,
        checks: checkResults,
        processedContent: inputType === "voice" ? processedContent.transcript : undefined
      };
    } catch (error) {
      logger.error('Error during input test', { inputType, error: error.message, stack: error.stack });
      throw error;
    }
  }

  static async processVoiceInput(content) {
      logger.info('Processing voice input');
      const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
      const audioBuffer = Buffer.from(content, 'base64');
      
      try {
          const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
              audioBuffer,
              {
                  model: "nova-2",
                  smart_format: true,
              }
          );
          
          if (error) throw error;
          
          logger.info('Voice input processed successfully');
          return {
              transcript: result.results.channels[0].alternatives[0].transcript,
              fullResult: result
          };
      } catch (error) {
          logger.error('Error in Deepgram transcription', { error: error.message, stack: error.stack });
          throw error;
      }
  }

  static processNonVoiceInput(content) {
      logger.info('Processing non-voice input');
      if (typeof content === 'string') {
          try {
              return JSON.parse(content);
          } catch (error) {
              logger.warn('Failed to parse content as JSON, returning as-is', { error: error.message });
              return content;
          }
      }
      return content;
  }

  static getNestedValue(obj, path) {
      logger.info('Getting nested value', { path });
      const keys = path.match(/\[(\d+)\]|\.?([^\.\[\]]+)/g);
      return keys.reduce((current, key) => {
          if (current === null || current === undefined) {
              return undefined;
          }
          if (key.startsWith('[') && key.endsWith(']')) {
              return current[parseInt(key.slice(1, -1), 10)];
          }
          return current[key.startsWith('.') ? key.slice(1) : key];
      }, obj);
  }

  static async checkContextMatch(transcription, expectedContext) {
    logger.info('Checking context match', { transcription: transcription.substring(0, 50) + '...', expectedContext: expectedContext.substring(0, 50) + '...' });
    return new Promise((resolve, reject) => {
      const prompt = `Compare these two statements and respond with a similarity score between 0 and 1, where 0 means completely different and 1 means identical in meaning:
        1. "${transcription}"
        2. "${expectedContext}"
        Provide only the numeric score as your response.`;

      const data = JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }]
      });

      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'x-api-key': process.env.CLUDE_API_KEYS,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = https.request(options, (res) => {
        let responseBody = '';

        res.on('data', (chunk) => {
          responseBody += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(responseBody);
            if (response.content && response.content.length > 0) {
              const score = parseFloat(response.content[0].text.trim());
              if (isNaN(score) || score < 0 || score > 1) {
                logger.error('Invalid score returned from Claude API', { score });
                reject(new Error('Invalid score returned from Claude API'));
              } else {
                logger.info('Context match check completed', { score });
                resolve(score);
              }
            } else {
              logger.error('Unexpected response structure from Claude API');
              reject(new Error('Unexpected response structure from Claude API'));
            }
          } catch (error) {
            logger.error('Failed to parse Claude API response', { error: error.message });
            reject(new Error('Failed to parse Claude API response'));
          }
        });
      });

      req.on('error', (error) => {
        logger.error('Error in Claude API request', { error: error.message });
        reject(error);
      });

      req.write(data);
      req.end();
    });
  }


}
    

module.exports = InputModel;