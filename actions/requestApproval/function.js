function(requester, sheetUrl, reviewerText, ellipsis) {
  const SlackUser = require('SlackUser');
const requesterSlackUser = SlackUser.fromCellText(requester);
const reviewer = SlackUser.fromCellText(reviewerText);

if (reviewer) {
  ellipsis.success({ requesterLink: requesterSlackUser.link() }, {
    choices: [
      {
        actionName: 'approve',
        label: 'Approve',
        args: [
          { name: 'reviewerText', value: reviewer.cellText() },
          { name: 'sheetUrl', value: sheetUrl }
        ],
        allowOthers: true
      },
      {
        actionName: 'reject',
        label: 'Reject',
        args: [
          { name: 'reviewerText', value: reviewer.cellText() },
          { name: 'sheetUrl', value: sheetUrl }
        ],
        allowOthers: true
      }
    ]
  });
} else {
  ellipsis.error("No reviewer!");
}
}
