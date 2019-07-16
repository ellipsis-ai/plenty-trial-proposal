function(sheetUrl, reviewerText, status, ellipsis) {
  const SlackUser = require('SlackUser');
const reviewer = SlackUser.fromCellText(reviewerText);

const isApproved = status === "Approved";
const reasonResult = /^Rejected:\s(.+)$/.exec(status);
const reason = reasonResult ? reasonResult[1] : "None given";
ellipsis.success({
  reviewerLink: reviewer.link(),
  isApproved: isApproved,
  reason: reason
});
}
