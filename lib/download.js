const axios = require('axios');
const fs = require('fs');


module.exports = {
  components: async (url, componentPath) => {
    const writer = fs.createWriteStream(componentPath);

    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    });
  }
}
