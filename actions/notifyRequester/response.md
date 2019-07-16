{if successResult.isApproved}
Good news! {successResult.reviewerLink} has approved your trial proposal:

{sheetUrl}

{else}
{successResult.reviewerLink} has rejected your trial proposal:

{sheetUrl}

Reason: {successResult.reason}

You may want to discuss with them and see if their issues can be resolved.
{endif}
