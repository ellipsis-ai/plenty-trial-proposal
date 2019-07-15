function(sheetUrl, manager, ellipsis) {
  const trackingSheet = require('tracking-sheet')(ellipsis);
const EllipsisApi = require('ellipsis-api');
const api = new EllipsisApi(ellipsis);
const SlackUser = require('SlackUser');

const usersMentioned = ellipsis.event.message ? ellipsis.event.message.usersMentioned : [];
const managerSlackId = usersMentioned.filter(ea => `@${ea.userName}` == manager)[0].userIdForContext;
const managerSlackUser = new SlackUser(managerSlackId, manager);
trackingSheet.submit(sheetUrl, managerSlackUser).then(rowsUpdated => {
  if (rowsUpdated > 0) {
    const requesterSlackUser = new SlackUser(ellipsis.event.user.userIdForContext, `@${ellipsis.event.user.userName}`);
    trackingSheet.requestApproval(sheetUrl, requesterSlackUser, managerSlackUser).then(ellipsis.success(`${manager} will be notified`));
  } else {
    ellipsis.success(`Can't find a matching proposal for spreadsheet: ${sheetUrl}`);
  }
});
}
