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

  submit(sheetUrl, requester, manager) {
    return this.withMatchingRowAndIndexFor(sheetUrl, (row, index) => {
      if (index > -1) {
        const submissionTimestamp = (new Date()).toString();
        const data = [[submissionTimestamp, manager.cellText()]];
        return this.updateRow(sheetUrl, `${submissionColumn}${index+1}:${managerColumn}${index+1}`, data).then(updateCount => {
          const msg = `:microscope: ${requester.link()} has submitted a trial proposal:\n\n${sheetUrl}`;
          return this.notifyChannel(msg).then(() => updateCount);
        });
      } else {
        return Promise.resolve(0);
      }
    });
  }

  requestApproval(sheetUrl, requester, reviewer) {
    const api = new EllipsisApi(this.ellipsis);  
    return api.run({
      actionName: 'requestApproval',
      args: [
        { name: 'sheetUrl', value: sheetUrl },
        { name: 'requester', value: requester.cellText() },
        { name: 'reviewerText', value: reviewer.cellText() }
      ],
      channel: reviewer.id
    });
  }

  notifyRequester(sheetUrl, requester, reviewer, status, updateCount) {
    if (updateCount > 0) {
      const api = new EllipsisApi(this.ellipsis);  
      return api.run({
        actionName: 'notifyRequester',
        args: [
          { name: 'sheetUrl', value: sheetUrl },
          { name: 'reviewerText', value: reviewer.cellText() },
          { name: 'status', value: status }
        ],
        channel: requester.id
      }).then(() => {
        const msg = `:microscope: ${reviewer.link()} has ${status} trial proposed by ${requester.link()}:
        
        ${sheetUrl}`;
        return this.notifyChannel(msg);
      });
    } else {
      return Promise.resolve();
    }   
  }

  notifyChannel(message) {
    const api = new EllipsisApi(this.ellipsis);
    return api.say({
      message: message,
      channel: this.ellipsis.env.TRIAL_POLICY_PROGRESS_CHANNEL_ID
    });
  }

  setApproval(sheetUrl, reviewer, status, reason) {
    return this.withMatchingRowAndIndexFor(sheetUrl, (row, index) => {
      if (index > -1) {
        return this.fetchReviewers().then(reviewers => {
          const data = [[status]];
          const manager = SlackUser.fromCellText(row[columnNumberFor(managerColumn)]);
          const requester = SlackUser.fromCellText(row[columnNumberFor(requesterColumn)]);
          if (reviewer.id === manager.id) {
            return this.updateRow(sheetUrl, `${managerApprovalColumn}${index+1}:${managerApprovalColumn}${index+1}`, data).then(updateCount => {
              const otherReviewers = reviewers.filter(ea => ea.id !== manager.id);
              return Promise.all(otherReviewers.map(eaReviewer => {
                return this.requestApproval(sheetUrl, requester, eaReviewer);
              })).
                then(() => this.notifyRequester(sheetUrl, requester, reviewer, status, updateCount)).
                then(() => updateCount);
            });
          } else {
            const reviewerIndex = reviewers.findIndex(ea => ea.id === reviewer.id);
            if (reviewerIndex > -1) {
              const reviewerColumnIndex = columnNumberFor(managerApprovalColumn) + 1 + reviewerIndex;
              const reviewerColumn = String.fromCharCode(65 + reviewerColumnIndex);
              return this.updateRow(sheetUrl, `${reviewerColumn}${index+1}:${reviewerColumn}${index+1}`, data).then(updateCount => {
                return this.notifyRequester(sheetUrl, requester, reviewer, status, updateCount).then(() => updateCount);
              });
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

  fetchReviewers() {
    return this.fetchRows().then(rows => {
      return rows[0].slice(columnNumberFor(managerApprovalColumn) + 1).map(SlackUser.fromCellText);
    });
  }
  
}

return ellipsis => new TrackingSheet(ellipsis);
})()
     