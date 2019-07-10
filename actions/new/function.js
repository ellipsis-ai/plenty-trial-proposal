function(name, ellipsis) {
  const drive = require('drive')(ellipsis);
const {Sheet} = ellipsis.require('ellipsis-gsheets@^0.0.1');

drive.copyFile(ellipsis.env.TRIAL_POLICY_TEMPLATE_SHEET_ID).
  then(res => {
    return drive.makeWritable(res.data.id).then(() => res.data.id);
  }).
  then(fileId => {
    const trackingSheet = new Sheet(ellipsis, ellipsis.env.TRIAL_POLICY_PROGRESS_SHEET_ID);
    const sheetUrl = `https://docs.google.com/spreadsheets/d/${fileId}`;
    const row = [name, sheetUrl, ellipsis.event.user.userIdForContext];
    return trackingSheet.append('Sheet1!A1', [row]).then(res => sheetUrl);
  }).
  then(sheetUrl => ellipsis.success(sheetUrl, {
    choices: [
      { 
        actionName: 'submit',
        label: 'Submit',
        args: [
          { name: 'sheetUrl', value: sheetUrl }
        ],
        allowMultipleSelections: true
      }
    ]
  }));
}
