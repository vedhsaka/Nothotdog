const https = require('https');
const supabase = require('../supabaseClient.js');
const { VALID_CHECKS } = require('../constants.js');
const { createClient } = require("@deepgram/sdk");
require("dotenv").config({ path: '.env.local' });

class InputModel {
    static async saveInput(userId, description, inputType, content, project_id, group_id, checks, sequence) {
        if (group_id !== null) {
          await this.validateSequence(group_id, sequence);
        }

        let fileName = null;
        let textContent = null;

        if (inputType == "voice") {

          fileName = `voice_${Date.now()}.wav`;
          const audioBlob = Buffer.from(content, 'base64');
        
        // Upload audio to Supabase Storage
          const { data: fileData, error: fileError } = await supabase.storage
              .from('audio')
              .upload("public/"+fileName, audioBlob);

          if (fileError) throw fileError;
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
          group_id: group_id
        };

        // Save metadata to Supabase table
        const { data, error } = await supabase
            .from('collections')
            .insert(insertObject)
            .select();

        if (error) throw error;
        return { data };
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
    
      // Fetch inputs for each group
      const groupsWithInputs = await Promise.all(groups.map(async (group) => {
        const { data: groupInputs, error: groupInputsError } = await supabase
          .from('collections')
          .select('*')
          .eq('group_id', group.id)
          .order('sequence');
    
        if (groupInputsError) throw groupInputsError;

        const processedInputs = await Promise.all(groupInputs.map(async (input) => {
            if (input.input_type === 'voice') {
                input.audioBase64 = await this.getAudioBase64(input.file_name);
            }
            return input;
        }));

        return {
          ...group,
          inputs: processedInputs
        };
      }));

      // Add audio to project Inputs
      const processedProjectInputs = await Promise.all(projectInputs.map(async (input) => {
        if (input.input_type === 'voice') {
            input.audioBase64 = await this.getAudioBase64(input.file_name);
        }
        return input;
      }));
    
      // Combine all data
      const result = {
        ...project,
        inputs: processedProjectInputs,
        groups: groupsWithInputs
      };
    
      return result;
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
        // Validate checks
        const validatedChecks = {};
        for (const [key, value] of Object.entries(checks)) {
            if (VALID_CHECKS.includes(key)) {
                validatedChecks[key] = value;
            }
        }

        let cleanContent = '';
        let transcription = '';

        if (inputType === "voice") {
            // Create a Deepgram client
            const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
            
            // Convert base64 to Buffer
            const audioBuffer = Buffer.from(content, 'base64');
            
            try {
                // Transcribe the audio using Deepgram
                const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
                    audioBuffer,
                    {
                        model: "nova-2",
                        smart_format: true,
                    }
                );
                
                if (error) throw error;
                
                // Process the transcription result
                transcription = result.results.channels[0].alternatives[0].transcript;
                cleanContent = this.cleanText(transcription);
            } catch (error) {
                console.error('Error in Deepgram transcription:', error);
                throw error;
            }
        } else if (inputType === "text") {
            cleanContent = this.cleanText(content);
        } else {
            throw new Error('Invalid input type');
        }

        // Perform checks
        const checkResults = {};
        let allChecksPassed = true;

        for (const [key, value] of Object.entries(validatedChecks)) {
            const cleanValue = this.cleanText(value);
            let passed = false;
            let details = '';

            switch (key) {
                case 'contains':
                    passed = cleanContent.includes(cleanValue);
                    details = `Checked for: "${value}"`;
                    break;
                case 'exact_match':
                    passed = cleanContent === cleanValue;
                    details = `Checked for exact match: "${value}"`;
                    break;
                case 'begins_with':
                    passed = cleanContent.startsWith(cleanValue);
                    details = `Checked for beginning with: "${value}"`;
                    break;
                case 'ends_with':
                    passed = cleanContent.endsWith(cleanValue);
                    details = `Checked for ending with: "${value}"`;
                    break;
                case 'word_count':
                    const wordCount = cleanContent.split(/\s+/).length;
                    passed = wordCount === parseInt(value, 10);
                    details = `Expected: ${value}, Actual: ${wordCount}`;
                    break;
                case 'context_match':
                    passed = await this.checkContextMatch(cleanContent, cleanValue);
                    details = `Checked for context match: "${value}"`;
                    break;
                // Add more checks as needed
                default:
                    passed = false;
                    details = 'Check not implemented';
            }

            checkResults[key] = { passed, details };
            if (!passed) allChecksPassed = false;
        }

        return {
            test_result: allChecksPassed ? "pass" : "fail",
            checks: checkResults,
            transcription: inputType === "voice" ? transcription : undefined
        };
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