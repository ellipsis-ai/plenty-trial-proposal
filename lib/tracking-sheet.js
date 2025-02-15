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

class TrialMetadata {

  constructor(props) {
    this.trialNumber = props.trialNumber;
    this.trialName = props.trialName;
  }

  text() {
    let text = '';
    if (this.trialNumber) {
      text = text.concat(this.trialNumber);
    }
    if (this.trialNumber && this.trialName) {
      text = text.concat(': ');
    }
    if (this.trialName) {
      text = text.concat(this.trialName)
    }
    text = text.trim();
    if (text.length > 0) {
      text = ' '.concat(text);
    }
    return text;
  }
}

class TrackingSheet {

  constructor(ellipsis) {
    const {Sheet} = ellipsis.require('ellipsis-gsheets@^0.0.1');
    this.sheet = new Sheet(ellipsis, ellipsis.env.TRIAL_PROPOSAL_PROGRESS_SHEET_ID);
    this.sheetName = ellipsis.env.TRIAL_PROPOSAL_PROGRESS_SHEET_NAME;
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
          return this.proposalMetadataFor(sheetUrl).then(metadata => {
            const msg = `:microscope: ${requester.link()} has submitted a trial proposal${metadata.text()}:\n\n${sheetUrl}`;
            return this.notifyChannel(msg).then(() => updateCount);
          });
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

  fileIdFor(sheetUrl) {
    const regex = /https:\/\/docs.google.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/
    const result = regex.exec(sheetUrl);
    return result ? result[1] : undefined;
  }

  proposalMetadataFor(sheetUrl) {
    const fileId = this.fileIdFor(sheetUrl);
    if (fileId) {
      const {Sheet} = this.ellipsis.require('ellipsis-gsheets@^0.0.1');
      const sheet = new Sheet(this.ellipsis, this.fileIdFor(sheetUrl));
      return sheet.get(`Proposal!A1:B1`).then(rows => {
        return new TrialMetadata({
          trialNumber: rows[0][0],
          trialName: rows[0][1]
        });
      });
    } else {
      Promise.resolve({});
    }
  }

  isApprovalComplete(sheetUrl) {
    return this.withMatchingRowAndIndexFor(sheetUrl, (row, index) => {
      return this.fetchReviewers().then(reviewers => {
        const approvals = row.slice(columnNumberFor(managerApprovalColumn)).filter(ea => ea.trim() === "Approved");
        return approvals.length === reviewers.length + 1;
      });
    });
  }

  notifyRequester(sheetUrl, requester, reviewer, status, updateCount) {
    if (updateCount > 0) {
      const api = new EllipsisApi(this.ellipsis);
      return this.isApprovalComplete(sheetUrl).then(isComplete => {
        return api.run({
          actionName: 'notifyRequester',
          args: [
            { name: 'sheetUrl', value: sheetUrl },
            { name: 'reviewerText', value: reviewer.cellText() },
            { name: 'status', value: status },
            { name: 'isComplete', value: isComplete }
          ],
          channel: requester.id
        }).then(() => {
          return this.proposalMetadataFor(sheetUrl).then(metadata => {
            const msg = `:microscope: ${reviewer.link()} has reviewed trial${metadata.text()} proposed by ${requester.link()}:\n\n${sheetUrl}\n\nResult: ${status}`;
            const completeMsg = isComplete ? "\n\nThis proposal is now completely approved!" : "";
            return this.notifyChannel(msg.concat(completeMsg));
          });
        });
      });
    } else {
      return Promise.resolve();
    }   
  }

  notifyChannel(message) {
    const api = new EllipsisApi(this.ellipsis);
    return api.say({
      message: message,
      channel: this.ellipsis.env.TRIAL_PROPOSAL_PROGRESS_CHANNEL_ID
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
     