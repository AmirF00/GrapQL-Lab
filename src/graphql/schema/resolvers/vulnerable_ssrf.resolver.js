const axios = require('axios');
const fs = require('fs');
const path = require('path');

const vulnerableSSRFResolver = {
  Query: {
    // Vulnerable: Direct URL fetch without validation
    fetchExternalResource: async (_, { url }) => {
      try {
        const response = await axios.get(url);
        return {
          url,
          content: response.data,
          status: response.status
        };
      } catch (error) {
        throw new Error(`Failed to fetch: ${error.message}`);
      }
    },

    // Vulnerable: No URL validation for image fetching
    fetchProfileImage: async (_, { imageUrl }) => {
      try {
        const response = await axios.get(imageUrl, {
          responseType: 'arraybuffer'
        });
        const buffer = Buffer.from(response.data, 'binary');
        const fileName = `profile-${Date.now()}.jpg`;
        const filePath = path.join(__dirname, '../../../../uploads', fileName);
        
        fs.writeFileSync(filePath, buffer);
        return `/uploads/${fileName}`;
      } catch (error) {
        throw new Error(`Failed to fetch image: ${error.message}`);
      }
    },

    // Vulnerable: Internal network check
    checkWebhookStatus: async (_, { webhookUrl }) => {
      try {
        const response = await axios.get(webhookUrl);
        return response.status === 200;
      } catch (error) {
        return false;
      }
    }
  },

  Mutation: {
    // Vulnerable: Storing unvalidated webhook URL
    setWebhook: async (_, { url }) => {
      try {
        // Vulnerable: Testing webhook by making a request
        await axios.post(url, {
          test: true,
          timestamp: new Date().toISOString()
        });
        return true;
      } catch (error) {
        throw new Error(`Invalid webhook URL: ${error.message}`);
      }
    },

    // Vulnerable: Importing data from user-provided URL
    importDataFromUrl: async (_, { sourceUrl }) => {
      try {
        const response = await axios.get(sourceUrl);
        // Pretend to process the data
        return `Imported ${Object.keys(response.data).length} records`;
      } catch (error) {
        throw new Error(`Import failed: ${error.message}`);
      }
    }
  }
};

module.exports = vulnerableSSRFResolver; 