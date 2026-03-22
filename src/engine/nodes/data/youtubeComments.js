const BaseNode = require('../baseNode');
const { google } = require('googleapis');

class YouTubeComments extends BaseNode {
  static getMeta() {
    return {
      label: 'YouTube Comments',
      category: 'data',
      icon: 'youtube',
      color: '#ff0000',
      description: 'Fetch comments from a YouTube video',
      inputs: 1,
      outputs: 1,
    };
  }

  static getSchema() {
    return {
      fields: [
        { key: 'credentialId', type: 'credential', service: 'youtube', label: 'YouTube Credential', required: true },
        { key: 'videoId', type: 'string', label: 'Video ID', required: true },
      ],
    };
  }

  async execute() {
    const { credentialId, videoId } = this.config;
    const credential = await this.context.credentialService.getDecrypted(this.context.userId, credentialId);

    const youtube = google.youtube({ version: 'v3', auth: credential.apiKey });
    const comments = [];
    let pageToken;

    do {
      const response = await youtube.commentThreads.list({
        part: 'snippet',
        videoId,
        maxResults: 100,
        pageToken,
      });

      const items = response.data.items || [];
      for (const item of items) {
        const snippet = item.snippet.topLevelComment.snippet;
        comments.push({
          id: item.id,
          text: snippet.textDisplay,
          author: snippet.authorDisplayName,
          authorUrl: snippet.authorChannelUrl || '',
        });
      }
      pageToken = response.data.nextPageToken;
    } while (pageToken && comments.length < 100);

    return { comments };
  }
}

module.exports = YouTubeComments;
