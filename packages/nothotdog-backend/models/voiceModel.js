const https = require('https');
const supabase = require('../supabaseClient.js');
const { VALID_CHECKS } = require('../constants.js');
const { createClient } = require("@deepgram/sdk");
require("dotenv").config({ path: '.env.local' });

class VoiceModel {
    static async saveVoice(userId, description, audioBlob, project_id, group_id, checks, sequence) {
        if (group_id !== null) {
          await this.validateSequence(group_id, sequence);
        }
        const fileName = `voice_${Date.now()}.wav`;
        
        // Upload audio to Supabase Storage
        const { data: fileData, error: fileError } = await supabase.storage
            .from('audio')
            .upload("public/"+fileName, audioBlob);


        if (fileError) throw fileError;
        const insertObject = {
          created_by: userId,
          description: description,
          file_name: fileName,
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

    static async getVoices(projectId) {
      // Fetch project details
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
    
      if (projectError) throw projectError;
    
      // Fetch voices directly associated with the project
      const { data: projectVoices, error: voicesError } = await supabase
        .from('collections')
        .select('*')
        .eq('project_id', projectId)
        .is('group_id', null)
        .order('created_at');
    
      if (voicesError) throw voicesError;
    
      // Fetch groups associated with the project
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at');
    
      if (groupsError) throw groupsError;
    
      // Fetch voices for each group
      const groupsWithVoices = await Promise.all(groups.map(async (group) => {
        const { data: groupVoices, error: groupVoicesError } = await supabase
          .from('collections')
          .select('*')
          .eq('group_id', group.id)
          .order('sequence');
    
        if (groupVoicesError) throw groupVoicesError;
        return {
          ...group,
          voices: await Promise.all(groupVoices.map(async (voice) => ({
            ...voice,
            audioBase64: await this.getAudioBase64(voice.file_name)
          })))
        };
      }));
    
      // Add audio to project voices
      const projectVoicesWithAudio = await Promise.all(projectVoices.map(async (voice) => ({
        ...voice,
        audioBase64: await this.getAudioBase64(voice.file_name)
      })));
    
      // Combine all data
      const result = {
        ...project,
        voices: projectVoicesWithAudio,
        groups: groupsWithVoices
      };
    
      return { data: [result] };
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

    static async deleteVoice(userId, uuid) {
      // First, get the voice entry to retrieve the file name
      const { data: voiceData, error: fetchError } = await supabase
        .from('collections')
        .select('file_name, id')
        .eq('uuid', uuid)
        .eq('created_by', userId)
        .single();
  
      if (fetchError) throw fetchError;
      if (!voiceData) throw new Error('Voice entry not found');
  
      // Delete the file from storage
      const { error: storageError } = await supabase.storage
        .from('audio')
        .remove([`public/${voiceData.file_name}`]);
  
      if (storageError) throw storageError;
  
      // Delete the entry from the collections table
      const { error: deleteError } = await supabase
        .from('collections')
        .delete()
        .match({ id: voiceData.id, created_by: userId });
  
      if (deleteError) throw deleteError;
  
      return { message: 'Voice deleted successfully' };
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

    static async testVoice(audioBase64, checks) {
      // Validate checks
      const validatedChecks = {};
      for (const [key, value] of Object.entries(checks)) {
        if (VALID_CHECKS.includes(key)) {
          validatedChecks[key] = value;
        }
      }
    
      // Create a Deepgram client
      const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
    
      // Convert base64 to Buffer
      const audioBuffer = Buffer.from(audioBase64, 'base64');
    
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
        const transcription = result.results.channels[0].alternatives[0].transcript;
        
        // Helper function to clean text
        const cleanText = (text) => {
          if (typeof text !== 'string') return text;
          return text.toLowerCase().replace(/[^\w\s]|_/g, "").trim();
        };
    
        // Perform checks
        const checks = {};
        let allChecksPassed = true;
    
        for (const [key, value] of Object.entries(validatedChecks)) {
          const cleanTranscription = cleanText(transcription);
          const cleanValue = cleanText(value);
    
          let passed = false;
          let details = '';
    
          switch (key) {
            case 'contains':
              passed = cleanTranscription.includes(cleanValue);
              details = `Checked for: "${value}"`;
              break;
            case 'exact_match':
              passed = cleanTranscription === cleanValue;
              details = `Checked for exact match: "${value}"`;
              break;
            case 'begins_with':
              passed = cleanTranscription.startsWith(cleanValue);
              details = `Checked for beginning with: "${value}"`;
              break;
            case 'ends_with':
              passed = cleanTranscription.endsWith(cleanValue);
              details = `Checked for ending with: "${value}"`;
              break;
            case 'word_count':
              const wordCount = cleanTranscription.split(/\s+/).length;
              passed = wordCount === value;
              details = `Expected: ${value}, Actual: ${wordCount}`;
              break;
            case 'context_match':
              passed = await this.checkContextMatch(cleanTranscription, cleanValue);
              details = `Checked for context match: "${value}"`;
              break;
            // Add more checks as needed
            default:
              passed = false;
              details = 'Check not implemented';
          }
    
          checks[key] = { passed, details };
          if (!passed) allChecksPassed = false;
        }
    
        return { 
          test_result: allChecksPassed ? "pass" : "fail",
          checks,
          transcription // You can remove this if you don't need it
        };
    
      } catch (error) {
        console.error('Error in Deepgram transcription:', error);
        throw error;
      }
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


    //   static async deleteVoice(groupId, uuid) {
    //     // First, get the voice entry to retrieve the file name
    //     const { data: voiceData, error: fetchError } = await supabase
    //       .from('collections')
    //       .select('file_name, id, sequence')
    //       .eq('uuid', uuid)
    //       .eq('group_id', groupId)
    //       .single();
    
    //     if (fetchError) throw fetchError;
    //     if (!voiceData) throw new Error('Voice entry not found');
    
    //     // Delete the file from storage
    //     const { error: storageError } = await supabase.storage
    //       .from('audio')
    //       .remove([`public/${voiceData.file_name}`]);
    
    //     if (storageError) throw storageError;
    
    //     // Delete the entry from the collections table
    //     const { error: deleteError } = await supabase
    //       .from('collections')
    //       .delete()
    //       .match({ id: voiceData.id, group_id: groupId });
    
    //     if (deleteError) throw deleteError;

    //     // Reorder sequences
    //     await this.reorderSequences(groupId, voiceData.sequence);
    
    //     return { message: 'Voice deleted successfully' };
    // }

    // static async reorderSequences(groupId, deletedSequence) {
    //     const { data: collections, error } = await supabase
    //         .from('collections')
    //         .select('id, sequence')
    //         .eq('group_id', groupId)
    //         .order('sequence');

    //     if (error) throw error;

    //     for (let i = 0; i < collections.length; i++) {
    //         if (collections[i].sequence > deletedSequence) {
    //             await supabase
    //                 .from('collections')
    //                 .update({ sequence: collections[i].sequence - 1 })
    //                 .eq('id', collections[i].id);
    //         }
    //     }
    // }

    }
    

module.exports = VoiceModel;