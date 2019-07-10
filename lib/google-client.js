/*
@exportId ehy5cSyNThiYtN6lrLhd7g
*/
module.exports = (function() {
return (ellipsis) => {
  const {google} = ellipsis.require('googleapis@38.0.0');
  return new google.auth.JWT({
    email: ellipsis.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: ellipsis.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/drive'],
    subject: ellipsis.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  });
  
};
})()
     