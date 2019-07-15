function(approver, sheetUrl, status, ellipsis) {
  const trackingSheet = require('tracking-sheet')(ellipsis);
const EllipsisApi = require('ellipsis-api');
const api = new EllipsisApi(ellipsis);
const SlackUser = require('SlackUser');
const approverSlackUser = SlackUser.fromCellText(approver);

trackingSheet.approve(sheetUrl, approverSlackUser, status).then(rowsUpdated => {
  if (rowsUpdated > 0) {
    ellipsis.success(`Got it!`);
  } else {
    ellipsis.success(`Can't find a matching proposal for spreadsheet: ${sheetUrl}`);
  }
});
}
