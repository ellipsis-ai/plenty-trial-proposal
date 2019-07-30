/*
@exportId bp0msdzPQGe-Tbn03ec0oQ
*/
module.exports = (function() {
return (ellipsis) => {
  const client = require('google-client')(ellipsis);
  const {google} = ellipsis.require('googleapis@38.0.0');
  const drive = google.drive({
    version: 'v3',
    auth: client
  });
  const utils = {
    copyFile: function(fileId) {
      return drive.files.copy({
        fileId: fileId,
        auth: client,
        resource: {
          parents: [
            ellipsis.env.TRIAL_PROPOSAL_DIRECTORY_ID
          ]
        }
      });
    },
    makeWritable: function(fileId) {
      return drive.permissions.create({
        fileId: fileId,
        resource: {
          role: 'writer',
          type: 'domain',
          domain: 'plenty.ag'
        },
        auth: client
      });
    }
  };
  return utils;
}
})()
     