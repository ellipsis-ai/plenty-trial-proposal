function(reviewerText, sheetUrl, ellipsis) {
  const trackingSheet = require('tracking-sheet')(ellipsis);
const EllipsisApi = require('ellipsis-api');
const api = new EllipsisApi(ellipsis);
const SlackUser = require('SlackUser');
const reviewer = SlackUser.fromCellText(reviewerText);

trackingSheet.setApproval(sheetUrl, reviewer, 'Approved').then(rowsUpdated => {
  if (rowsUpdated > 0) {
    ellipsis.success(`Got it!`);
  } else {
    ellipsis.success(`Can't find a matching proposal for spreadsheet: ${sheetUrl}`);
  }
});
}
