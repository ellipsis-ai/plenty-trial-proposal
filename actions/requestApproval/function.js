function(requester, sheetUrl, approver, ellipsis) {
  const SlackUser = require('SlackUser');
const requesterSlackUser = SlackUser.fromCellText(requester);
const approverSlackUser = SlackUser.fromCellText(approver);

if (approverSlackUser) {
  ellipsis.success({ requesterLink: requesterSlackUser.link() }, {
    choices: [
      {
        actionName: 'setApproval',
        label: 'Approve',
        args: [
          { name: 'approver', value: approverSlackUser.cellText() },
          { name: 'sheetUrl', value: sheetUrl },
          { name: 'status', value: 'Approved' }
        ],
        allowOthers: true
      },
      {
        actionName: 'setApproval',
        label: 'Reject',
        args: [
          { name: 'approver', value: approverSlackUser.cellText() },
          { name: 'sheetUrl', value: sheetUrl },
          { name: 'status', value: 'Rejected' }
        ],
        allowOthers: true
      }
    ]
  });
} else {
  ellipsis.error("No approver!");
}
}
