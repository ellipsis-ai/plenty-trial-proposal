function(sheetUrl, ellipsis) {
  const {Sheet} = ellipsis.require('ellipsis-gsheets@^0.0.1');

const trackingSheet = new Sheet(ellipsis, ellipsis.env.TRIAL_POLICY_PROGRESS_SHEET_ID);
trackingSheet.get('Sheet1!A1:Z1000').then(rows => {
  const matchIndex = rows.findIndex(ea => ea[1] === sheetUrl);
  if (matchIndex > -1) {
    trackingSheet.update(`Sheet1!D${matchIndex+1}:D${matchIndex+1}`, [[(new Date()).toString()]]).then(() => {
      ellipsis.success(`Found it on row ${matchIndex}`);
    })
  } else {
    ellipsis.success("Can't find a matching proposal");
  }
})
}
