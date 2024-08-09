const https = require('https');
const supabase = require('../supabaseClient.js');
const { VALID_CHECKS } = require('../constants.js');
const { createClient } = require("@deepgram/sdk");
require("dotenv").config({ path: '.env.local' });

class InputModel {
    static async saveInput(userId, description, inputType, content, project_id, group_id, checks, sequence, url, apiType, method, headers, query_params, content_type) {
        if (group_id !== null) {
          await this.validateSequence(group_id, sequence);
          // Check if the group already has inputs and if their type matches the new input
          const { data: existingInputs, error: fetchError } = await supabase
            .from('collections')
            .select('input_type')
            .eq('group_id', group_id)
            .limit(1);
          
          if (fetchError) throw fetchError;
          
          if (existingInputs.length > 0 && existingInputs[0].input_type !== inputType) {
            throw new Error(`Type mismatch with existing inputs in the group. The group contains ${existingInputs[0].input_type} inputs. Please create a new group for ${inputType} inputs.`);
          }
        }
        let fileName = null;
        let textContent = null;
        let audioBase64 = null;

        if (inputType == "voice") {

          fileName = `voice_${Date.now()}.wav`;
          const audioBlob = Buffer.from(content, 'base64');
        
        // Upload audio to Supabase Storage
          const { data: fileData, error: fileError } = await supabase.storage
              .from('audio')
              .upload("public/"+fileName, audioBlob);

          if (fileError) throw fileError;
          audioBase64 = content;

        } else if (inputType === 'text') {
          textContent = content;
        } else {
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

        // Save metadata to Supabase table
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
        return { data: [standardizedOutput] };
    }

    static async getInputs(projectId) {
      // Fetch project details
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
  
      if (projectError) throw projectError;
  
      // Fetch inputs directly associated with the project
      const { data: projectInputs, error: inputsError } = await supabase
        .from('collections')
        .select('*')
        .eq('project_id', projectId)
        .is('group_id', null)
        .order('created_at');
  
      if (inputsError) throw inputsError;
  
      // Fetch groups associated with the project
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at');
  
      if (groupsError) throw groupsError;
  
      // Standardize inputs
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
  
      // Fetch and standardize inputs for each group
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
  
      // Standardize project inputs
      const standardizedProjectInputs = await Promise.all(projectInputs.map(standardizeInput));
  
      // Combine all data
      const data = {
        ...project,
        inputs: standardizedProjectInputs,
        groups: groupsWithInputs
      };
  
      return data;
    }
  
    // Helper method to get audio as base64
    static async getAudioBase64(fileName) {
      if (!fileName) return null;
      
      const { data: audioBlob, error: audioError } = await supabase.storage
        .from('audio')
        .download(`public/${fileName}`);
  
      if (audioError) throw audioError;
  
      const arrayBuffer = await audioBlob.arrayBuffer();
      return Buffer.from(arrayBuffer).toString('base64');
    }
    
    // Helper method to get audio as base64
    static async getAudioBase64(fileName) {
      const { data: audioBlob, error: audioError } = await supabase.storage
        .from('audio')
        .download(`public/${fileName}`);
    
      if (audioError) throw audioError;
    
      const arrayBuffer = await audioBlob.arrayBuffer();
      return Buffer.from(arrayBuffer).toString('base64');
    }

    static async deleteInput(userId, uuid) {
      // First, get the input entry to retrieve the file name if it's a voice input
      const { data: inputData, error: fetchError } = await supabase
          .from('collections')
          .select('file_name, id, input_type')
          .eq('uuid', uuid)
          .eq('created_by', userId)
          .single();

      if (fetchError) throw fetchError;
      if (!inputData) throw new Error('Input entry not found');

      // If it's a voice input, delete the file from storage
      if (inputData.input_type === 'voice') {
          const { error: storageError } = await supabase.storage
              .from('audio')
              .remove([`public/${inputData.file_name}`]);

          if (storageError) throw storageError;
      }

      // Delete the entry from the collections table
      const { error: deleteError } = await supabase
          .from('collections')
          .delete()
          .match({ id: inputData.id, created_by: userId });

      if (deleteError) throw deleteError;

      return { message: 'Input deleted successfully' };
  }


    static async validateSequence(groupId, newSequence) {
        // Get all collections for the group
        const { data: collections, error } = await supabase
            .from('collections')
            .select('sequence')
            .eq('group_id', groupId);

        if (error) throw error;

        const sequences = collections.map(c => c.sequence);
        sequences.push(newSequence);

        // Check if all sequences are unique
        const uniqueSequences = new Set(sequences);
        if (uniqueSequences.size !== sequences.length) {
            throw new Error('Sequence numbers must be unique within a group');
        }

        // Check if sequences are consecutive from 1 to N
        const sortedSequences = Array.from(uniqueSequences).sort((a, b) => a - b);
        if (sortedSequences[0] !== 1 || sortedSequences[sortedSequences.length - 1] !== sortedSequences.length) {
            throw new Error('Sequence numbers must be consecutive from 1 to N');
        }
    }

    static async testInput(inputType, content, checks) {
      let processedContent;

      if (inputType === "voice") {
          processedContent = await this.processVoiceInput(content);
      } else {
          processedContent = this.processNonVoiceInput(content);
      }

      // Perform checks
      const checkResults = [];
      let allChecksPassed = true;

      for (const check of checks) {
          const { field, rule, value } = check;
          let passed = false;
          let details = '';
          let actualValue;

          try {
              actualValue = this.getNestedValue(processedContent, field);
          } catch (error) {
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
              case 'greater_than':
                  passed = Number(actualValue) > Number(value);
                  details = `Checked if ${field} is greater than: ${value}`;
                  break;
              case 'less_than':
                  passed = Number(actualValue) < Number(value);
                  details = `Checked if ${field} is less than: ${value}`;
                  break;
              case 'equals':
                  passed = actualValue == value; // Using loose equality for flexibility
                  details = `Checked if ${field} equals: "${value}"`;
                  break;
              case 'word_count':
                  const wordCount = String(actualValue).split(/\s+/).length;
                  passed = wordCount === parseInt(value, 10);
                  details = `Expected word count: ${value}, Actual: ${wordCount}`;
                  break;
              case 'context_match':
                  passed = await this.checkContextMatch(String(actualValue), String(value));
                  details = `Checked for context match: "${value}"`;
                  break;
              // Add more checks as needed
              default:
                  passed = false;
                  details = 'Check rule not implemented';
          }

          checkResults.push({ ...check, passed, details, actualValue });
          if (!passed) allChecksPassed = false;
      }

      return {
          test_result: allChecksPassed ? "pass" : "fail",
          checks: checkResults,
          processedContent: inputType === "voice" ? processedContent.transcript : undefined
      };
  }


  static async processVoiceInput(content) {
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
        
        return {
            transcript: result.results.channels[0].alternatives[0].transcript,
            fullResult: result
        };
    } catch (error) {
        console.error('Error in Deepgram transcription:', error);
        throw error;
    }
}

static processNonVoiceInput(content) {
    if (typeof content === 'string') {
        try {
            return JSON.parse(content);
        } catch (error) {
            // If it's not valid JSON, return it as-is
            return content;
        }
    }
    return content; // If it's already an object, return as-is
}

static getNestedValue(obj, path) {
  const keys = path.match(/\[(\d+)\]|\.?([^\.\[\]]+)/g);
  return keys.reduce((current, key) => {
      if (current === null || current === undefined) {
          return undefined;
      }
      if (key.startsWith('[') && key.endsWith(']')) {
          // Array index
          return current[parseInt(key.slice(1, -1), 10)];
      }
      // Object property (remove leading '.' if present)
      return current[key.startsWith('.') ? key.slice(1) : key];
  }, obj);
}

    static cleanText(text) {
        if (typeof text !== 'string') return text;
        return text.toLowerCase().replace(/[^\w\s]|_/g, "").trim();
    }

    static async checkContextMatch(transcription, expectedContext) {
      return new Promise((resolve, reject) => {
        const prompt = `Compare these two statements and respond with only 'yes' or 'no':
        1. "${transcription}"
        2. "${expectedContext}"
        Do these statements convey the same meaning or context?`;

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
                const answer = response.content[0].text.trim().toLowerCase();
                resolve(answer === 'yes');
              } else {
                reject(new Error('Unexpected response structure from Claude API'));
              }      
            } catch (error) {
              reject(new Error('Failed to parse Claude API response'));
            }
          });
        });
    
        req.on('error', (error) => {
          reject(error);
        });
    
        req.write(data);
        req.end();
      });
    }

    }
    

module.exports = InputModel;