/*
@exportId Ry5GIZffR_-DFde2PK2blg
*/
module.exports = (function() {
const EllipsisApi = require('ellipsis-api');
const SlackUser = require('SlackUser');

const requesterColumn = 'C';
const submissionColumn = 'D';
const managerColumn = 'E';
const managerApprovalColumn = 'F';

function columnNumberFor(letter) {
  return letter.charCodeAt(0) - 65;
}

class TrackingSheet {

  constructor(ellipsis) {
    const {Sheet} = ellipsis.require('ellipsis-gsheets@^0.0.1');
    this.sheet = new Sheet(ellipsis, ellipsis.env.TRIAL_POLICY_PROGRESS_SHEET_ID);
    this.sheetName = ellipsis.env.TRIAL_POLICY_PROGRESS_SHEET_NAME;
    this.ellipsis = ellipsis;
  }

  fetchRows() {
    return this.sheet.get(`${this.sheetName}!A1:Z1000`);
  }

  updateRow(sheetUrl, rowColumnRange, data) {
    return this.sheet.update(`${this.sheetName}!${rowColumnRange}`, data);
  }

  withMatchingRowAndIndexFor(sheetUrl, fn) {
    return this.fetchRows().then(rows => {
      const index = rows.findIndex(ea => ea[1] === sheetUrl);
      return fn(rows[index], index);
    });
  }

  submit(sheetUrl, manager) {
    return this.withMatchingRowAndIndexFor(sheetUrl, (row, index) => {
      if (index > -1) {
        const submissionTimestamp = (new Date()).toString();
        const data = [[submissionTimestamp, manager.cellText()]];
        return this.updateRow(sheetUrl, `${submissionColumn}${index+1}:${managerColumn}${index+1}`, data)
      } else {
        return Promise.resolve(0);
      }
    });
  }

  requestApproval(sheetUrl, requester, approver) {
    const api = new EllipsisApi(this.ellipsis);  
    return api.run({
      actionName: 'requestApproval',
      args: [
        { name: 'sheetUrl', value: sheetUrl },
        { name: 'requester', value: requester.cellText() },
        { name: 'approver', value: approver.cellText() }
      ],
      channel: approver.id
    });
  }

  approve(sheetUrl, approver, status) {
    return this.withMatchingRowAndIndexFor(sheetUrl, (row, index) => {
      if (index > -1) {
        return this.fetchApprovers().then(approvers => {
          const data = [[status]];
          const manager = SlackUser.fromCellText(row[columnNumberFor(managerColumn)]);
          const requester = SlackUser.fromCellText(row[columnNumberFor(requesterColumn)]);
          if (approver.id === manager.id) {
            return this.updateRow(sheetUrl, `${managerApprovalColumn}${index+1}:${managerApprovalColumn}${index+1}`, data).then(updateCount => {
              const otherApprovers = approvers.filter(ea => ea.id !== manager.id);
              return Promise.all(otherApprovers.map(eaApprover => {
                return this.requestApproval(sheetUrl, requester, eaApprover);
              })).then(() => updateCount);
            });
          } else {
            const approverIndex = approvers.indexOf(approver);
            if (approverIndex > -1) {
              const approverColumnIndex = columnNumberFor(managerApprovalColumn) + 1 + approverIndex;
              const approverColumn = String.fromCharCode(65 + approverColumnIndex);
              return this.updateRow(sheetUrl, `${approverColumn}${index+1}:${approverColumn}${index+1}`, data);
            } else {
              return Promise.resolve(0);
            }
          }
        });
      } else {
        return Promise.resolve(0);
      }
    });
  }

  fetchApprovers() {
    return this.fetchRows().then(rows => {
      return rows[0].slice(columnNumberFor(managerApprovalColumn) + 1).map(SlackUser.fromCellText);
    });
  }
  
}

return ellipsis => new TrackingSheet(ellipsis);
})()
     